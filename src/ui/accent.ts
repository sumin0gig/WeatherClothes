import type { Band } from '../outfit/types';

/**
 * 날씨 포인트 컬러. 더우면 빨강 → 선선하면 초록 → 추우면 파랑.
 * 라이트/다크 모두 같은 색을 쓰고, 위에 얹는 글자는 항상 ACCENT_TEXT.
 * 모든 값은 ACCENT_TEXT 대비 5.7:1 이상.
 */
export const ACCENT_BY_BAND: Record<Band, string> = {
  8: '#FF5A4E', // 28° 이상 · 빨강
  7: '#FF7A3D', // 23~27° · 주황
  6: '#FFB23A', // 20~22° · 호박
  5: '#C9D84A', // 17~19° · 연두
  4: '#6FD07A', // 12~16° · 초록
  3: '#3FC6B4', // 9~11° · 청록
  2: '#5AA8F0', // 5~8° · 하늘
  1: '#7C8CFF', // 4° 이하 · 파랑
};

/** 강조색 위에 올리는 글자색 (라이트/다크 공통) */
export const ACCENT_TEXT = '#16181D';

export const getAccent = (band: Band): string => ACCENT_BY_BAND[band];
