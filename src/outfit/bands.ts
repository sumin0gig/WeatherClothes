import type { Weather } from '../weather/types';
import type { Band } from './types';

/** 체감온도 8구간. 하한값 기준으로 판정한다. 예: 체감 22.5° → 구간 6. */
export const BANDS = [
  { band: 8, min: 28, label: '28° 이상', short: '28°~' },
  { band: 7, min: 23, label: '23~27°', short: '23–27°' },
  { band: 6, min: 20, label: '20~22°', short: '20–22°' },
  { band: 5, min: 17, label: '17~19°', short: '17–19°' },
  { band: 4, min: 12, label: '12~16°', short: '12–16°' },
  { band: 3, min: 9, label: '9~11°', short: '9–11°' },
  { band: 2, min: 5, label: '5~8°', short: '5–8°' },
  { band: 1, min: -Infinity, label: '4° 이하', short: '~4°' },
] as const;

export const getBand = (apparentTemp: number): Band =>
  BANDS.find(b => apparentTemp >= b.min)!.band as Band;

export const bandInfo = (band: Band) => BANDS.find(b => b.band === band)!;

/**
 * 추천에 쓰는 체감온도. 지금은 "현재 체감온도 + 사용자 보정값".
 * 나중에 "외출 시간대 최저 체감온도"로 바꾸려면 이 함수만 고치면 된다.
 */
export function getTargetApparentTemp(
  weather: Weather,
  apparentOffset = 0,
): number {
  return weather.apparentTemp + apparentOffset;
}

/** 옷장 화면용 온도 범위 표기. [4,5,6] → '12–22°', [1] → '~4°', [7,8] → '23°~' */
export function formatBandRange(bands: Band[]): string {
  if (bands.length === 0) return '';
  const lo = Math.min(...bands) as Band;
  const hi = Math.max(...bands) as Band;
  if (lo === hi) return bandInfo(lo).short;
  if (lo === 1 && hi === 8) return '모든 온도';
  const from = lo === 1 ? '' : `${bandInfo(lo).min}`;
  const to = hi === 8 ? '' : `${bandInfo((hi + 1) as Band).min - 1}`;
  if (!from) return `~${to}°`;
  if (!to) return `${from}°~`;
  return `${from}–${to}°`;
}
