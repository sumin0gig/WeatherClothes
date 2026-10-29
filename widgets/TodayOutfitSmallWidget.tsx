'use no memo';
/** 2×2 위젯. props만 받아 그린다 (훅·계산 금지). */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { Palette } from '../src/ui/tokens';
import { FONT, RADIUS } from '../src/ui/tokens';
import type { WidgetModel } from './model';
import { hex, Tile } from './parts';

type Props = {
  model: WidgetModel;
  palette: Palette;
  width: number;
  height: number;
};

const PAD = 12;
const GAP = 6;

export function TodayOutfitSmallWidget({
  model,
  palette,
  width,
  height,
}: Props) {
  const tile = Math.max(
    36,
    Math.floor(
      Math.min((width - PAD * 2 - GAP) / 2, (height - PAD * 2) * 0.52),
    ),
  );
  const tempSize = Math.max(
    28,
    Math.min(44, Math.floor((height - PAD * 2 - tile) * 0.8)),
  );

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel={`체감 ${model.tempText}, ${model.tiles2
        .map(t => t.name)
        .join(', ')}`}
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: hex(palette.card),
        borderRadius: RADIUS.widget,
        padding: PAD,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <TextWidget
          text={model.tempText}
          allowFontScaling={false}
          style={{
            fontFamily: FONT.sans700,
            fontSize: tempSize,
            color: hex(palette.ink),
            letterSpacing: -tempSize * 0.05,
          }}
        />
        {model.wet ? (
          <FlexWidget
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: hex(model.accent),
              marginTop: 4,
            }}
          />
        ) : null}
      </FlexWidget>
      <FlexWidget style={{ flexDirection: 'row', flexGap: GAP }}>
        <Tile tile={model.tiles2[0]} size={tile} palette={palette} />
        <Tile tile={model.tiles2[1]} size={tile} palette={palette} />
      </FlexWidget>
    </FlexWidget>
  );
}
