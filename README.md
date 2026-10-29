# 옷날씨 (WeatherClothes)

현재 위치의 **체감온도**로 오늘 입을 옷을 골라 **홈 화면 위젯**에 띄워 주는 Android 앱.
서버·푸시·계정 없이 기기 안에서만 동작한다.

- 체감온도 8구간 + 날씨(비·눈·더위·습도·바람)에 맞는 **재질**을 우선 추천
- 같은 날에는 위젯이 몇 번 갱신돼도 같은 옷
- 원하지 않는 옷은 옷장에서 제외
- 포인트 컬러가 날씨에 따라 빨강(더움) → 초록 → 파랑(추움)으로 바뀜
- 날씨 데이터: [Open-Meteo](https://open-meteo.com/) (API 키 없음, 비상업적 무료, CC BY 4.0)

자세한 설계와 규칙은 [`CLAUDE.md`](./CLAUDE.md), 출시 준비는 [`docs/play-release.md`](./docs/play-release.md).

## 개발

React Native CLI 0.88 프로젝트에 Expo 모듈(SDK 58, `expo-location`)을 붙인 구조다. Expo Go로는 실행되지 않는다.

```sh
npm install
npm start            # Metro
npm run android      # 디버그 빌드 설치 (Android SDK / 에뮬레이터 필요)

npm test             # 단위 테스트 (추천 로직, 날씨·캐시, 위젯 렌더링)
npm run typecheck
npm run lint
```

### 위젯 확인

앱을 한 번 실행해 위치 권한을 준 뒤, 홈 화면 길게 누르기 → 위젯 → **오늘의 옷 (4×2 / 2×2)**.
위젯은 1시간마다, 그리고 앱에서 옷장·설정·날씨가 바뀔 때마다 갱신된다.

### 옷 이미지 넣기

`assets/clothes/`에 `카테고리_이름_재질_번호.png`(카탈로그 id와 같은 이름)를 넣고:

```sh
npm run gen:images
```

자세한 규칙은 [`assets/clothes/README.md`](./assets/clothes/README.md).

### 릴리스 빌드

```sh
cd android && ./gradlew bundleRelease
```

출시 전에 업로드 키로 서명 설정을 바꿔야 한다 (`docs/play-release.md` 1단계).

## 폰트

IBM Plex Sans KR / IBM Plex Mono — SIL Open Font License 1.1 (`android/app/src/main/assets/fonts/OFL-IBMPlex.txt`).
