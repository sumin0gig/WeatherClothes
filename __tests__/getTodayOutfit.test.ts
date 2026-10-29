import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTodayOutfit,
  NoLocationError,
  NoWeatherError,
} from '../src/core/getTodayOutfit';
import { formatPlaceName } from '../src/location/getLocation';
import { setExcludedIds, setSettings } from '../src/storage/prefs';
import { sampleForecastJson } from './helpers/forecast';

const perm = { fg: false, bg: false };
const position = { coords: { latitude: 35.1631, longitude: 129.1636 } };

jest.mock('expo-location', () => ({
  Accuracy: { Low: 2 },
  getForegroundPermissionsAsync: jest.fn(async () => ({ granted: perm.fg })),
  getBackgroundPermissionsAsync: jest.fn(async () => ({ granted: perm.bg })),
  getLastKnownPositionAsync: jest.fn(async () => position),
  getCurrentPositionAsync: jest.fn(async () => position),
  reverseGeocodeAsync: jest.fn(async () => [
    { city: null, region: '부산광역시', district: '해운대구', subregion: null },
  ]),
}));

const fetchMock = jest.fn();
(globalThis as any).fetch = fetchMock;

const okResponse = () => ({ ok: true, json: async () => sampleForecastJson() });

beforeEach(async () => {
  await AsyncStorage.clear();
  fetchMock.mockReset();
  perm.fg = false;
  perm.bg = false;
  jest.useRealTimers();
});

describe('getTodayOutfit', () => {
  it('권한도 저장된 위치도 없으면 NoLocationError', async () => {
    await expect(getTodayOutfit()).rejects.toBeInstanceOf(NoLocationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('위치 → 날씨 → 추천, 지역명은 "부산 해운대구"', async () => {
    perm.fg = true;
    fetchMock.mockResolvedValue(okResponse());
    const result = await getTodayOutfit();
    expect(result.locationName).toBe('부산 해운대구');
    expect(result.weather.apparentTemp).toBe(11.4);
    expect(result.outfit.band).toBe(3);
    expect(result.stale).toBe(false);
  });

  it('1시간 이내 같은 곳이면 캐시를 써서 네트워크를 다시 부르지 않는다', async () => {
    perm.fg = true;
    fetchMock.mockResolvedValue(okResponse());
    await getTodayOutfit();
    await getTodayOutfit();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await getTodayOutfit({ forceRefresh: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('네트워크 실패 시 캐시가 있으면 stale로 돌려준다', async () => {
    perm.fg = true;
    fetchMock.mockResolvedValueOnce(okResponse());
    await getTodayOutfit();
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    const result = await getTodayOutfit({ forceRefresh: true });
    expect(result.stale).toBe(true);
    expect(result.weather.apparentTemp).toBe(11.4);
  });

  it('네트워크 실패 + 캐시 없음이면 NoWeatherError', async () => {
    perm.fg = true;
    fetchMock.mockRejectedValue(new Error('offline'));
    await expect(getTodayOutfit()).rejects.toBeInstanceOf(NoWeatherError);
  });

  it('위젯(백그라운드)은 "항상 허용"이 없으면 저장된 위치를 쓴다', async () => {
    perm.fg = true;
    fetchMock.mockResolvedValue(okResponse());
    await getTodayOutfit(); // 앱에서 한 번 열어 위치 저장
    const Location = require('expo-location');
    Location.getLastKnownPositionAsync.mockClear();
    const result = await getTodayOutfit({ inBackground: true });
    expect(Location.getLastKnownPositionAsync).not.toHaveBeenCalled();
    expect(result.locationName).toBe('부산 해운대구');
  });

  it('제외 목록과 체감 보정을 반영한다', async () => {
    perm.fg = true;
    fetchMock.mockResolvedValue(okResponse());
    await setSettings({ apparentOffset: 1 }); // 11.4 + 1 = 12.4 → 구간 4
    await setExcludedIds(['top_sweatshirt_cotton_01']);
    const result = await getTodayOutfit();
    expect(result.outfit.band).toBe(4);
    expect(result.outfit.top?.id).toBe('top_longsleeve_cotton_01');
  });

  it('보정값은 −3 ~ +3으로 저장된다', async () => {
    await setSettings({ apparentOffset: 9 });
    expect(JSON.parse((await AsyncStorage.getItem('settings'))!)).toEqual({
      apparentOffset: 3,
    });
  });
});

describe('formatPlaceName', () => {
  it.each([
    [
      {
        city: null,
        region: '부산광역시',
        district: '해운대구',
        subregion: null,
      },
      '부산 해운대구',
    ],
    [
      { city: '성남시', region: '경기도', district: '분당구', subregion: null },
      '성남시 분당구',
    ],
    [
      { city: null, region: '서울특별시', district: null, subregion: '종로구' },
      '서울 종로구',
    ],
    [{ city: null, region: null, district: null, subregion: null }, null],
  ])('%p → %p', (address, expected) => {
    expect(formatPlaceName(address as any)).toBe(expected);
  });
});
