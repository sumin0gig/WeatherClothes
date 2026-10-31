import type { UpdateInfo } from './appUpdate';

/**
 * 업데이트 권유 화면을 언제 띄울지 — 순수 함수 (테스트: __tests__/update.test.ts).
 */
export const UPDATE_POLICY = {
  /** "나중에"를 누르면 이 기간 동안 같은 버전으로는 다시 묻지 않는다 */
  snoozeDays: 3,
  /** Play 업데이트 우선순위가 이 값 이상이면 "나중에" 없이 업데이트해야 한다 */
  forcePriority: 4,
} as const;

export type UpdateSnooze = {
  /** 미룬 새 버전의 versionCode */
  versionCode: number;
  /** 이 시각(epoch ms)까지 다시 묻지 않음 */
  until: number;
};

const DAY = 24 * 60 * 60 * 1000;

export const isForcedUpdate = (info: UpdateInfo) =>
  info.priority >= UPDATE_POLICY.forcePriority;

export function shouldPromptUpdate(
  info: UpdateInfo,
  snooze: UpdateSnooze | null,
  now: number,
): boolean {
  if (!info.supported) return false;
  // 업데이트 도중 끊겼으면 미뤘더라도 이어서 진행
  if (info.inProgress) return true;
  if (!info.available) return false;
  if (isForcedUpdate(info)) return true;
  // 미룬 뒤에 더 새 버전이 올라왔으면 다시 묻는다
  if (
    snooze &&
    snooze.versionCode >= info.availableVersionCode &&
    now < snooze.until
  )
    return false;
  return true;
}

export const makeSnooze = (info: UpdateInfo, now: number): UpdateSnooze => ({
  versionCode: info.availableVersionCode,
  until: now + UPDATE_POLICY.snoozeDays * DAY,
});
