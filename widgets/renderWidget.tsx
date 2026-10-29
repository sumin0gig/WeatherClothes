'use no memo';
import React from 'react';
import {
  FlexWidget,
  TextWidget,
  type WidgetInfo,
  type WidgetRepresentation,
} from 'react-native-android-widget';
import type { TodayOutfit } from '../src/core/getTodayOutfit';
import { DARK, FONT, LIGHT, RADIUS, type Palette } from '../src/ui/tokens';
import { toWidgetModel } from './model';
import { hex } from './parts';
import { TodayOutfitSmallWidget } from './TodayOutfitSmallWidget';
import { TodayOutfitWidget } from './TodayOutfitWidget';

/** android/app/src/main/java/com/weatherclothes/widget/*.kt 클래스 이름과 같아야 한다 */
export const WIDGET_NAMES = ['TodayOutfit', 'TodayOutfitSmall'] as const;
export type WidgetName = (typeof WIDGET_NAMES)[number];

export type WidgetState =
  | { data: TodayOutfit; error?: undefined }
  | { data?: undefined; error: 'NO_LOCATION' | 'NO_WEATHER' };

const ERROR_TEXT: Record<'NO_LOCATION' | 'NO_WEATHER', string> = {
  NO_LOCATION: '앱을 한 번 열어 위치를 설정해 주세요',
  NO_WEATHER: '날씨를 불러오지 못했어요. 앱을 열어 다시 시도해 주세요',
};

function ErrorWidget({
  message,
  palette,
}: {
  message: string;
  palette: Palette;
}) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: hex(palette.card),
        borderRadius: RADIUS.widget,
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <TextWidget
        text={message}
        maxLines={3}
        style={{
          fontFamily: FONT.sans500,
          fontSize: 12,
          color: hex(palette.ink),
          textAlign: 'center',
        }}
      />
    </FlexWidget>
  );
}

function draw(
  name: WidgetName,
  state: WidgetState,
  info: Pick<WidgetInfo, 'width' | 'height'>,
  palette: Palette,
) {
  if (!state.data)
    return <ErrorWidget message={ERROR_TEXT[state.error]} palette={palette} />;
  const model = toWidgetModel(state.data);
  const props = { model, palette, width: info.width, height: info.height };
  return name === 'TodayOutfitSmall' ? (
    <TodayOutfitSmallWidget {...props} />
  ) : (
    <TodayOutfitWidget {...props} />
  );
}

/** 라이트/다크 두 벌을 그려 넘긴다. 런처가 시스템 테마에 맞는 쪽을 쓴다. */
export function renderWidget(
  name: string,
  state: WidgetState,
  info: Pick<WidgetInfo, 'width' | 'height'>,
): WidgetRepresentation {
  const widget = (WIDGET_NAMES as readonly string[]).includes(name)
    ? (name as WidgetName)
    : 'TodayOutfit';
  return {
    light: draw(widget, state, info, LIGHT),
    dark: draw(widget, state, info, DARK),
  };
}
