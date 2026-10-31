'use no memo';
/** 4×2 위젯. props만 받아 그린다 (훅·계산 금지). */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { ACCENT_TEXT } from '../src/ui/accent';
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

const PAD = 14;
const GAP = 6;

export function TodayOutfitWidget({ model, palette, width, height }: Props) {
  const innerH = height - PAD * 2;
  const tile = Math.max(
    40,
    Math.floor(Math.min((innerH - GAP) / 2, (width * 0.5 - GAP) / 2)),
  );
  const tempSize = Math.max(32, Math.min(58, Math.floor(innerH * 0.42)));

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel={`${model.locationName} 체감 ${
        model.tempText
      }, 오늘의 옷 ${model.tiles4.map(t => t.name).join(', ')}`}
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: hex(palette.card),
        borderRadius: RADIUS.widget,
        padding: PAD,
        flexDirection: 'row',
        flexGap: 12,
      }}
    >
      <FlexWidget
        style={{
          flex: 1,
          height: 'match_parent',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text={model.locationName}
            maxLines={1}
            truncate="END"
            allowFontScaling={false}
            style={{
              fontFamily: FONT.sans600,
              fontSize: 12,
              color: hex(palette.ink),
            }}
          />
          <TextWidget
            text={model.stale ? `${model.bandText} · 오프라인` : model.bandText}
            maxLines={1}
            allowFontScaling={false}
            style={{
              fontFamily: FONT.mono500,
              fontSize: 10,
              color: hex(palette.sub),
            }}
          />
        </FlexWidget>
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
        {model.shortTip ? (
          <FlexWidget
            style={{
              backgroundColor: hex(model.accent),
              borderRadius: 4,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <TextWidget
              text={model.shortTip}
              maxLines={1}
              allowFontScaling={false}
              style={{
                fontFamily: FONT.sans700,
                fontSize: 11,
                color: hex(ACCENT_TEXT),
              }}
            />
          </FlexWidget>
        ) : (
          <FlexWidget
            style={{
              height: 4,
              width: 28,
              backgroundColor: hex(model.accent),
              borderRadius: 2,
            }}
          />
        )}
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'column', flexGap: GAP }}>
        <FlexWidget style={{ flexDirection: 'row', flexGap: GAP }}>
          <Tile tile={model.tiles4[0]} size={tile} palette={palette} />
          <Tile tile={model.tiles4[1]} size={tile} palette={palette} />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'row', flexGap: GAP }}>
          <Tile tile={model.tiles4[2]} size={tile} palette={palette} />
          <Tile tile={model.tiles4[3]} size={tile} palette={palette} />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
