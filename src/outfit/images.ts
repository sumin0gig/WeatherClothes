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
  // bottom_jeans_denim_01: require('../../assets/clothes/bottom_jeans_denim_01.png'),
};
// @generated-end

export const getClothImage = (id: string): ImageRequireSource | undefined =>
  CLOTH_IMAGES[id];
