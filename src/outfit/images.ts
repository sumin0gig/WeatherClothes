/**
 * 옷 id → PNG 이미지 매핑.
 *
 * React Native는 require() 경로를 동적으로 만들 수 없어서 이 파일 하나로 관리한다.
 * assets/clothes/ 에 `${id}.png` 파일을 넣은 뒤 `npm run gen:images` 를 실행하면
 * 이 파일이 다시 만들어진다. 손으로 한 줄씩 추가해도 된다.
 * 등록되지 않은 옷은 자리표시자로 표시된다.
 */
import type { ImageRequireSource } from 'react-native';

// @generated-start (scripts/gen-cloth-images.mjs 가 이 사이를 다시 쓴다)
export const CLOTH_IMAGES: Partial<Record<string, ImageRequireSource>> = {
  acc_beanie_wool_01: require('../../assets/clothes/acc_beanie_wool_01.png'),
  acc_gloves_wool_01: require('../../assets/clothes/acc_gloves_wool_01.png'),
  acc_scarf_wool_01: require('../../assets/clothes/acc_scarf_wool_01.png'),
  acc_umbrella_polyester_01: require('../../assets/clothes/acc_umbrella_polyester_01.png'),
  bottom_chino_cotton_01: require('../../assets/clothes/bottom_chino_cotton_01.png'),
  bottom_fleece_fleece_01: require('../../assets/clothes/bottom_fleece_fleece_01.png'),
  bottom_jeans_denim_01: require('../../assets/clothes/bottom_jeans_denim_01.png'),
  bottom_leggings_polyester_01: require('../../assets/clothes/bottom_leggings_polyester_01.png'),
  bottom_shorts_cotton_01: require('../../assets/clothes/bottom_shorts_cotton_01.png'),
  bottom_slacks_polyester_01: require('../../assets/clothes/bottom_slacks_polyester_01.png'),
  inner_thermal_rayon_01: require('../../assets/clothes/inner_thermal_rayon_01.png'),
  legwear_stockings_nylon_01: require('../../assets/clothes/legwear_stockings_nylon_01.png'),
  onepiece_dress_linen_01: require('../../assets/clothes/onepiece_dress_linen_01.png'),
  outer_blazer_wool_01: require('../../assets/clothes/outer_blazer_wool_01.png'),
  outer_cardigan_cotton_01: require('../../assets/clothes/outer_cardigan_cotton_01.png'),
  outer_coat_wool_01: require('../../assets/clothes/outer_coat_wool_01.png'),
  outer_field_cotton_01: require('../../assets/clothes/outer_field_cotton_01.png'),
  outer_leather_leather_01: require('../../assets/clothes/outer_leather_leather_01.png'),
  outer_padding_down_01: require('../../assets/clothes/outer_padding_down_01.png'),
  outer_trench_polyester_01: require('../../assets/clothes/outer_trench_polyester_01.png'),
  top_knit_wool_01: require('../../assets/clothes/top_knit_wool_01.png'),
  top_longsleeve_cotton_01: require('../../assets/clothes/top_longsleeve_cotton_01.png'),
  top_shirt_linen_01: require('../../assets/clothes/top_shirt_linen_01.png'),
  top_sleeveless_cotton_01: require('../../assets/clothes/top_sleeveless_cotton_01.png'),
  top_sweatshirt_cotton_01: require('../../assets/clothes/top_sweatshirt_cotton_01.png'),
  top_tshirt_cotton_01: require('../../assets/clothes/top_tshirt_cotton_01.png'),
};
// @generated-end

export const getClothImage = (id: string): ImageRequireSource | undefined =>
  CLOTH_IMAGES[id];
