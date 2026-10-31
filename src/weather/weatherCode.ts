/** WMO weather code 분류와 한국어 라벨. https://open-meteo.com/en/docs 의 표 기준. */

export const isRainCode = (code: number): boolean =>
  (code >= 51 && code <= 67) ||
  (code >= 80 && code <= 82) ||
  (code >= 95 && code <= 99);

export const isSnowCode = (code: number): boolean =>
  (code >= 71 && code <= 77) || code === 85 || code === 86;

export function weatherLabel(code: number): string {
  if (code === 0) return '맑음';
  if (code === 1) return '대체로 맑음';
  if (code === 2) return '구름 조금';
  if (code === 3) return '흐림';
  if (code === 45 || code === 48) return '안개';
  if (code >= 51 && code <= 57) return '이슬비';
  if (code >= 61 && code <= 67) return '비';
  if (code >= 71 && code <= 77) return '눈';
  if (code >= 80 && code <= 82) return '소나기';
  if (code === 85 || code === 86) return '눈';
  if (code >= 95 && code <= 99) return '뇌우';
  return '알 수 없음';
}
