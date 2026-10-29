import AsyncStorage from '@react-native-async-storage/async-storage';

/** JSON 읽기. 없거나, 파싱에 실패하거나, 형식 검사에 걸리면 기본값. */
export async function readJson<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const isNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);
export const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
