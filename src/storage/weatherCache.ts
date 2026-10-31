import type { Weather } from '../weather/types';
import { STORAGE_KEYS } from './keys';
import { isNumber, isObject, readJson, writeJson } from './json';

export type WeatherCache = {
  weather: Weather;
  /** 이 날씨를 조회한 좌표 */
  lat: number;
  lon: number;
};

/** 캐시 사용 조건: 1시간 이내 AND 3km 이내 */
export const CACHE_MAX_AGE_MS = 60 * 60 * 1000;
export const CACHE_MAX_DISTANCE_KM = 3;

const isWeatherCache = (v: unknown): v is WeatherCache =>
  isObject(v) &&
  isNumber(v.lat) &&
  isNumber(v.lon) &&
  isObject(v.weather) &&
  isNumber(v.weather.apparentTemp) &&
  isNumber(v.weather.fetchedAt) &&
  Array.isArray(v.weather.hourly);

export const getWeatherCache = () =>
  readJson<WeatherCache | null>(
    STORAGE_KEYS.weatherCache,
    null,
    (v): v is WeatherCache | null => v === null || isWeatherCache(v),
  );

export const setWeatherCache = (cache: WeatherCache) =>
  writeJson(STORAGE_KEYS.weatherCache, cache);

/** 두 좌표 사이 거리 (km, haversine) */
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isCacheFresh(
  cache: WeatherCache,
  lat: number,
  lon: number,
  now: number,
): boolean {
  const age = now - cache.weather.fetchedAt;
  return (
    age >= 0 &&
    age < CACHE_MAX_AGE_MS &&
    distanceKm(cache.lat, cache.lon, lat, lon) < CACHE_MAX_DISTANCE_KM
  );
}
