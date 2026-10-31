import type { Band, ClothItem } from './types';

const ALL_BANDS: Band[] = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * 초기 옷 카탈로그. id = 이미지 파일명(`${id}.png`) 규칙: 카테고리_이름_재질_번호
 * 구간 기준은 사용자가 쓰는 기온별 옷차림표.
 */
export const CATALOG: ClothItem[] = [
  {
    id: 'outer_padding_down_01',
    name: '롱패딩',
    category: 'outer',
    bands: [1],
    material: 'down',
  },
  {
    id: 'outer_coat_wool_01',
    name: '울 코트',
    category: 'outer',
    bands: [1, 2],
    material: 'wool',
  },
  {
    id: 'outer_leather_leather_01',
    name: '가죽자켓',
    category: 'outer',
    bands: [2],
    material: 'leather',
  },
  {
    id: 'outer_trench_polyester_01',
    name: '트렌치코트',
    category: 'outer',
    bands: [3],
    material: 'polyester',
  },
  {
    id: 'outer_field_cotton_01',
    name: '야상',
    category: 'outer',
    bands: [3, 4],
    material: 'cotton',
  },
  {
    id: 'outer_blazer_wool_01',
    name: '자켓',
    category: 'outer',
    bands: [3, 4],
    material: 'wool',
  },
  {
    id: 'outer_cardigan_cotton_01',
    name: '가디건',
    category: 'outer',
    bands: [4, 5, 6],
    material: 'cotton',
  },

  {
    id: 'top_knit_wool_01',
    name: '니트',
    category: 'top',
    bands: [1, 2, 3, 5],
    material: 'wool',
  },
  {
    id: 'top_sweatshirt_cotton_01',
    name: '맨투맨',
    category: 'top',
    bands: [4, 5],
    material: 'cotton',
  },
  {
    id: 'top_longsleeve_cotton_01',
    name: '긴팔',
    category: 'top',
    bands: [4, 6],
    material: 'cotton',
  },
  {
    id: 'top_shirt_linen_01',
    name: '셔츠',
    category: 'top',
    bands: [6, 7],
    material: 'linen',
  },
  {
    id: 'top_tshirt_cotton_01',
    name: '반팔',
    category: 'top',
    bands: [7, 8],
    material: 'cotton',
  },
  {
    id: 'top_sleeveless_cotton_01',
    name: '민소매',
    category: 'top',
    bands: [8],
    material: 'cotton',
  },

  {
    id: 'bottom_fleece_fleece_01',
    name: '기모 바지',
    category: 'bottom',
    bands: [1],
    material: 'fleece',
  },
  {
    id: 'bottom_leggings_polyester_01',
    name: '레깅스',
    category: 'bottom',
    bands: [2],
    material: 'polyester',
  },
  {
    id: 'bottom_jeans_denim_01',
    name: '청바지',
    category: 'bottom',
    bands: [2, 3, 4, 5, 6],
    material: 'denim',
  },
  {
    id: 'bottom_slacks_polyester_01',
    name: '슬랙스',
    category: 'bottom',
    bands: [3, 4, 5, 6],
    material: 'polyester',
  },
  {
    id: 'bottom_chino_cotton_01',
    name: '면바지',
    category: 'bottom',
    bands: [4, 6, 7],
    material: 'cotton',
  },
  {
    id: 'bottom_shorts_cotton_01',
    name: '반바지',
    category: 'bottom',
    bands: [7, 8],
    material: 'cotton',
  },

  {
    id: 'onepiece_dress_linen_01',
    name: '원피스',
    category: 'onepiece',
    bands: [8],
    material: 'linen',
  },

  {
    id: 'inner_thermal_rayon_01',
    name: '히트텍',
    category: 'inner',
    bands: [1, 2],
    material: 'rayon',
  },

  {
    id: 'legwear_stockings_nylon_01',
    name: '스타킹',
    category: 'legwear',
    bands: [3, 4],
    material: 'nylon',
  },

  {
    id: 'acc_scarf_wool_01',
    name: '목도리',
    category: 'acc',
    bands: [1],
    material: 'wool',
  },
  {
    id: 'acc_gloves_wool_01',
    name: '장갑',
    category: 'acc',
    bands: [1],
    material: 'wool',
  },
  {
    id: 'acc_beanie_wool_01',
    name: '비니',
    category: 'acc',
    bands: [1],
    material: 'wool',
  },
  {
    id: 'acc_umbrella_polyester_01',
    name: '우산',
    category: 'acc',
    bands: ALL_BANDS,
    material: 'polyester',
    conditions: ['rain'],
  },
];

export const CATEGORY_LABEL: Record<ClothItem['category'], string> = {
  outer: '아우터',
  top: '상의',
  bottom: '하의',
  onepiece: '원피스',
  inner: '이너',
  legwear: '레그웨어',
  acc: '소품',
};

/** 카드 상단 라벨 (대문자 Mono) */
export const CATEGORY_CODE: Record<ClothItem['category'], string> = {
  outer: 'OUTER',
  top: 'TOP',
  bottom: 'BOTTOM',
  onepiece: 'ONEPIECE',
  inner: 'INNER',
  legwear: 'LEGWEAR',
  acc: 'ACC',
};

/** 이미지 자리표시자용 약자 */
export const CATEGORY_ABBR: Record<ClothItem['category'], string> = {
  outer: 'OUT',
  top: 'TOP',
  bottom: 'BTM',
  onepiece: 'OP',
  inner: 'IN',
  legwear: 'LEG',
  acc: 'ACC',
};
