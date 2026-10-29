import { distanceKm, isCacheFresh } from '../src/storage/weatherCache';
import { buildForecastUrl, normalizeForecast } from '../src/weather/openMeteo';
import { describeDay, hourSlots } from '../src/weather/summary';
import { weatherLabel } from '../src/weather/weatherCode';
import { sampleForecastJson } from './helpers/forecast';
import { makeWeather } from './helpers/fixtures';

describe('Open-Meteo', () => {
  it('요청 URL에 필요한 항목이 모두 있다', () => {
    const url = buildForecastUrl(35.16, 129.16);
    expect(url).toContain('latitude=35.1600');
    expect(url).toContain('longitude=129.1600');
    expect(url).toContain('apparent_temperature');
    expect(url).toContain('precipitation_probability');
    expect(url).toContain('wind_speed_10m');
    expect(url).toContain('timezone=auto');
    expect(url).toContain('forecast_days=1');
  });

  it('응답을 내부 Weather로 정규화한다', () => {
    const w = normalizeForecast(sampleForecastJson() as any, 1234);
    expect(w).toMatchObject({
      temp: 13.2,
      apparentTemp: 11.4,
      humidity: 72,
      windSpeed: 12.3,
      code: 3,
      fetchedAt: 1234,
      precipProb: 30, // 14시 값
    });
    expect(w.hourly).toHaveLength(24);
    expect(w.hourly[3].precipProb).toBe(0); // null → 0
  });
});

describe('캐시 규칙', () => {
  const cache = {
    weather: makeWeather({ fetchedAt: 1_000_000 }),
    lat: 35.16,
    lon: 129.16,
  };

  it('거리 계산', () => {
    expect(distanceKm(35.16, 129.16, 35.16, 129.16)).toBe(0);
    // 부산-서울 약 325km
    expect(distanceKm(35.1796, 129.0756, 37.5665, 126.978)).toBeGreaterThan(
      300,
    );
  });

  it('1시간 이내 + 3km 이내면 캐시를 쓴다', () => {
    expect(isCacheFresh(cache, 35.16, 129.16, 1_000_000 + 59 * 60_000)).toBe(
      true,
    );
    expect(isCacheFresh(cache, 35.17, 129.17, 1_000_000)).toBe(true); // 약 1.4km
  });

  it('1시간이 지나거나 3km 넘게 이동하면 새로 받는다', () => {
    expect(isCacheFresh(cache, 35.16, 129.16, 1_000_000 + 60 * 60_000)).toBe(
      false,
    );
    expect(isCacheFresh(cache, 35.2, 129.16, 1_000_000)).toBe(false); // 약 4.4km
    expect(isCacheFresh(cache, 35.16, 129.16, 999_000)).toBe(false); // 시계가 거꾸로
  });
});

describe('날씨 요약', () => {
  const at = (hour: number) => new Date(2026, 9, 29, hour, 15).getTime();

  it('지금은 흐리고 오후(17시)에 비가 오면 덧붙인다', () => {
    const w = normalizeForecast(sampleForecastJson() as any, at(14));
    expect(describeDay(w)).toBe('흐림 · 오후 비');
  });

  it('지금 비가 오면 그대로', () => {
    const w = normalizeForecast(
      sampleForecastJson({ code: 61 }) as any,
      at(14),
    );
    expect(describeDay(w)).toBe('비');
  });

  it('시간대 4칸: 비 오는 칸은 wet', () => {
    const w = normalizeForecast(sampleForecastJson() as any, at(14));
    const slots = hourSlots(w);
    expect(slots.map(s => s.label)).toEqual(['08 출근', '12', '18 퇴근', '22']);
    expect(slots.map(s => s.wet)).toEqual([false, false, true, true]);
    expect(slots[2].status).toBe('비 60%');
    expect(slots[0].status).toBe('흐림');
  });

  it('시간대 데이터가 없으면 빈 칸', () => {
    expect(
      hourSlots(makeWeather()).every(s => s.status === '—' && !s.wet),
    ).toBe(true);
  });

  it('weatherLabel', () => {
    expect(weatherLabel(0)).toBe('맑음');
    expect(weatherLabel(45)).toBe('안개');
    expect(weatherLabel(95)).toBe('뇌우');
  });
});
