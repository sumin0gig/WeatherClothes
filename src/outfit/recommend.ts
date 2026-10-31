import type { Weather } from '../weather/types';
import { getBand, getTargetApparentTemp } from './bands';
import { MATERIAL_LABEL, materialScore, tagScore } from './materialScore';
import { seededBool, seededPick, seededShuffle } from './seed';
import { getTags } from './tags';
import type { Category, ClothItem, Outfit, WeatherTag } from './types';

export type RecommendOptions = {
  /** 설정의 체감 보정값 (°C). 기본 0 */
  apparentOffset?: number;
};

const MAX_OPTIONAL_EXTRAS = 2;

/** 팁 문구를 만들 때 먼저 살펴볼 카테고리 순서 */
const TIP_PRIORITY: Category[] = [
  'bottom',
  'top',
  'onepiece',
  'outer',
  'inner',
  'legwear',
];

const TAG_REASON: Record<WeatherTag, string> = {
  rain: '비 소식',
  snow: '눈 소식',
  hot: '더운 날',
  humid: '습한 날',
  cold: '추운 날',
  windy: '바람 부는 날',
};

type CategoryPick = {
  item: ClothItem;
  /** 점수 때문에 밀려난 옷 중 가장 점수가 낮은 것 (없으면 undefined) */
  outscored?: ClothItem;
};

const byId = (a: ClothItem, b: ClothItem) =>
  a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** 받침이 있으면 '을', 없으면 '를' */
export function objectParticle(word: string): '을' | '를' {
  const last = word.charCodeAt(word.length - 1);
  if (last < 0xac00 || last > 0xd7a3) return '를';
  return (last - 0xac00) % 28 === 0 ? '를' : '을';
}

/**
 * 오늘의 옷차림을 고른다. 순수 함수 — 같은 입력이면 항상 같은 결과.
 *
 * @param dateKey 'YYYY-MM-DD'. 같은 날에는 같은 옷이 나오도록 시드로 쓴다.
 */
export function recommend(
  weather: Weather,
  catalog: readonly ClothItem[],
  excludedIds: readonly string[],
  dateKey: string,
  options: RecommendOptions = {},
): Outfit {
  const targetTemp = getTargetApparentTemp(
    weather,
    options.apparentOffset ?? 0,
  );
  const band = getBand(targetTemp);
  const tags = getTags(weather, band);
  const excluded = new Set(excludedIds);
  const score = (item: ClothItem) => materialScore(item.material, tags);

  // 1. 후보: 제외되지 않았고, 현재 구간에 맞고, 조건이 없거나 오늘 날씨와 겹치는 옷
  const pool = catalog
    .filter(item => !excluded.has(item.id))
    .filter(item => item.bands.includes(band))
    .filter(
      item => !item.conditions || item.conditions.some(c => tags.includes(c)),
    )
    .sort(byId);

  const candidatesOf = (category: Category) =>
    pool.filter(item => item.category === category);

  // 2. 카테고리별로 점수가 가장 높은 후보들 중 날짜 시드로 하나
  const pick = (category: Category): CategoryPick | undefined => {
    const candidates = candidatesOf(category);
    if (candidates.length === 0) return undefined;
    const best = Math.max(...candidates.map(score));
    const top = candidates.filter(item => score(item) === best);
    const item = seededPick(top, `${dateKey}:${category}`)!;
    const lower = candidates
      .filter(c => score(c) < best)
      .sort((a, b) => score(a) - score(b) || byId(a, b));
    return { item, outscored: lower[0] };
  };

  const picks: Partial<Record<Category, CategoryPick>> = {};

  // 3. 원피스 후보가 있으면 날짜 시드로 "원피스 vs 상하의"
  const hasOnepiece = candidatesOf('onepiece').length > 0;
  const useOnepiece = hasOnepiece && seededBool(`${dateKey}:onepiece`);

  // 4. outer 후보가 없으면(더운 날) 자연히 undefined
  picks.outer = pick('outer');
  picks.inner = pick('inner');
  if (useOnepiece) {
    picks.onepiece = pick('onepiece');
    picks.legwear = pick('legwear');
  } else {
    picks.top = pick('top');
    picks.bottom = pick('bottom');
  }

  // 5. 소품: 조건이 맞는 것(우산)은 항상, 나머지는 시드로 최대 2개
  const accs = candidatesOf('acc');
  const required = accs.filter(item => item.conditions);
  const optional = seededShuffle(
    accs.filter(item => !item.conditions),
    `${dateKey}:acc`,
  )
    .sort((a, b) => score(b) - score(a))
    .slice(0, MAX_OPTIONAL_EXTRAS);
  const extras = [...required, ...optional];

  // 6. 팁: 재질 점수 때문에 순위가 바뀐 경우 이유 한 줄
  const boostedIds = Object.values(picks)
    .filter((p): p is CategoryPick => !!p?.outscored)
    .map(p => p.item.id);

  let tip: string | undefined;
  let reasonTag: WeatherTag | undefined;
  for (const category of TIP_PRIORITY) {
    const p = picks[category];
    if (!p?.outscored) continue;
    reasonTag = dominantTag(tags, p.item, p.outscored);
    if (!reasonTag) continue;
    const picked = p.item;
    tip =
      `${TAG_REASON[reasonTag]} — ${p.outscored.name} 대신 ` +
      `${MATERIAL_LABEL[picked.material]} 소재 ${picked.name}${objectParticle(
        picked.name,
      )} 골랐어요`;
    break;
  }
  if (!tip && tags.includes('rain')) tip = '비 소식 · 우산 챙기기';
  if (!tip && tags.includes('snow')) tip = '눈 소식 · 따뜻하고 미끄럽지 않게';

  const hasUmbrella = extras.some(item => item.conditions?.includes('rain'));
  let shortTip: string | undefined;
  if (tags.includes('rain'))
    shortTip = hasUmbrella ? '비 소식 · 우산' : '비 소식';
  else if (tags.includes('snow')) shortTip = '눈 소식';
  else if (reasonTag) shortTip = TAG_REASON[reasonTag];

  return {
    band,
    targetTemp,
    tags,
    outer: picks.outer?.item,
    top: picks.top?.item,
    bottom: picks.bottom?.item,
    onepiece: picks.onepiece?.item,
    inner: picks.inner?.item,
    legwear: picks.legwear?.item,
    extras,
    boostedIds,
    tip,
    shortTip,
  };
}

/** 두 옷의 점수 차이를 가장 크게 만든 날씨 태그 */
function dominantTag(
  tags: WeatherTag[],
  winner: ClothItem,
  loser: ClothItem,
): WeatherTag | undefined {
  let best: WeatherTag | undefined;
  let bestDiff = 0;
  for (const tag of tags) {
    const diff = tagScore(tag, winner.material) - tagScore(tag, loser.material);
    if (diff > bestDiff) {
      best = tag;
      bestDiff = diff;
    }
  }
  return best;
}

/** 화면/위젯에 보여줄 순서대로 옷 목록 */
export function outfitItems(outfit: Outfit): ClothItem[] {
  return [
    outfit.outer,
    outfit.onepiece,
    outfit.top,
    outfit.inner,
    outfit.bottom,
    outfit.legwear,
    ...outfit.extras,
  ].filter((item): item is ClothItem => !!item);
}
