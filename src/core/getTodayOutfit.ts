import { getLocation } from '../location/getLocation';
import { CATALOG } from '../outfit/catalog';
import { recommend } from '../outfit/recommend';
import { toDateKey } from '../outfit/seed';
import type { Outfit } from '../outfit/types';
import { getExcludedIds, getSettings } from '../storage/prefs';
import {
  getWeatherCache,
  isCacheFresh,
  setWeatherCache,
} from '../storage/weatherCache';
import { fetchForecast } from '../weather/openMeteo';
import type { Weather } from '../weather/types';

export type TodayOutfit = {
  locationName: string;
  weather: Weather;
  outfit: Outfit;
  /** 날씨를 가져온 시각 */
  updatedAt: number;
  /** 네트워크 실패로 오래된 캐시를 쓴 경우 */
  stale: boolean;
};

export type GetTodayOutfitOptions = {
  /** 위젯 핸들러에서 부르면 true */
  inBackground?: boolean;
  /** 캐시 조건과 관계없이 날씨를 새로 받는다 (사용자가 새로고침을 누른 경우) */
  forceRefresh?: boolean;
};

/** 위치도 저장된 위치도 없는 경우 */
export class NoLocationError extends Error {
  constructor() {
    super('NO_LOCATION');
    this.name = 'NoLocationError';
  }
}

/** 위치는 있지만 날씨를 받지 못했고 캐시도 없는 경우 */
export class NoWeatherError extends Error {
  constructor(cause?: unknown) {
    super('NO_WEATHER');
    this.name = 'NoWeatherError';
    this.cause = cause;
  }
}

/**
 * 오늘의 옷차림. 앱 화면과 위젯 핸들러가 모두 이 함수 하나만 호출한다.
 * 위치 → 날씨(캐시 규칙) → 제외 목록·설정 → recommend()
 */
export async function getTodayOutfit(
  options: GetTodayOutfitOptions = {},
): Promise<TodayOutfit> {
  const location = await getLocation({ inBackground: options.inBackground });
  if (!location) throw new NoLocationError();

  const now = Date.now();
  const cache = await getWeatherCache();
  let weather: Weather;
  let stale = false;

  if (
    !options.forceRefresh &&
    cache &&
    isCacheFresh(cache, location.lat, location.lon, now)
  ) {
    weather = cache.weather;
  } else {
    try {
      weather = await fetchForecast(location.lat, location.lon);
      await setWeatherCache({ weather, lat: location.lat, lon: location.lon });
    } catch (e) {
      if (!cache) throw new NoWeatherError(e);
      weather = cache.weather;
      stale = true;
    }
  }

  const [excludedIds, settings] = await Promise.all([
    getExcludedIds(),
    getSettings(),
  ]);
  const outfit = recommend(
    weather,
    CATALOG,
    excludedIds,
    toDateKey(new Date(now)),
    {
      apparentOffset: settings.apparentOffset,
    },
  );

  return {
    locationName: location.name,
    weather,
    outfit,
    updatedAt: weather.fetchedAt,
    stale,
  };
}
