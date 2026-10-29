export type Band = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type Category =
  | 'outer'
  | 'top'
  | 'bottom'
  | 'onepiece'
  | 'inner'
  | 'legwear'
  | 'acc';

export type Material =
  | 'linen'
  | 'cotton'
  | 'denim'
  | 'rayon'
  | 'wool'
  | 'cashmere'
  | 'fleece'
  | 'down'
  | 'polyester'
  | 'nylon'
  | 'leather'
  | 'suede';

export type Condition = 'rain' | 'snow';

export type WeatherTag = 'hot' | 'humid' | 'cold' | 'rain' | 'snow' | 'windy';

export type ClothItem = {
  /** 파일명 규칙과 동일: 카테고리_이름_재질_번호 (이미지는 `${id}.png`) */
  id: string;
  /** 한국어 표시명 */
  name: string;
  category: Category;
  /** 어울리는 체감온도 구간들 */
  bands: Band[];
  material: Material;
  /** 지정되면 해당 날씨일 때만 추천 (예: 우산) */
  conditions?: Condition[];
};

export type Outfit = {
  band: Band;
  /** 보정값까지 적용한, 추천에 쓴 체감온도 */
  targetTemp: number;
  tags: WeatherTag[];
  outer?: ClothItem;
  top?: ClothItem;
  bottom?: ClothItem;
  /** 있으면 top/bottom 대신 */
  onepiece?: ClothItem;
  inner?: ClothItem;
  /** onepiece일 때만 */
  legwear?: ClothItem;
  /** acc */
  extras: ClothItem[];
  /** 재질 점수 때문에 다른 옷 대신 뽑힌 옷의 id (화면에서 포인트 점 표시) */
  boostedIds: string[];
  /** 화면/위젯에 띄울 한 줄 이유 */
  tip?: string;
  /** 위젯 배지용 짧은 문구 */
  shortTip?: string;
};
