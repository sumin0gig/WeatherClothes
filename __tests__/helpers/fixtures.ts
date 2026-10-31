import type { Weather } from '../../src/weather/types';

/** 테스트용 날씨. 기본값은 맑고 바람 없는 날. */
export function makeWeather(overrides: Partial<Weather> = {}): Weather {
  return {
    temp: 15,
    apparentTemp: 15,
    humidity: 40,
    precipProb: 0,
    windSpeed: 5,
    code: 0,
    hourly: [],
    fetchedAt: 0,
    ...overrides,
  };
}
