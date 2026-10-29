/**
 * Open-Meteo 예보 API. API 키가 필요 없어 서버 없이 앱에서 바로 호출한다.
 *
 * 라이선스/약관:
 * - 무료 API는 비상업적 사용, 하루 1만 회 미만 호출 조건.
 * - 데이터는 CC BY 4.0 → 설정 화면에 "Weather data by Open-Meteo.com" 출처 표기 필수.
 * - 광고·유료화 등 상업적으로 쓰게 되면 유료 플랜(API 키)이 필요하다.
 */
import type { HourlyPoint, Weather } from './types';

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 10_000;

type OpenMeteoResponse = {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  hourly: {
    time: string[];
    apparent_temperature: number[];
    precipitation_probability: (number | null)[];
    weather_code: number[];
  };
};

export function buildForecastUrl(lat: number, lon: number): string {
  const params = [
    `latitude=${lat.toFixed(4)}`,
    `longitude=${lon.toFixed(4)}`,
    'current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
    'hourly=apparent_temperature,precipitation_probability,weather_code',
    'forecast_days=1',
    'timezone=auto',
  ];
  return `${ENDPOINT}?${params.join('&')}`;
}

/** Open-Meteo 응답 → 내부 Weather 형식 */
export function normalizeForecast(
  json: OpenMeteoResponse,
  fetchedAt: number,
): Weather {
  const { current, hourly } = json;
  const points: HourlyPoint[] = hourly.time.map((time, i) => ({
    time,
    apparentTemp: hourly.apparent_temperature[i],
    precipProb: hourly.precipitation_probability[i] ?? 0,
    code: hourly.weather_code[i],
  }));
  // current.time('2026-10-29T14:15')과 같은 시(hour)의 강수확률을 현재 값으로 쓴다
  const currentHour = current.time.slice(0, 13);
  const now = points.find(p => p.time.startsWith(currentHour));

  return {
    temp: current.temperature_2m,
    apparentTemp: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    precipProb: now?.precipProb ?? 0,
    windSpeed: current.wind_speed_10m,
    code: current.weather_code,
    hourly: points,
    fetchedAt,
  };
}

export async function fetchForecast(
  lat: number,
  lon: number,
): Promise<Weather> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(buildForecastUrl(lat, lon), {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
    const json = (await res.json()) as OpenMeteoResponse;
    return normalizeForecast(json, Date.now());
  } finally {
    clearTimeout(timer);
  }
}
