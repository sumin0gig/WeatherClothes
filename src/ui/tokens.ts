/**
 * 디자인 토큰 — 콘셉트: 옷의 케어 라벨(세탁 택).
 * 회녹색 종이 바탕, 먹색 테두리 박스, 대문자 모노스페이스 라벨, 굵은 숫자 하나를 크게.
 * 강조색(accent)은 여기에 없다: 날씨에 따라 바뀌므로 항상 getAccent(band)로 정한다.
 */

export type Palette = {
  bg: string;
  card: string;
  tile: string;
  ink: string;
  sub: string;
  rule: string;
};

export const LIGHT: Palette = {
  bg: '#E9EBE6',
  card: '#F7F8F5',
  tile: '#DDE0D9',
  ink: '#16181D',
  sub: '#5A5E66',
  rule: '#B9BDB4',
};

export const DARK: Palette = {
  bg: '#111317',
  card: '#1C1F25',
  tile: '#2A2D34',
  ink: '#E9EBE6',
  sub: '#A9AEA6',
  rule: '#3A3E46',
};

/**
 * 폰트 패밀리 = android/app/src/main/assets/fonts 의 파일명(확장자 제외).
 * 앱과 위젯이 같은 파일을 쓴다. 커스텀 폰트는 fontWeight 대신 패밀리로 굵기를 고른다.
 */
export const FONT = {
  sans400: 'IBMPlexSansKR_400Regular',
  sans500: 'IBMPlexSansKR_500Medium',
  sans600: 'IBMPlexSansKR_600SemiBold',
  sans700: 'IBMPlexSansKR_700Bold',
  mono400: 'IBMPlexMono_400Regular',
  mono500: 'IBMPlexMono_500Medium',
  mono600: 'IBMPlexMono_600SemiBold',
} as const;

export type FontKey = keyof typeof FONT;

export const BORDER = {
  card: 1.5,
  hairline: 1,
} as const;

export const RADIUS = {
  card: 6,
  pill: 18,
  widget: 22,
  widgetTile: 10,
} as const;

export const SPACE = {
  gutter: 20,
  gap: 8,
} as const;

/** 터치 영역 최소 크기 */
export const MIN_TOUCH = 44;
