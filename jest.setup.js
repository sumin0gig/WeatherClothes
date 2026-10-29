/* eslint-env jest */
// AsyncStorage 네이티브 모듈 대신 메모리 구현 (라이브러리 공식 jest mock)
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
