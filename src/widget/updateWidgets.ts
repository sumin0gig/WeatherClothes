import { requestWidgetUpdate } from 'react-native-android-widget';
import type { TodayOutfit } from '../core/getTodayOutfit';
import {
  renderWidget,
  WIDGET_NAMES,
  type WidgetState,
} from '../../widgets/renderWidget';

/**
 * 앱 안에서 제외 목록·설정·위치·날씨가 바뀌었을 때 홈 화면 위젯을 즉시 다시 그린다.
 * 앱이 이미 계산한 결과를 그대로 넘겨서 위젯이 같은 내용을 보여주게 한다.
 */
export async function updateAllWidgets(
  data: TodayOutfit | null,
  error?: WidgetState['error'],
): Promise<void> {
  const state: WidgetState = data
    ? { data }
    : { error: error ?? 'NO_LOCATION' };
  await Promise.all(
    WIDGET_NAMES.map(widgetName =>
      requestWidgetUpdate({
        widgetName,
        renderWidget: info => renderWidget(widgetName, state, info),
      }).catch(() => {
        // 위젯이 홈 화면에 없거나 네이티브 모듈이 없을 때(테스트 등)는 조용히 넘어간다
      }),
    ),
  );
}
