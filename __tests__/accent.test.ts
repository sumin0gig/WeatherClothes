import { ACCENT_BY_BAND, ACCENT_TEXT, getAccent } from '../src/ui/accent';
import type { Band } from '../src/outfit/types';

function luminance(hex: string): number {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map(v =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('accent', () => {
  const bands: Band[] = [1, 2, 3, 4, 5, 6, 7, 8];

  it('구간마다 색이 하나씩 있고 모두 다르다', () => {
    const colors = bands.map(getAccent);
    expect(new Set(colors).size).toBe(8);
  });

  it('더운 쪽은 빨강, 추운 쪽은 파랑 계열', () => {
    const rgb = (hex: string) =>
      [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    const [r8, , b8] = rgb(ACCENT_BY_BAND[8]);
    const [r1, , b1] = rgb(ACCENT_BY_BAND[1]);
    expect(r8).toBeGreaterThan(b8);
    expect(b1).toBeGreaterThan(r1);
  });

  it.each(bands)('구간 %p: 먹색 글자 대비 4.5:1 이상', band => {
    expect(contrast(getAccent(band), ACCENT_TEXT)).toBeGreaterThanOrEqual(4.5);
  });
});
