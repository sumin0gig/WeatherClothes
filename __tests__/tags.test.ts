import { getTags } from '../src/outfit/tags';
import { isRainCode, isSnowCode } from '../src/weather/weatherCode';
import { makeWeather } from './helpers/fixtures';

describe('getTags', () => {
  it('선선하고 맑은 날은 태그가 없다', () => {
    expect(getTags(makeWeather(), 4)).toEqual([]);
  });

  it('hot / humid', () => {
    expect(getTags(makeWeather({ humidity: 80 }), 7)).toEqual(['hot', 'humid']);
    expect(getTags(makeWeather({ humidity: 60 }), 8)).toEqual(['hot']);
    expect(getTags(makeWeather({ humidity: 80 }), 6)).toEqual(['humid']);
    expect(getTags(makeWeather({ humidity: 80 }), 5)).toEqual([]);
  });

  it('cold', () => {
    expect(getTags(makeWeather(), 2)).toEqual(['cold']);
    expect(getTags(makeWeather(), 1)).toEqual(['cold']);
    expect(getTags(makeWeather(), 3)).toEqual([]);
  });

  it('rain: 강수확률 50% 이상 또는 비 코드', () => {
    expect(getTags(makeWeather({ precipProb: 50 }), 4)).toEqual(['rain']);
    expect(getTags(makeWeather({ precipProb: 49 }), 4)).toEqual([]);
    expect(getTags(makeWeather({ code: 61 }), 4)).toEqual(['rain']);
  });

  it('snow / windy', () => {
    expect(getTags(makeWeather({ code: 73 }), 1)).toEqual(['cold', 'snow']);
    expect(getTags(makeWeather({ windSpeed: 30 }), 4)).toEqual(['windy']);
    expect(getTags(makeWeather({ windSpeed: 29.9 }), 4)).toEqual([]);
  });
});

describe('weather code', () => {
  it('비/눈 분류', () => {
    for (const c of [51, 55, 61, 67, 80, 82, 95, 99])
      expect(isRainCode(c)).toBe(true);
    for (const c of [0, 3, 45, 71, 85]) expect(isRainCode(c)).toBe(false);
    for (const c of [71, 75, 77, 85, 86]) expect(isSnowCode(c)).toBe(true);
    for (const c of [0, 61, 80, 95]) expect(isSnowCode(c)).toBe(false);
  });
});
