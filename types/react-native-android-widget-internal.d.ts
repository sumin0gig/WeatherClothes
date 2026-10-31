/** 테스트에서 위젯 JSX → 네이티브 트리 변환을 검증할 때 쓰는 라이브러리 내부 함수 */
declare module 'react-native-android-widget/lib/commonjs/api/build-widget-tree' {
  import type React from 'react';
  export function buildWidgetTree(jsx: React.JSX.Element): any;
}
