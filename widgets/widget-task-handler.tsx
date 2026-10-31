import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { getTodayOutfit, NoLocationError } from '../src/core/getTodayOutfit';
import { renderWidget, type WidgetState } from './renderWidget';

/**
 * 위젯 이벤트 핸들러 (백그라운드 headless JS).
 * 계산은 모두 getTodayOutfit()이 하고, 위젯 컴포넌트는 결과를 그리기만 한다.
 * 클릭은 clickAction="OPEN_APP"으로 네이티브에서 바로 앱을 열기 때문에 여기서 할 일이 없다.
 */
export async function widgetTaskHandler(
  props: WidgetTaskHandlerProps,
): Promise<void> {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      let state: WidgetState;
      try {
        state = { data: await getTodayOutfit({ inBackground: true }) };
      } catch (e) {
        state = {
          error: e instanceof NoLocationError ? 'NO_LOCATION' : 'NO_WEATHER',
        };
      }
      props.renderWidget(
        renderWidget(props.widgetInfo.widgetName, state, props.widgetInfo),
      );
      break;
    }
    case 'WIDGET_DELETED':
    case 'WIDGET_CLICK':
    default:
      break;
  }
}
