import { CATALOG } from '../src/outfit/catalog';
import {
  objectParticle,
  outfitItems,
  recommend,
} from '../src/outfit/recommend';
import type { ClothItem } from '../src/outfit/types';
import { makeWeather } from './helpers/fixtures';

const DAY = '2026-10-29';
const days = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(2026, 0, 1 + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(d.getDate()).padStart(2, '0')}`;
  });

describe('recommend — 기본', () => {
  it('구간에 맞는 옷만 고른다', () => {
    const outfit = recommend(
      makeWeather({ apparentTemp: 14 }),
      CATALOG,
      [],
      DAY,
    );
    expect(outfit.band).toBe(4);
    for (const item of outfitItems(outfit)) expect(item.bands).toContain(4);
  });

  it('같은 날에는 몇 번을 호출해도 같은 결과', () => {
    const w = makeWeather({ apparentTemp: 18 });
    const first = recommend(w, CATALOG, [], DAY);
    for (let i = 0; i < 10; i++)
      expect(recommend(w, CATALOG, [], DAY)).toEqual(first);
  });

  it('카탈로그 순서가 바뀌어도 같은 결과', () => {
    const w = makeWeather({ apparentTemp: 18 });
    const reversed = [...CATALOG].reverse();
    expect(recommend(w, reversed, [], DAY)).toEqual(
      recommend(w, CATALOG, [], DAY),
    );
  });

  it('날짜가 바뀌면 같은 점수의 후보들이 번갈아 나온다', () => {
    const w = makeWeather({ apparentTemp: 14 }); // 구간 4: 상의 맨투맨/긴팔 (둘 다 면)
    const tops = new Set(
      days(30).map(d => recommend(w, CATALOG, [], d).top?.id),
    );
    expect(tops).toEqual(
      new Set(['top_sweatshirt_cotton_01', 'top_longsleeve_cotton_01']),
    );
  });

  it('보정값이 구간을 바꾼다', () => {
    const w = makeWeather({ apparentTemp: 11 });
    expect(recommend(w, CATALOG, [], DAY).band).toBe(3);
    expect(recommend(w, CATALOG, [], DAY, { apparentOffset: 1 }).band).toBe(4);
    expect(
      recommend(w, CATALOG, [], DAY, { apparentOffset: 1 }).targetTemp,
    ).toBe(12);
  });
});

describe('recommend — 제외', () => {
  it('제외한 옷은 나오지 않는다', () => {
    const w = makeWeather({ apparentTemp: 14 });
    const excluded = ['top_sweatshirt_cotton_01'];
    for (const d of days(20)) {
      const outfit = recommend(w, CATALOG, excluded, d);
      expect(outfit.top?.id).toBe('top_longsleeve_cotton_01');
    }
  });

  it('후보를 모두 제외하면 그 카테고리는 비고 크래시하지 않는다', () => {
    const w = makeWeather({ apparentTemp: 14 });
    const outfit = recommend(
      w,
      CATALOG,
      ['top_sweatshirt_cotton_01', 'top_longsleeve_cotton_01'],
      DAY,
    );
    expect(outfit.top).toBeUndefined();
    expect(outfit.bottom).toBeDefined();
  });

  it('빈 카탈로그도 처리한다', () => {
    const outfit = recommend(makeWeather({ precipProb: 90 }), [], [], DAY);
    expect(outfitItems(outfit)).toEqual([]);
    expect(outfit.extras).toEqual([]);
    expect(outfit.tip).toBe('비 소식 · 우산 챙기기');
  });
});

describe('recommend — 재질 점수', () => {
  it('비 오는 날은 데님보다 폴리 소재를 고르고 이유를 알려준다', () => {
    const w = makeWeather({ apparentTemp: 14, precipProb: 70 });
    for (const d of days(15)) {
      const outfit = recommend(w, CATALOG, [], d);
      expect(outfit.tags).toContain('rain');
      expect(outfit.bottom?.id).toBe('bottom_slacks_polyester_01');
      expect(outfit.boostedIds).toContain('bottom_slacks_polyester_01');
      expect(outfit.tip).toBe(
        '비 소식 — 청바지 대신 폴리 소재 슬랙스를 골랐어요',
      );
      expect(outfit.shortTip).toBe('비 소식 · 우산');
    }
  });

  it('비 오는 날 폴리 바지를 제외하면 다음으로 점수 높은 옷', () => {
    const w = makeWeather({ apparentTemp: 14, precipProb: 70 });
    const outfit = recommend(w, CATALOG, ['bottom_slacks_polyester_01'], DAY);
    // 면바지(-2) > 청바지(-3)
    expect(outfit.bottom?.id).toBe('bottom_chino_cotton_01');
  });

  it('맑은 날에는 점수 차이가 없어 표시도 팁도 없다', () => {
    const outfit = recommend(
      makeWeather({ apparentTemp: 14 }),
      CATALOG,
      [],
      DAY,
    );
    expect(outfit.boostedIds).toEqual([]);
    expect(outfit.tip).toBeUndefined();
  });

  it('더운 날은 리넨을 우선한다', () => {
    const w = makeWeather({ apparentTemp: 25, humidity: 80 }); // 구간 7: 셔츠(리넨) vs 반팔(면)
    const outfit = recommend(w, CATALOG, [], DAY);
    expect(outfit.top?.id).toBe('top_shirt_linen_01');
    expect(outfit.tip).toMatch(/반팔 대신 리넨 소재 셔츠를 골랐어요$/);
  });
});

describe('recommend — 카테고리 규칙', () => {
  it('더운 날에는 아우터가 없다', () => {
    expect(
      recommend(makeWeather({ apparentTemp: 30 }), CATALOG, [], DAY).outer,
    ).toBeUndefined();
  });

  it('원피스 분기: 원피스면 상하의 없음, 아니면 상하의', () => {
    const w = makeWeather({ apparentTemp: 30 });
    const outfits = days(40).map(d => recommend(w, CATALOG, [], d));
    const withDress = outfits.filter(o => o.onepiece);
    const withoutDress = outfits.filter(o => !o.onepiece);
    expect(withDress.length).toBeGreaterThan(0);
    expect(withoutDress.length).toBeGreaterThan(0);
    for (const o of withDress) {
      expect(o.top).toBeUndefined();
      expect(o.bottom).toBeUndefined();
    }
    for (const o of withoutDress) {
      expect(o.top).toBeDefined();
      expect(o.bottom).toBeDefined();
      expect(o.legwear).toBeUndefined();
    }
  });

  it('원피스를 제외하면 항상 상하의', () => {
    const w = makeWeather({ apparentTemp: 30 });
    for (const d of days(20)) {
      const o = recommend(w, CATALOG, ['onepiece_dress_linen_01'], d);
      expect(o.onepiece).toBeUndefined();
      expect(o.top).toBeDefined();
    }
  });

  it('우산은 비 오는 날에만, 항상 포함', () => {
    const umbrella = 'acc_umbrella_polyester_01';
    for (const d of days(10)) {
      expect(
        recommend(
          makeWeather({ apparentTemp: 20, code: 63 }),
          CATALOG,
          [],
          d,
        ).extras.map(i => i.id),
      ).toContain(umbrella);
      expect(
        recommend(makeWeather({ apparentTemp: 20 }), CATALOG, [], d).extras.map(
          i => i.id,
        ),
      ).not.toContain(umbrella);
    }
  });

  it('조건 없는 소품은 최대 2개', () => {
    const w = makeWeather({ apparentTemp: 0 }); // 구간 1: 목도리/장갑/비니
    for (const d of days(10)) {
      const extras = recommend(w, CATALOG, [], d).extras;
      expect(extras.length).toBe(2);
      expect(new Set(extras.map(i => i.id)).size).toBe(2);
    }
  });

  it('추운 날에는 이너도 고른다', () => {
    const outfit = recommend(
      makeWeather({ apparentTemp: 3 }),
      CATALOG,
      [],
      DAY,
    );
    expect(outfit.inner?.id).toBe('inner_thermal_rayon_01');
  });

  it('조건이 있는 옷은 조건이 맞을 때만 후보', () => {
    const snowBoots: ClothItem = {
      id: 'acc_boots_nylon_01',
      name: '방한 부츠',
      category: 'acc',
      bands: [1],
      material: 'nylon',
      conditions: ['snow'],
    };
    const catalog = [...CATALOG, snowBoots];
    expect(
      recommend(makeWeather({ apparentTemp: 0, code: 73 }), catalog, [], DAY)
        .extras,
    ).toContainEqual(snowBoots);
    expect(
      recommend(makeWeather({ apparentTemp: 0 }), catalog, [], DAY).extras,
    ).not.toContainEqual(snowBoots);
  });
});

describe('objectParticle', () => {
  it.each([
    ['슬랙스', '를'],
    ['셔츠', '를'],
    ['청바지', '를'],
    ['울 코트', '를'],
    ['롱패딩', '을'],
    ['원피스', '를'],
    ['장갑', '을'],
  ])('%s%s', (word, particle) => {
    expect(objectParticle(word)).toBe(particle);
  });
});
