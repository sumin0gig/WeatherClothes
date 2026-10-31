import type { Band } from '../outfit/types';

/**
 * 날씨 포인트 컬러. 더우면 빨강 → 선선하면 초록 → 추우면 파랑.
 * 라이트/다크 모두 같은 색을 쓰고, 위에 얹는 글자는 항상 ACCENT_TEXT.
 * 모든 값은 ACCENT_TEXT 대비 5:1 이상 (2026-10-30 채도를 올린 팔레트로 교체).
 */
export const ACCENT_BY_BAND: Record<Band, string> = {
  8: '#FC433B', // 28° 이상 · 빨강
  7: '#FC691A', // 23~27° · 주황
  6: '#F7A719', // 20~22° · 호박
  5: '#C0CF21', // 17~19° · 연두
  4: '#39CD57', // 12~16° · 초록
  3: '#1BBEAB', // 9~11° · 청록
  2: '#339EF8', // 5~8° · 하늘
  1: '#7281FB', // 4° 이하 · 파랑
};

/** 강조색 위에 올리는 글자색 (라이트/다크 공통) */
export const ACCENT_TEXT = '#16181D';

export const getAccent = (band: Band): string => ACCENT_BY_BAND[band];
