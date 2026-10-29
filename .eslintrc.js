module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // 색이 테마·날씨(accent)에 따라 바뀌어서 스타일 대부분이 렌더 시점 값이다.
    // 위젯(react-native-android-widget)은 StyleSheet 객체를 쓸 수 없다.
    'react-native/no-inline-styles': 'off',
  },
};
