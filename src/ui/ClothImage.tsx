import React from 'react';
import { Image, View } from 'react-native';
import { CATEGORY_ABBR } from '../outfit/catalog';
import { getClothImage } from '../outfit/images';
import type { ClothItem } from '../outfit/types';
import { HangerIcon } from './icons';
import { Label } from './Text';
import { useTheme } from './theme';

type Props = {
  item: ClothItem;
  /** 정사각형 한 변 (생략하면 부모 너비에 맞춘다) */
  size?: number;
  height?: number;
};

/**
 * 옷 이미지. assets/clothes/${id}.png 가 src/outfit/images.ts 에 등록돼 있으면 그 이미지,
 * 없으면 자리표시자(타일 + 옷걸이 아이콘 + 카테고리 약자).
 */
export function ClothImage({ item, size, height }: Props) {
  const { palette } = useTheme();
  const source = getClothImage(item.id);
  const box = { width: size ?? '100%', height: size ?? height ?? 80 } as const;

  if (source) {
    return (
      <View
        style={[
          box,
          {
            backgroundColor: palette.tile,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Image
          source={source}
          resizeMode="contain"
          style={{ width: '86%', height: '86%' }}
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  return (
    <View
      style={[
        box,
        {
          backgroundColor: palette.tile,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <HangerIcon size={28} color={palette.sub} />
      <Label size={9} color={palette.sub}>
        {CATEGORY_ABBR[item.category]}
      </Label>
    </View>
  );
}
