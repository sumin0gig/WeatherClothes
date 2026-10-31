import { isRainCode, isSnowCode, weatherLabel } from './weatherCode';
import type { HourlyPoint, Weather } from './types';

const WET_PROB = 50;

const isWet = (p: Pick<HourlyPoint, 'precipProb' | 'code'>) =>
  p.precipProb >= WET_PROB || isRainCode(p.code) || isSnowCode(p.code);

const hourOf = (time: string) => Number(time.slice(11, 13));

function partOfDay(hour: number): string {
  if (hour < 12) return '오전';
  if (hour < 18) return '오후';
  if (hour < 21) return '저녁';
  return '밤';
}

/**
 * 히어로 옆 날씨 한 줄. 예) '흐림', '흐림 · 오후 비', '비'
 * 지금은 젖지 않았는데 오늘 남은 시간에 비/눈이 오면 시간대를 덧붙인다.
 */
export function describeDay(weather: Weather): string {
  const now = weatherLabel(weather.code);
  if (isWet(weather)) return now;
  const currentHour = new Date(weather.fetchedAt).getHours();
  const later = weather.hourly.find(
    p => hourOf(p.time) > currentHour && isWet(p),
  );
  if (!later) return now;
  const what = isSnowCode(later.code) ? '눈' : '비';
  return `${now} · ${partOfDay(hourOf(later.time))} ${what}`;
}

export type HourSlot = {
  label: string;
  apparentTemp?: number;
  status: string;
  wet: boolean;
};

/** 오늘 화면 시간대 4칸: 08 출근 / 12 / 18 퇴근 / 22 */
const SLOTS: { hour: number; label: string }[] = [
  { hour: 8, label: '08 출근' },
  { hour: 12, label: '12' },
  { hour: 18, label: '18 퇴근' },
  { hour: 22, label: '22' },
];

export function hourSlots(weather: Weather): HourSlot[] {
  return SLOTS.map(({ hour, label }) => {
    const p = weather.hourly.find(h => hourOf(h.time) === hour);
    if (!p) return { label, status: '—', wet: false };
    const wet = isWet(p);
    const status = wet
      ? `${isSnowCode(p.code) ? '눈' : '비'} ${Math.round(p.precipProb)}%`
      : weatherLabel(p.code);
    return { label, apparentTemp: p.apparentTemp, status, wet };
  });
}
