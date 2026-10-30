# 옷날씨 — 날씨 기반 옷차림 추천 앱 (Claude Code 작업 지시서)

이 문서는 앱을 처음부터 만들기 위한 지시서다. 아래 "확정 사항"은 사용자가 이미 결정한 것이므로 임의로 바꾸지 말고, 바꿔야 할 이유가 생기면 먼저 물어볼 것.

---

## 0. 한눈에 보기

- 현재 위치의 **체감온도**를 기준으로 오늘 입을 옷을 추천하고, **홈 화면 위젯**에 날씨와 함께 띄운다.
- 사용자가 원하지 않는 옷은 **옷장 화면에서 제외**할 수 있고, 제외 목록은 기기 저장소에 저장한다.
- 개인 사용 목적. **Android만**, Google Play에 출시. iOS는 나중에.

### 확정 사항 (절대 규칙)

| 항목 | 결정 |
|---|---|
| 패키지 이름 | **`com.developer_cm.weatherclothes`** (2026-10-30 사용자 결정). `applicationId`·`namespace`·Kotlin 패키지 모두 이 이름. Play에 올린 뒤에는 바꿀 수 없다. |
| 서버 | **없음.** AWS, Firebase, 자체 백엔드, 서버리스 함수 모두 쓰지 않는다. |
| 푸시 알림 | **없음.** 알림 관련 라이브러리, 권한도 추가하지 않는다. |
| 분석/트래킹 | 없음. |
| 플랫폼 | Android 우선. iOS 코드는 만들지 않되, 나중에 붙이기 쉽게 로직은 플랫폼 독립적으로. |
| 위치 | **항상 현재 위치.** 위젯도 백그라운드에서 현재 위치를 갱신한다. `ACCESS_COARSE_LOCATION` + `ACCESS_BACKGROUND_LOCATION`만 사용. **FINE 위치는 요청하지 않는다.** |
| 추천 기준 | **체감온도(apparent temperature)** |
| 기온 구간 | 아래 3장의 8구간 표 (사용자가 쓰는 기온별 옷차림표 기준) |
| 재질 반영 | 날씨 태그별 재질 점수 (아래 4장) |
| 옷 이미지 | **PNG 이미지 파일**(SVG 아님). 사용자가 나중에 넣는다. 지금은 자리표시자만 만들고, 파일을 넣으면 바로 반영되는 구조만 잡는다. |
| 포인트 컬러 | **날씨(체감온도 구간)에 따라 빨강 → 초록 → 파랑으로 변한다.** 고정 주황 아님 (9장 참고). |
| 저장소 | 기기 로컬 저장소(AsyncStorage) |

---

## 1. 기술 스택

- **React Native CLI 0.88** (bare) + TypeScript. Expo 프로젝트가 아니다. (2026-10-29 사용자 결정: 기존 RN CLI 템플릿 유지)
  - Expo **모듈**만 `install-expo-modules`로 붙였다 (Expo SDK 58 = RN 0.88.1 / React 19.3.0). 그래서 Metro·Babel은 `expo/metro-config`, `babel-preset-expo`를 쓴다.
  - Expo config plugin은 동작하지 않는다. 네이티브 설정은 `android/`를 직접 고친다.
- 내비게이션: **React Navigation** (native-stack + bottom-tabs). expo-router 아님.
- **react-native-android-widget** — 홈 화면 위젯. 리시버·provider XML·Kotlin 클래스는 `android/`에 수동 등록 (11장).
- **expo-location** — 포그라운드/백그라운드 위치, 역지오코딩
- **@react-native-async-storage/async-storage** — 설정, 제외 목록, 캐시 (Expo SDK 58 권장 버전 2.2.x)
- **react-native-svg** — UI 아이콘(위치, 우산, 자리표시자 옷걸이)용. 옷 이미지는 PNG라서 여기에 쓰지 않는다.
- 폰트: IBM Plex Sans KR / Mono TTF를 `android/app/src/main/assets/fonts/`에 직접 넣었다 (OFL). `fontFamily` = 파일명(확장자 제외). 앱과 위젯이 같은 파일을 쓴다.
- 테스트: **jest** (`npm test`), 타입: `npm run typecheck`, 린트: `npm run lint`

> 패키지를 올릴 때는 `node_modules/expo/bundledNativeModules.json`의 권장 버전과 RN 버전 호환을 먼저 확인할 것. 버전을 기억에 의존해 고정하지 말 것. `npx expo install`은 이 환경에서 원격 확인이 막혀 실패할 수 있으니 npm으로 권장 버전을 직접 설치한다.

---

## 2. 날씨 API — Open-Meteo

- API 키 불필요 → 앱에 키를 넣을 필요가 없어 서버 없이 안전하게 쓸 수 있음.
- 무료 조건: **비상업적 사용**, 하루 1만 회 미만 호출. 데이터는 **CC BY 4.0** → 설정 화면에 출처 표기 필수: `Weather data by Open-Meteo.com` (링크 포함).
- 광고/유료화를 하게 되면 유료 플랜이 필요하다는 점을 코드 주석에 남겨둘 것.

요청 예시:

```
https://api.open-meteo.com/v1/forecast
  ?latitude={lat}&longitude={lon}
  &current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m
  &hourly=apparent_temperature,precipitation_probability,weather_code
  &forecast_days=1
  &timezone=auto
```

- `wind_speed_10m` 기본 단위는 km/h.
- `precipitation_probability`는 hourly에서 현재 시각에 해당하는 값을 사용.
- 응답은 `src/weather/types.ts`의 내부 타입 `Weather`로 정규화해서 나머지 코드가 Open-Meteo 형식에 의존하지 않게 한다.

```ts
type Weather = {
  temp: number;           // 기온
  apparentTemp: number;   // 체감온도 ← 추천 기준
  humidity: number;       // %
  precipProb: number;     // % (현재 시각)
  windSpeed: number;      // km/h
  code: number;           // WMO weather code
  hourly: { time: string; apparentTemp: number; precipProb: number; code: number }[];
  fetchedAt: number;      // epoch ms
};
```

### WMO 날씨 코드 분류 (`src/weather/weatherCode.ts`)

- 비: 51–67, 80–82, 95–99
- 눈: 71–77, 85–86
- 나머지는 맑음/흐림 계열 (0 맑음, 1–3 구름, 45·48 안개) — 한국어 라벨 매핑 함수도 같이 작성 (`"흐림"`, `"비"` 등)

### 캐시

- 캐시 사용 조건: **가져온 지 1시간 이내 AND 저장된 좌표에서 3km 이상 이동하지 않음.**
- 네트워크 실패 시 캐시가 있으면 캐시 사용, 화면/위젯에 "갱신 시각"으로 오래된 데이터임을 드러낸다.

---

## 3. 체감온도 구간 (8구간)

하한값 기준으로 판정한다. 예: 체감 22.5° → 구간 6.

```ts
// src/outfit/bands.ts
export const BANDS = [
  { band: 8, min: 28,        label: '28° 이상' },
  { band: 7, min: 23,        label: '23~27°' },
  { band: 6, min: 20,        label: '20~22°' },
  { band: 5, min: 17,        label: '17~19°' },
  { band: 4, min: 12,        label: '12~16°' },
  { band: 3, min: 9,         label: '9~11°' },
  { band: 2, min: 5,         label: '5~8°' },
  { band: 1, min: -Infinity, label: '4° 이하' },
] as const;
export type Band = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export const getBand = (apparentTemp: number): Band =>
  BANDS.find(b => apparentTemp >= b.min)!.band as Band;
```

- 추천에 쓰는 체감온도는 **현재 체감온도**. (나중에 "외출 시간대 최저 체감온도"로 바꿀 수 있게 `getTargetApparentTemp(weather)` 함수 하나로 분리해 둘 것.)
- 체감 보정값(예: +1~2°)을 나중에 설정에서 줄 수 있도록 `apparentOffset` 설정 키를 미리 만들어 두고 기본값 0.

---

## 4. 추천 로직

### 4-1. 카탈로그 스키마

```ts
type Category = 'outer' | 'top' | 'bottom' | 'onepiece' | 'inner' | 'legwear' | 'acc';
type Material =
  | 'linen' | 'cotton' | 'denim' | 'rayon'
  | 'wool' | 'cashmere' | 'fleece' | 'down'
  | 'polyester' | 'nylon' | 'leather' | 'suede';
type Condition = 'rain' | 'snow';

type ClothItem = {
  id: string;             // 파일명 규칙과 동일: 카테고리_이름_재질_번호
  name: string;           // 한국어 표시명
  category: Category;
  bands: Band[];          // 어울리는 체감온도 구간들
  material: Material;
  conditions?: Condition[]; // 지정되면 해당 날씨일 때만 추천 (예: 우산)
};
```

- 이미지는 `ClothItem`에 직접 넣지 않고 `src/outfit/images.ts`의 매핑으로 분리한다 (10장). 이미지 파일명 = `id` + `.png` 예) `bottom_jeans_denim_01.png`.

### 4-2. 초기 카탈로그 시드 (`src/outfit/catalog.ts`)

| id | name | category | bands | material | conditions |
|---|---|---|---|---|---|
| outer_padding_down_01 | 롱패딩 | outer | 1 | down | |
| outer_coat_wool_01 | 울 코트 | outer | 1, 2 | wool | |
| outer_leather_leather_01 | 가죽자켓 | outer | 2 | leather | |
| outer_trench_polyester_01 | 트렌치코트 | outer | 3 | polyester | |
| outer_field_cotton_01 | 야상 | outer | 3, 4 | cotton | |
| outer_blazer_wool_01 | 자켓 | outer | 3, 4 | wool | |
| outer_cardigan_cotton_01 | 가디건 | outer | 4, 5, 6 | cotton | |
| top_knit_wool_01 | 니트 | top | 1, 2, 3, 5 | wool | |
| top_sweatshirt_cotton_01 | 맨투맨 | top | 4, 5 | cotton | |
| top_longsleeve_cotton_01 | 긴팔 | top | 4, 6 | cotton | |
| top_shirt_linen_01 | 셔츠 | top | 6, 7 | linen | |
| top_tshirt_cotton_01 | 반팔 | top | 7, 8 | cotton | |
| top_sleeveless_cotton_01 | 민소매 | top | 8 | cotton | |
| bottom_fleece_fleece_01 | 기모 바지 | bottom | 1 | fleece | |
| bottom_leggings_polyester_01 | 레깅스 | bottom | 2 | polyester | |
| bottom_jeans_denim_01 | 청바지 | bottom | 2, 3, 4, 5, 6 | denim | |
| bottom_slacks_polyester_01 | 슬랙스 | bottom | 3, 4, 5, 6 | polyester | |
| bottom_chino_cotton_01 | 면바지 | bottom | 4, 6, 7 | cotton | |
| bottom_shorts_cotton_01 | 반바지 | bottom | 7, 8 | cotton | |
| onepiece_dress_linen_01 | 원피스 | onepiece | 8 | linen | |
| inner_thermal_rayon_01 | 히트텍 | inner | 1, 2 | rayon | |
| legwear_stockings_nylon_01 | 스타킹 | legwear | 3, 4 | nylon | |
| acc_scarf_wool_01 | 목도리 | acc | 1 | wool | |
| acc_gloves_wool_01 | 장갑 | acc | 1 | wool | |
| acc_beanie_wool_01 | 비니 | acc | 1 | wool | |
| acc_umbrella_polyester_01 | 우산 | acc | 1–8 전부 | polyester | rain |

### 4-3. 날씨 태그 (`src/outfit/tags.ts`)

```ts
type WeatherTag = 'hot' | 'humid' | 'cold' | 'rain' | 'snow' | 'windy';
// hot:   band >= 7
// humid: band >= 6 && humidity >= 70
// cold:  band <= 2
// rain:  precipProb >= 50 || isRainCode(code)
// snow:  isSnowCode(code)
// windy: windSpeed >= 30 (km/h)
```

임계값은 상수 객체로 한 곳에 모아 두고 나중에 조정하기 쉽게 할 것.

### 4-4. 재질 점수 (`src/outfit/materialScore.ts`)

옷을 걸러내지 않고 **점수가 높은 재질을 우선** 뽑는다. 표에 없는 조합은 0점.

```ts
const MATERIAL_SCORE: Record<WeatherTag, Partial<Record<Material, number>>> = {
  hot:   { linen: 3, cotton: 2, rayon: 1, wool: -3, denim: -2, fleece: -3, leather: -3 },
  humid: { linen: 3, cotton: -1 },
  cold:  { wool: 3, cashmere: 3, down: 3, fleece: 2, cotton: -1 },
  rain:  { polyester: 3, nylon: 2, wool: 1, cotton: -2, denim: -3, suede: -5, down: -1 },
  snow:  { nylon: 2, polyester: 2, down: 2, suede: -5 },
  windy: { nylon: 2, leather: 2, polyester: 1 },
};
```

### 4-5. 추천 함수 (`src/outfit/recommend.ts`) — 순수 함수로 작성

```ts
recommend(weather, catalog, excludedIds, dateKey /* 'YYYY-MM-DD' */, { apparentOffset }?): Outfit

type Outfit = {
  band: Band;
  tags: WeatherTag[];
  outer?: ClothItem;
  top?: ClothItem;
  bottom?: ClothItem;
  onepiece?: ClothItem;   // 있으면 top/bottom 대신
  inner?: ClothItem;
  legwear?: ClothItem;    // onepiece일 때만
  extras: ClothItem[];    // acc
  tip?: string;           // 화면/위젯에 띄울 한 줄 이유
  shortTip?: string;      // 위젯 배지용 짧은 문구 ('비 소식 · 우산')
  boostedIds: string[];   // 재질 점수 때문에 다른 옷 대신 뽑힌 옷 → 화면에서 accent 점
  targetTemp: number;     // 보정까지 적용한, 추천에 쓴 체감온도
};
```

규칙:
1. 후보 = 제외되지 않았고, `bands`에 현재 구간이 포함되고, `conditions`가 없거나 현재 태그와 겹치는 옷.
2. 카테고리별로 **재질 점수 합계가 가장 높은 후보들 중에서 `dateKey + category` 시드로 하나** 고른다. 같은 날에는 위젯이 몇 번 갱신돼도 같은 옷이 나와야 한다. (시드 기반 PRNG는 직접 구현, 외부 라이브러리 불필요)
3. `onepiece` 후보가 있으면 `dateKey + 'onepiece'` 시드로 "원피스 vs 상하의"를 결정.
4. `outer` 후보가 없으면(더운 날) outer 없음.
5. `extras`: `conditions`가 있는 acc는 조건이 맞으면 **항상 포함**(우산). 나머지 acc는 시드로 최대 2개.
6. `tip`: 선택된 카테고리에서 **점수 때문에 순위가 바뀐 경우** 한 줄 이유를 만든다. 예) `"오후 비 소식 — 청바지 대신 폴리 소재 바지를 골랐어요"`. 바뀐 게 없고 비/눈 태그가 있으면 `"비 소식 · 우산 챙기기"` 같은 기본 문구.
7. 후보가 하나도 없는 카테고리는 비워 두고 크래시하지 않는다.

**단위 테스트 필수**: 구간 경계값(4.9/5/8.9/9 …), 제외 반영, 같은 날 같은 결과, 비 오는 날 데님보다 폴리 우선, 원피스 분기, 빈 후보 처리.

---

## 5. 위치

### 5-1. 권한 흐름 (온보딩 화면)

1. **사전 고지 화면(prominent disclosure)** — 시스템 팝업 전에 앱 자체 화면으로 설명:
   "홈 화면 위젯이 지금 있는 곳의 날씨로 옷을 추천하려면, 앱을 사용하지 않을 때도 대략적인 위치가 필요해요. 위치는 날씨 조회에만 쓰고 저장하거나 다른 곳에 보내지 않아요."
2. 포그라운드 위치 권한 요청 (COARSE)
3. 허용되면 백그라운드 권한 요청 → 안드로이드 11+는 설정 화면으로 이동해 사용자가 "항상 허용"을 직접 선택
4. **거부해도 앱은 동작**: 백그라운드 권한이 없으면 앱을 열 때 저장한 위치로 위젯을 갱신하고, 설정 화면에서 다시 허용할 수 있게 안내.

권한은 `android/app/src/main/AndroidManifest.xml`에 직접 선언한다 (config plugin 없음): `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`. expo-location 라이브러리가 기본으로 넣는 `ACCESS_FINE_LOCATION`과 위치 추적용 포그라운드 서비스 2개는 `tools:node="remove"`로 뺐다. COARSE만 허용돼도 expo-location은 granted로 본다. 고지 문구는 `OnboardingScreen.tsx`의 `DISCLOSURE_TEXT` 한 곳에만 둔다.

### 5-2. 위치 가져오기 (`src/location/getLocation.ts`)

앱과 위젯이 같은 함수를 쓴다.

1. 백그라운드(또는 포그라운드) 권한 있음 → `getLastKnownPositionAsync({ maxAge: 30분 })`
2. 없으면 `getCurrentPositionAsync({ accuracy: Low })` — **10초 타임아웃 필수** (위젯 핸들러 실행 시간이 짧음)
3. 실패 시 저장된 위치
4. 성공하면 좌표 저장, `reverseGeocodeAsync`로 지역명("부산 해운대구" 형태: 시 + 구/동) 저장. 역지오코딩 실패 시 이전 지역명 유지.

---

## 6. 저장소 (`src/storage/`)

| 키 | 타입 | 설명 |
|---|---|---|
| `excludedIds` | `string[]` | 제외한 옷 id |
| `location` | `{ lat, lon, name, savedAt }` | 마지막 위치 |
| `weatherCache` | `Weather` | 마지막 날씨 |
| `settings` | `{ apparentOffset: number }` | 기본 `{ apparentOffset: 0 }` |
| `onboardingDone` | `boolean` | 권한 안내 완료 여부 |

- 모든 읽기/쓰기는 타입이 있는 래퍼 함수로만 접근. JSON 파싱 실패 시 기본값.
- `excludedIds`를 바꾸면 즉시 `requestWidgetUpdate()` 호출.

---

## 7. 공용 진입점 (`src/core/getTodayOutfit.ts`)

```ts
getTodayOutfit(): Promise<{
  locationName: string;
  weather: Weather;
  outfit: Outfit;
  updatedAt: number;
  stale: boolean; // 네트워크 실패로 캐시를 쓴 경우
}>
```

위치 → 날씨(캐시 규칙) → 제외 목록 → `recommend()`. **앱 화면과 위젯 핸들러가 모두 이 함수 하나만 호출**한다. 계산 로직을 위젯 컴포넌트 안에 두지 말 것.

---

## 8. 폴더 구조

```
index.js                      ← AppRegistry.registerComponent + registerWidgetTaskHandler
App.tsx                       ← 온보딩 여부 확인 → OutfitProvider → RootNavigator
src/
  navigation/RootNavigator.tsx ← native-stack(Main/Onboarding) + 하단 탭(오늘/옷장/설정, 커스텀 탭바)
  screens/
    TodayScreen.tsx           ← 오늘
    ClosetScreen.tsx          ← 옷장(제외 설정)
    SettingsScreen.tsx        ← 위치 권한 상태, 체감 보정, 출처 표기, 개인정보처리방침 링크
    OnboardingScreen.tsx      ← 위치 사전 고지 + 권한 요청
  state/OutfitContext.tsx     ← getTodayOutfit 결과·제외 목록·설정을 들고, 바뀌면 위젯 갱신. accent를 ThemeProvider로 내려줌
  core/getTodayOutfit.ts      ← 앱·위젯 공용 진입점
  weather/openMeteo.ts  weather/weatherCode.ts  weather/types.ts  weather/summary.ts(날씨 한 줄, 시간대 4칸)
  location/getLocation.ts
  outfit/types.ts  outfit/bands.ts  outfit/tags.ts  outfit/materialScore.ts
  outfit/catalog.ts  outfit/recommend.ts  outfit/seed.ts
  outfit/images.ts            ← id → PNG require 매핑 (npm run gen:images 로 생성)
  storage/keys.ts  storage/json.ts  storage/prefs.ts  storage/weatherCache.ts
  ui/tokens.ts                ← 색, 폰트, 간격, 테두리
  ui/accent.ts                ← 구간별 포인트 컬러
  ui/theme.tsx  ui/Text.tsx  ui/Button.tsx  ui/icons.tsx
  ui/ClothImage.tsx           ← 이미지 / 자리표시자 (아래 10장)
  ui/LabelCard.tsx            ← 케어 라벨 스타일 카드
  widget/updateWidgets.ts     ← 앱에서 위젯 즉시 갱신 (requestWidgetUpdate)
widgets/
  model.ts                    ← TodayOutfit → 위젯이 그릴 값 (계산은 여기서만)
  parts.tsx                   ← 옷 타일
  TodayOutfitWidget.tsx       ← 4×2
  TodayOutfitSmallWidget.tsx  ← 2×2
  renderWidget.tsx            ← 위젯 이름별 라이트/다크 렌더, 에러 상태
  widget-task-handler.tsx
scripts/gen-cloth-images.mjs  ← assets/clothes/*.png → src/outfit/images.ts
__tests__/                    ← recommend, bands, tags, seed, accent, weather, getTodayOutfit, widget
assets/clothes/               ← 사용자가 넣을 PNG + README.md (지금은 README만)
android/app/src/main/
  AndroidManifest.xml         ← 권한(COARSE+BACKGROUND, FINE 제거), 위젯 리시버 2개
  java/com/developer_cm/weatherclothes/widget/TodayOutfit.kt, TodayOutfitSmall.kt
  res/xml/widgetprovider_todayoutfit.xml, widgetprovider_todayoutfitsmall.xml
  assets/fonts/               ← IBM Plex TTF (앱·위젯 공용)
docs/play-release.md          ← Play 출시 체크리스트
```

---

## 9. 디자인 시스템

콘셉트: **옷의 케어 라벨(세탁 택)**. 회녹색 종이 바탕, 먹색 테두리 박스, 대문자 모노스페이스 라벨, 굵은 숫자 하나를 크게. 강조색은 **한 화면에 한 가지**만 쓰되, 그 색이 **오늘 날씨에 따라 바뀐다** (아래 "날씨 포인트 컬러"). 그라데이션, 그림자, 이모지, 흔한 날씨 앱 스타일(파란 하늘 그라데이션 등)은 쓰지 않는다.

### 토큰 (`src/ui/tokens.ts`)

| 이름 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `bg` | `#E9EBE6` | `#111317` | 화면 바탕 |
| `card` | `#F7F8F5` | `#1C1F25` | 카드 |
| `tile` | `#DDE0D9` | `#2A2D34` | 이미지 자리, 시간대 칸 |
| `ink` | `#16181D` | `#E9EBE6` | 본문, 테두리 |
| `sub` | `#5A5E66` | `#A9AEA6` | 보조 텍스트 |
| `rule` | `#B9BDB4` | `#3A3E46` | 얇은 구분선 |
| `accent` | 날씨에 따라 변함 | 라이트와 동일 | 강조(팁 띠, 날씨 맞춤 표시, 위젯 배지·점) — 위에 올리는 글자는 항상 `#16181D` |

- 폰트: 한글/본문 **IBM Plex Sans KR** (400/500/600/700), 숫자·라벨 **IBM Plex Mono** (400/500/600)
- 카드 테두리 1.5px `ink`, 모서리 6px, 내부 구분선 1px
- 라벨 텍스트: Mono 9–11px, 대문자, 자간 넓게(0.08–0.12em)
- 터치 영역 최소 44px. 텍스트 대비 4.5:1 이상 유지.
- 시스템 다크 모드를 따른다.

### 날씨 포인트 컬러 (`src/ui/accent.ts`)

체감온도 구간에 따라 **더우면 빨강 → 선선하면 초록 → 추우면 파랑**. 라이트/다크 모두 같은 색을 쓰고, 위에 얹는 글자는 항상 먹색 `#16181D`. 아래 값은 모두 먹색 글자와 대비 5:1 이상으로 확인한 값이다. (2026-10-30 사용자 결정: 기존 팔레트에서 색조는 유지하고 채도를 올린 "A안"으로 교체)

| 구간 | 체감온도 | 색 | 먹색 글자 대비 |
|---|---|---|---|
| 8 | 28° 이상 | `#FC433B` 빨강 | 5.1 |
| 7 | 23~27° | `#FC691A` 주황 | 6.1 |
| 6 | 20~22° | `#F7A719` 호박 | 8.9 |
| 5 | 17~19° | `#C0CF21` 연두 | 10.3 |
| 4 | 12~16° | `#39CD57` 초록 | 8.5 |
| 3 | 9~11° | `#1BBEAB` 청록 | 7.6 |
| 2 | 5~8° | `#339EF8` 하늘 | 6.2 |
| 1 | 4° 이하 | `#7281FB` 파랑 | 5.3 |

```ts
export const ACCENT_BY_BAND: Record<Band, string> = {
  8: '#FC433B', 7: '#FC691A', 6: '#F7A719', 5: '#C0CF21',
  4: '#39CD57', 3: '#1BBEAB', 2: '#339EF8', 1: '#7281FB',
};
export const getAccent = (band: Band) => ACCENT_BY_BAND[band];
```

- 구간은 **보정값(`apparentOffset`) 적용 후** 체감온도 기준. 추천에 쓰는 구간과 항상 같은 값이어야 한다.
- 앱은 `getTodayOutfit()` 결과의 `outfit.band`로 accent를 정해 테마 컨텍스트로 내려준다. 하드코딩된 강조색을 쓰지 말 것.
- 위젯도 핸들러에서 같은 함수로 색을 정해 props로 넘긴다.
- 색을 바꿀 때 애니메이션은 넣지 않는다.
- 색만으로 정보를 전달하지 않는다: 구간 칩(`BAND 3 · 9–11°`)은 항상 글자로 함께 보인다.

### 화면 — 오늘 (`src/screens/TodayScreen.tsx`), 위에서 아래로

1. 헤더: 위치 아이콘 + 지역명(탭하면 위치 새로고침) / 오른쪽 Mono `14:05 갱신` (stale이면 `오프라인 · 14:05`)
2. 히어로: Mono 라벨 `FEELS LIKE · 체감` + **체감온도 초대형(약 120px, 700, 자간 좁게)**. 오른쪽에 먹색 칩 `BAND 3 · 9–11°`와 날씨 한 줄(`흐리고 오후 비`)
3. 지표 한 줄: 기온 / 습도 / 강수 / 바람 4칸, 위아래 1.5px `ink` 선, 칸 사이 1px `rule`, 값은 Mono
4. 시간대 4칸: `08 출근` / `12` / `18 퇴근` / `22` — 체감온도 + 상태. **비 오는 칸은 배경을 `ink`로 반전**
5. 팁 띠: `accent` 배경, 우산 아이콘 + `outfit.tip`. tip 없으면 숨김
6. "오늘의 옷" 헤더 + Mono `N ITEMS` → **3열 라벨 카드 그리드**: 상단 Mono 카테고리 라벨(OUTER/TOP/…), 이미지 자리, 이름, 재질. 재질 점수로 뽑힌 옷(`boostedIds`)은 라벨 줄 오른쪽에 `accent` 점.
7. 하단 탭: 오늘 / 옷장 / 설정 (현재 탭은 위쪽 3px `ink` 선 + 굵게)

### 화면 — 옷장 (`src/screens/ClosetScreen.tsx`)

- 제목 `옷장` + Mono `26벌 · 3벌 제외 중`
- 카테고리 탭(전체/아우터/상의/하의/원피스/이너/레그웨어/소품): 둥근 알약형, 선택 시 `ink` 배경 반전
- 안내 한 줄: `탭하면 추천에서 빠져요. 다시 탭하면 돌아와요.`
- 3열 그리드 카드: 이미지 자리, 이름(제외 시 취소선), `재질 · 온도범위`. 제외된 카드는 opacity 0.5 + 우상단 `제외` 뱃지.
- 카드 전체가 버튼. `accessibilityState={{ selected }}`, 라벨 `"니트 — 탭하면 추천에서 제외"`.

### 화면 — 설정 (`src/screens/SettingsScreen.tsx`)

- 위치 권한 상태(항상 허용 / 앱 사용 중만 / 거부)와 설정 열기 버튼
- 체감 보정 (−3 ~ +3, 기본 0)
- `Weather data by Open-Meteo.com` 출처 링크 (필수)
- 개인정보처리방침 링크 (URL은 상수로 두고 지금은 `TODO`)

---

## 10. 옷 이미지 — PNG, 지금은 비워둔다

사용자가 나중에 **PNG 파일**을 직접 넣는다. 지금은 파일이 하나도 없어도 앱과 위젯이 정상 동작해야 한다.

### 파일 규칙

- 위치: `assets/clothes/`
- 파일명: `카테고리_이름_재질_번호.png` = 카탈로그 `id` + `.png` 예) `bottom_jeans_denim_01.png`, `top_shirt_linen_01.png`
- 권장 규격(사용자 안내용으로 `assets/clothes/README.md`에 적어 둘 것): 정사각형, 배경 투명, 512×512px 이하. 위젯은 이미지 메모리 제한이 있으므로 너무 큰 파일은 피한다.

### 매핑 (`src/outfit/images.ts`)

React Native는 `require()` 경로를 동적으로 만들 수 없으므로, 이미지는 **정적 매핑 파일 하나**로 관리한다.

```ts
// 파일을 추가하면 여기에 한 줄만 추가한다. 없는 항목은 자리표시자로 표시된다.
export const CLOTH_IMAGES: Partial<Record<string, number>> = {
  // bottom_jeans_denim_01: require('../../assets/clothes/bottom_jeans_denim_01.png'),
};
export const getClothImage = (id: string) => CLOTH_IMAGES[id];
```

- 지금은 **빈 객체**로 둔다. 주석 처리된 예시 한 줄만 남긴다.
- 선택 사항: `assets/clothes/`의 파일 목록을 읽어 이 파일을 다시 만들어 주는 스크립트 `scripts/gen-cloth-images.mjs`를 만들고 `package.json`에 `"gen:images"`로 등록. 파일명이 카탈로그 `id`와 맞지 않으면 경고를 출력.

### `ClothImage` 컴포넌트 (`src/ui/ClothImage.tsx`)

- 이미지가 있으면 `<Image source={…} resizeMode="contain" />`
- 없으면 **자리표시자**: `tile` 색 사각형 + 가운데 `sub` 색 옷걸이 선 아이콘(react-native-svg) + 작은 Mono 카테고리 약자(OUT/TOP/BTM/OP/IN/LEG/ACC)
- 이미지를 임의로 만들거나 외부에서 내려받지 말 것.

---

## 11. 위젯 (react-native-android-widget)

### 공통 규칙

- 위젯 컴포넌트에서는 **React 훅 사용 금지** (useState, useEffect 등). props만 받아서 그린다.
- 데이터는 `widget-task-handler.tsx`에서 `getTodayOutfit()`을 호출해 계산한 뒤 props로 넘긴다.
- `WIDGET_ADDED`, `WIDGET_UPDATE`, `WIDGET_RESIZED`에서 렌더. 앱 열기는 루트에 `clickAction="OPEN_APP"`(네이티브가 바로 처리)이라 `WIDGET_CLICK`에서 할 일은 없다.
- 라이트/다크 둘 다 `renderWidget({ light, dark })`로 제공.
- 주기 갱신: `updatePeriodMillis` 사용 (시스템 최소값은 30분. 1시간 정도 권장). 앱 안에서 제외 목록·위치·날씨가 바뀌면 `requestWidgetUpdate()`.
- 커스텀 폰트는 `android/app/src/main/assets/fonts/`의 TTF를 그대로 쓴다. `fontFamily`는 `FONT.*`(파일명).
- 위젯을 추가하려면 (config plugin이 없으므로 수동): ① `android/.../widget/<Name>.kt` (`RNWidgetProvider` 상속) ② `res/xml/widgetprovider_<name 소문자>.xml` ③ `AndroidManifest.xml`에 `<receiver android:name=".widget.<Name>">` ④ `widgets/renderWidget.tsx`의 `WIDGET_NAMES`에 같은 이름.
- 라이브러리 제약: **Fragment(`<>`) 사용 금지**(변환기가 처리 못 함), `letterSpacing`은 px, 위젯 파일 맨 위에 `'use no memo';`(React Compiler 비활성).
- 위젯 JSX가 네이티브 트리로 변환되는지는 `__tests__/widget.test.tsx`가 라이브러리의 `buildWidgetTree`로 검증한다. 위젯을 고치면 이 테스트를 꼭 돌릴 것.
- 쓸 수 있는 요소는 텍스트, 이미지, SVG, 단순 레이아웃뿐이라는 전제에서 디자인 유지.
- 옷 이미지는 `ImageWidget`으로 그린다. `getClothImage(id)`가 돌려주는 소스를 그대로 넘길 수 있는지 라이브러리 문서에서 `ImageWidget`이 지원하는 소스 형식(require 리소스, data URI 등)을 확인하고 맞출 것. 이미지가 없으면 앱과 같은 모양의 자리표시자(타일 + 카테고리 약자 텍스트).
- 포인트 컬러(배지, 비/눈 점)는 핸들러에서 `getAccent(outfit.band)`로 정해 props로 받는다.

### 4×2 (`TodayOutfitWidget`)

- 배경 `card`, 모서리 22
- 왼쪽: 지역명(12px 600) / Mono `체감 · 9–11°` / **체감온도 약 58px 700** / 하단 `accent` 배지(`오후 비 · 우산` — tip 요약, 없으면 숨김)
- 오른쪽: 2×2 이미지 타일(outer, top 또는 onepiece, bottom, extras 첫 번째) — 각 타일 `tile` 배경 + `ClothImage` 자리표시자 + 이름 10px

### 2×2 (`TodayOutfitSmallWidget`)

- 체감온도 약 44px + 비/눈이면 오른쪽 위 `accent` 점
- 하단 이미지 타일 2개(outer 또는 top, 그다음 아이템) + 짧은 이름

### 에러 상태

- 위치·날씨 모두 실패하고 캐시도 없으면: `"앱을 한 번 열어 위치를 설정해 주세요"` 한 줄.

---

## 12. Google Play 출시 준비 (코드 외 체크리스트, 문서로만 정리)

- 패키지명 `com.developer_cm.weatherclothes`로 Play Console에 앱 생성. 대시보드에서 **프로덕션 메뉴가 바로 열리는지 확인** (개인 계정의 비공개 테스트 요건 적용 여부가 불확실함 — 사용자가 직접 확인 예정). 필요하면 비공개 테스트 12명/14일.
- **백그라운드 위치 권한 선언서**: "홈 화면 위젯이 사용자의 현재 위치 날씨에 맞는 옷차림을 보여줌"으로 핵심 기능과 직접 연결해서 작성.
- **시연 영상**: 사전 고지 화면 → 권한 허용 → 에뮬레이터에서 위치를 바꿨을 때 위젯이 바뀌는 장면.
- **개인정보처리방침**: 대략적 위치는 날씨 조회에만 사용, Open-Meteo로 좌표만 전송, 저장·공유하지 않음, 계정·분석 없음. (GitHub Pages 등 정적 페이지로 게시)
- 데이터 보안 양식: 위치(대략적) 수집 → 앱 기능용, 공유 안 함.
- 개발 중에는 **내부 테스트 트랙**으로 배포해서 사용자 본인이 먼저 사용.

---

## 13. 작업 순서와 완료 기준

각 단계가 끝나면 무엇을 했는지 짧게 보고하고 다음 단계로 진행.

> **진행 상황 (2026-10-29, `feat/initial-app`)**: 1~8단계 코드 작성 완료. `npm test`(103개)·`npm run typecheck`·`npm run lint` 통과, `expo export:embed`로 Android 프로덕션 JS 번들 생성 확인.
> **아직 확인 못 한 것**: 실제 기기/에뮬레이터 실행, Gradle 빌드, 릴리스 AAB 생성 (작업 환경에 Android SDK가 없었음). 9단계의 기기 확인부터 이어서 할 것.

1. **프로젝트 생성** — RN CLI + Expo 모듈 + React Navigation, 폰트, 토큰, 하단 탭 3개가 뜬다.
2. **추천 로직 + 테스트** — `bands`, `tags`, `materialScore`, `seed`, `recommend`, 카탈로그 시드. `jest` 전부 통과.
3. **날씨** — Open-Meteo 호출, 정규화, 캐시 규칙. 고정 좌표(부산)로 오늘 화면에 실제 값이 뜬다.
4. **위치** — 온보딩(사전 고지 → 포그라운드 → 백그라운드), `getLocation`, 역지오코딩. 거부 시에도 앱이 동작.
5. **오늘 화면 완성** — 9장 레이아웃 그대로. 이미지 자리표시자 사용.
6. **옷장 화면** — 필터, 제외 토글, 저장, 개수 표시.
7. **설정 화면** — 권한 상태, 체감 보정, 출처, 개인정보 링크.
8. **위젯 4×2 / 2×2** — 핸들러에서 `getTodayOutfit()`, 라이트/다크, 앱에서 제외 변경 시 즉시 갱신.
9. **마무리** — 에러/오프라인 상태, 접근성 라벨, 릴리스 빌드(AAB) 생성 확인, 12장 체크리스트를 `docs/play-release.md`로 정리.

## 하지 말 것

- 서버/클라우드/푸시/분석 SDK 추가
- `ACCESS_FINE_LOCATION` 요청
- 옷 이미지를 임의로 만들거나 외부 이미지 사용 (사용자가 PNG를 직접 넣는다)
- 강조색을 하드코딩 (항상 `getAccent(band)` 사용)
- 위젯 컴포넌트 안에서 데이터 계산·훅 사용
- 이 문서의 확정 사항을 묻지 않고 변경
