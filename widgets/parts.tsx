'use no memo';
/**
 * 위젯 공통 조각. 위젯은 런처가 그리는 RemoteViews로 변환되므로
 * - React 훅 사용 금지
 * - Fragment(<>) 사용 금지 (라이브러리가 변환하지 못함)
 * - letterSpacing은 px 단위
 */
import React from 'react';
import {
  FlexWidget,
  ImageWidget,
  TextWidget,
  type HexColor,
} from 'react-native-android-widget';
import type { Palette } from '../src/ui/tokens';
import { FONT, RADIUS } from '../src/ui/tokens';
import type { WidgetTile } from './model';

export const hex = (c: string) => c as HexColor;

const NAME_HEIGHT = 14;

/** 옷 타일: 이미지가 있으면 이미지, 없으면 카테고리 약자 자리표시자. */
export function Tile({
  tile,
  size,
  palette,
}: {
  tile?: WidgetTile;
  size: number;
  palette: Palette;
}) {
  const imageSize = Math.max(16, Math.floor(size - NAME_HEIGHT - 10));

  const visual = !tile ? null : tile.image ? (
    <ImageWidget
      image={tile.image}
      imageWidth={imageSize}
      imageHeight={imageSize}
      resizeMode="contain"
    />
  ) : (
    <FlexWidget
      style={{
        width: imageSize,
        height: imageSize,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <TextWidget
        text={tile.abbr}
        allowFontScaling={false}
        style={{
          fontFamily: FONT.mono600,
          fontSize: 10,
          color: hex(palette.sub),
          letterSpacing: 1,
        }}
      />
    </FlexWidget>
  );

  const name = tile ? (
    <TextWidget
      text={tile.name}
      maxLines={1}
      truncate="END"
      allowFontScaling={false}
      style={{
        fontFamily: FONT.sans600,
        fontSize: 10,
        color: hex(palette.ink),
        height: NAME_HEIGHT,
      }}
    />
  ) : null;

  return (
    <FlexWidget
      style={{
        width: size,
        height: size,
        backgroundColor: hex(palette.tile),
        borderRadius: RADIUS.widgetTile,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      {visual}
      {name}
    </FlexWidget>
  );
}
