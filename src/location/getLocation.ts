import * as Location from 'expo-location';
import {
  getSavedLocation,
  setSavedLocation,
  type SavedLocation,
} from '../storage/prefs';

const LAST_KNOWN_MAX_AGE_MS = 30 * 60 * 1000;
const CURRENT_POSITION_TIMEOUT_MS = 10_000;

export type LocationResult = SavedLocation & {
  /** true면 이번에 새로 측정하지 못하고 저장된 위치를 쓴 것 */
  fromSaved: boolean;
};

export type GetLocationOptions = {
  /**
   * 위젯 핸들러(백그라운드)에서 부르면 true.
   * 백그라운드에서는 "항상 허용" 권한이 있어야 현재 위치를 새로 잰다.
   */
  inBackground?: boolean;
};

export type PermissionLevel = 'always' | 'whileInUse' | 'denied';

export async function getPermissionLevel(): Promise<PermissionLevel> {
  try {
    const bg = await Location.getBackgroundPermissionsAsync();
    if (bg.granted) return 'always';
    const fg = await Location.getForegroundPermissionsAsync();
    return fg.granted ? 'whileInUse' : 'denied';
  } catch {
    return 'denied';
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

/** '부산광역시' → '부산', '서울특별시' → '서울'. 도/시 단위는 그대로 둔다. */
function shortenRegion(name: string): string {
  return name.replace(/(광역시|특별시|특별자치시)$/, '');
}

/** 역지오코딩 결과 → '부산 해운대구' 형태 (시 + 구/동) */
export function formatPlaceName(
  address: Location.LocationGeocodedAddress,
): string | null {
  const top = address.city ?? address.region;
  const sub = address.district ?? address.subregion;
  const parts = [top && shortenRegion(top), sub].filter(
    (p): p is string => !!p,
  );
  const unique = parts.filter((p, i) => parts.indexOf(p) === i);
  return unique.length > 0 ? unique.join(' ') : null;
}

async function measure(): Promise<Location.LocationObject | null> {
  // 1순위: 최근(30분 이내) 위치 — 배터리를 거의 쓰지 않고 즉시 반환된다
  const last = await withTimeout(
    Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }),
    CURRENT_POSITION_TIMEOUT_MS,
  );
  if (last) return last;
  // 2순위: 저정밀로 새로 측정 (위젯 핸들러 실행 시간이 짧아서 타임아웃 필수)
  return withTimeout(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
    CURRENT_POSITION_TIMEOUT_MS,
  );
}

/**
 * 현재 위치. 앱과 위젯이 같이 쓴다.
 * 권한이 없거나 측정에 실패하면 저장된 위치, 그것도 없으면 null.
 */
export async function getLocation(
  options: GetLocationOptions = {},
): Promise<LocationResult | null> {
  const saved = await getSavedLocation();
  const level = await getPermissionLevel();
  const canMeasure = options.inBackground
    ? level === 'always'
    : level !== 'denied';

  const position = canMeasure ? await measure() : null;
  if (!position) return saved ? { ...saved, fromSaved: true } : null;

  const { latitude: lat, longitude: lon } = position.coords;

  let name = saved?.name ?? '';
  try {
    const [address] = await withTimeout(
      Location.reverseGeocodeAsync({ latitude: lat, longitude: lon }),
      CURRENT_POSITION_TIMEOUT_MS,
    ).then(r => r ?? []);
    const formatted = address ? formatPlaceName(address) : null;
    if (formatted) name = formatted;
  } catch {
    // 역지오코딩 실패 시 이전 지역명 유지
  }

  const next: SavedLocation = {
    lat,
    lon,
    name: name || '현재 위치',
    savedAt: Date.now(),
  };
  await setSavedLocation(next);
  return { ...next, fromSaved: false };
}
