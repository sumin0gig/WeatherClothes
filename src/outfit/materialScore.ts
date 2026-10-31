import type { Material, WeatherTag } from './types';

/**
 * 날씨 태그별 재질 점수. 옷을 걸러내지 않고, 점수가 높은 재질을 우선 뽑는다.
 * 표에 없는 조합은 0점.
 */
export const MATERIAL_SCORE: Record<
  WeatherTag,
  Partial<Record<Material, number>>
> = {
  hot: {
    linen: 3,
    cotton: 2,
    rayon: 1,
    wool: -3,
    denim: -2,
    fleece: -3,
    leather: -3,
  },
  humid: { linen: 3, cotton: -1 },
  cold: { wool: 3, cashmere: 3, down: 3, fleece: 2, cotton: -1 },
  rain: {
    polyester: 3,
    nylon: 2,
    wool: 1,
    cotton: -2,
    denim: -3,
    suede: -5,
    down: -1,
  },
  snow: { nylon: 2, polyester: 2, down: 2, suede: -5 },
  windy: { nylon: 2, leather: 2, polyester: 1 },
};

export const tagScore = (tag: WeatherTag, material: Material): number =>
  MATERIAL_SCORE[tag][material] ?? 0;

export const materialScore = (material: Material, tags: WeatherTag[]): number =>
  tags.reduce((sum, tag) => sum + tagScore(tag, material), 0);

export const MATERIAL_LABEL: Record<Material, string> = {
  linen: '리넨',
  cotton: '면',
  denim: '데님',
  rayon: '레이온',
  wool: '울',
  cashmere: '캐시미어',
  fleece: '플리스',
  down: '다운',
  polyester: '폴리',
  nylon: '나일론',
  leather: '가죽',
  suede: '스웨이드',
};
