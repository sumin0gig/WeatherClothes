import type { UpdateSnooze } from '../update/policy';
import { STORAGE_KEYS } from './keys';
import { isNumber, isObject, readJson, writeJson } from './json';

// ── 제외 목록 ──────────────────────────────────────────

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every(s => typeof s === 'string');

export const getExcludedIds = () =>
  readJson<string[]>(STORAGE_KEYS.excludedIds, [], isStringArray);

export const setExcludedIds = (ids: string[]) =>
  writeJson(STORAGE_KEYS.excludedIds, Array.from(new Set(ids)).sort());

// ── 위치 ──────────────────────────────────────────────

export type SavedLocation = {
  lat: number;
  lon: number;
  /** '부산 해운대구' 형태 */
  name: string;
  savedAt: number;
};

const isSavedLocation = (v: unknown): v is SavedLocation =>
  isObject(v) &&
  isNumber(v.lat) &&
  isNumber(v.lon) &&
  typeof v.name === 'string' &&
  isNumber(v.savedAt);

export const getSavedLocation = () =>
  readJson<SavedLocation | null>(
    STORAGE_KEYS.location,
    null,
    (v): v is SavedLocation | null => v === null || isSavedLocation(v),
  );

export const setSavedLocation = (loc: SavedLocation) =>
  writeJson(STORAGE_KEYS.location, loc);

// ── 설정 ──────────────────────────────────────────────

export type Settings = {
  /** 체감 보정값 (°C). −3 ~ +3 */
  apparentOffset: number;
};

export const DEFAULT_SETTINGS: Settings = { apparentOffset: 0 };
export const APPARENT_OFFSET_RANGE = { min: -3, max: 3 } as const;

const isSettings = (v: unknown): v is Settings =>
  isObject(v) && isNumber(v.apparentOffset);

export const getSettings = () =>
  readJson<Settings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS, isSettings);

export const setSettings = (settings: Settings) =>
  writeJson(STORAGE_KEYS.settings, {
    ...settings,
    apparentOffset: Math.max(
      APPARENT_OFFSET_RANGE.min,
      Math.min(APPARENT_OFFSET_RANGE.max, Math.round(settings.apparentOffset)),
    ),
  });

// ── 온보딩 ────────────────────────────────────────────

export const getOnboardingDone = () =>
  readJson<boolean>(
    STORAGE_KEYS.onboardingDone,
    false,
    (v): v is boolean => typeof v === 'boolean',
  );

export const setOnboardingDone = (done: boolean) =>
  writeJson(STORAGE_KEYS.onboardingDone, done);

// ── 업데이트 "나중에" ─────────────────────────────────

const isUpdateSnooze = (v: unknown): v is UpdateSnooze =>
  isObject(v) && isNumber(v.versionCode) && isNumber(v.until);

export const getUpdateSnooze = () =>
  readJson<UpdateSnooze | null>(
    STORAGE_KEYS.updateSnooze,
    null,
    (v): v is UpdateSnooze | null => v === null || isUpdateSnooze(v),
  );

export const setUpdateSnooze = (snooze: UpdateSnooze | null) =>
  writeJson(STORAGE_KEYS.updateSnooze, snooze);
