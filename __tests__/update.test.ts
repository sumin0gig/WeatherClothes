import { NativeModules, Platform } from 'react-native';
import { getUpdateSnooze, setUpdateSnooze } from '../src/storage/prefs';
import {
  checkForUpdate,
  UNSUPPORTED,
  type UpdateInfo,
} from '../src/update/appUpdate';
import {
  isForcedUpdate,
  makeSnooze,
  shouldPromptUpdate,
  UPDATE_POLICY,
} from '../src/update/policy';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 31);

const info = (o: Partial<UpdateInfo> = {}): UpdateInfo => ({
  ...UNSUPPORTED,
  supported: true,
  available: true,
  currentVersionName: '1.0',
  currentVersionCode: 1,
  availableVersionCode: 2,
  immediateAllowed: true,
  ...o,
});

describe('업데이트 권유 정책', () => {
  it('새 버전이 있으면 띄운다', () => {
    expect(shouldPromptUpdate(info(), null, NOW)).toBe(true);
  });

  it('최신 버전이면 띄우지 않는다', () => {
    expect(shouldPromptUpdate(info({ available: false }), null, NOW)).toBe(
      false,
    );
  });

  it('Play에서 확인할 수 없는 빌드(디버그·직접 설치)는 띄우지 않는다', () => {
    expect(shouldPromptUpdate(UNSUPPORTED, null, NOW)).toBe(false);
  });

  it('"나중에" 후 정해진 기간 동안은 같은 버전으로 다시 묻지 않는다', () => {
    const snooze = makeSnooze(info(), NOW);
    expect(snooze.until).toBe(NOW + UPDATE_POLICY.snoozeDays * DAY);
    expect(shouldPromptUpdate(info(), snooze, NOW + DAY)).toBe(false);
    expect(shouldPromptUpdate(info(), snooze, snooze.until)).toBe(true);
  });

  it('미룬 뒤 더 새 버전이 올라오면 기간 안이어도 다시 묻는다', () => {
    const snooze = makeSnooze(info(), NOW);
    expect(
      shouldPromptUpdate(info({ availableVersionCode: 3 }), snooze, NOW + DAY),
    ).toBe(true);
  });

  it('업데이트 도중 끊겼으면 미뤘어도 이어서 띄운다', () => {
    const snooze = makeSnooze(info(), NOW);
    expect(
      shouldPromptUpdate(
        info({ available: false, inProgress: true }),
        snooze,
        NOW + DAY,
      ),
    ).toBe(true);
  });

  it('우선순위가 높은 업데이트는 "나중에"를 무시하고 강제한다', () => {
    const urgent = info({ priority: UPDATE_POLICY.forcePriority });
    expect(isForcedUpdate(urgent)).toBe(true);
    expect(isForcedUpdate(info({ priority: 3 }))).toBe(false);
    expect(shouldPromptUpdate(urgent, makeSnooze(urgent, NOW), NOW)).toBe(true);
  });
});

describe('업데이트 "나중에" 저장', () => {
  it('저장한 값을 다시 읽는다', async () => {
    expect(await getUpdateSnooze()).toBeNull();
    await setUpdateSnooze({ versionCode: 2, until: NOW });
    expect(await getUpdateSnooze()).toEqual({ versionCode: 2, until: NOW });
  });
});

describe('네이티브 모듈 래퍼', () => {
  const original = NativeModules.AppUpdate;
  afterEach(() => {
    NativeModules.AppUpdate = original;
  });

  it('모듈이 없으면(테스트·iOS) 지원 안 함으로 돌려준다', async () => {
    expect(await checkForUpdate()).toEqual(UNSUPPORTED);
  });

  it('네이티브 값을 기본값 위에 합친다 (안드로이드)', async () => {
    const prevOS = Platform.OS;
    (Platform as any).OS = 'android';
    NativeModules.AppUpdate = {
      checkForUpdate: jest
        .fn()
        .mockResolvedValue({ supported: true, available: true, priority: 1 }),
    };
    const res = await checkForUpdate();
    (Platform as any).OS = prevOS;
    expect(res).toEqual({
      ...UNSUPPORTED,
      supported: true,
      available: true,
      priority: 1,
    });
  });

  it('네이티브가 throw해도 앱을 멈추지 않는다', async () => {
    const prevOS = Platform.OS;
    (Platform as any).OS = 'android';
    NativeModules.AppUpdate = {
      checkForUpdate: jest.fn().mockRejectedValue(new Error('boom')),
    };
    const res = await checkForUpdate();
    (Platform as any).OS = prevOS;
    expect(res).toEqual(UNSUPPORTED);
  });
});
