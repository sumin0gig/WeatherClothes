import type { Weather } from '../weather/types';
import { isRainCode, isSnowCode } from '../weather/weatherCode';
import type { Band, WeatherTag } from './types';

/** 날씨 태그 임계값. 써보면서 조정할 값은 모두 여기에 모은다. */
export const TAG_THRESHOLDS = {
  /** band >= 이 값이면 hot */
  hotMinBand: 7,
  /** band >= 이 값 && 습도 >= humidMinHumidity 이면 humid */
  humidMinBand: 6,
  humidMinHumidity: 70,
  /** band <= 이 값이면 cold */
  coldMaxBand: 2,
  /** 강수확률(%) >= 이 값이면 rain */
  rainMinPrecipProb: 50,
  /** 풍속(km/h) >= 이 값이면 windy */
  windyMinSpeed: 30,
} as const;

export function getTags(weather: Weather, band: Band): WeatherTag[] {
  const t = TAG_THRESHOLDS;
  const tags: WeatherTag[] = [];
  if (band >= t.hotMinBand) tags.push('hot');
  if (band >= t.humidMinBand && weather.humidity >= t.humidMinHumidity)
    tags.push('humid');
  if (band <= t.coldMaxBand) tags.push('cold');
  if (weather.precipProb >= t.rainMinPrecipProb || isRainCode(weather.code))
    tags.push('rain');
  if (isSnowCode(weather.code)) tags.push('snow');
  if (weather.windSpeed >= t.windyMinSpeed) tags.push('windy');
  return tags;
}
