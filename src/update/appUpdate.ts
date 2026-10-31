import { Linking, NativeModules, Platform } from 'react-native';

/**
 * 최신 버전 확인 — 네이티브 모듈 AppUpdate
 * (android/.../update/AppUpdateModule.kt, Google Play 인앱 업데이트 API) 래퍼.
 * 자체 서버 없이 Play 스토어가 새 버전 여부를 알려 준다.
 */

export const STORE_PACKAGE = 'com.developer_cm.weatherclothes';

export type UpdateInfo = {
  /** Play에서 확인할 수 있었는지. 디버그 빌드·직접 설치한 APK·iOS는 false */
  supported: boolean;
  /** 새 버전이 있음 */
  available: boolean;
  /** 업데이트 도중 앱이 꺼졌다가 다시 열림 → 이어서 진행 */
  inProgress: boolean;
  currentVersionName: string;
  currentVersionCode: number;
  availableVersionCode: number;
  /** 새 버전이 기기에 보인 지 며칠 지났는지 (모르면 null) */
  stalenessDays: number | null;
  /** Play Developer API로 정한 업데이트 우선순위 0~5 */
  priority: number;
  /** Play 전체 화면 업데이트를 띄울 수 있는지 */
  immediateAllowed: boolean;
};

export type StartResult = 'ok' | 'canceled' | 'failed' | 'unavailable';

type Native = {
  checkForUpdate(): Promise<Partial<UpdateInfo>>;
  getCurrentVersion(): Promise<{
    currentVersionName: string;
    currentVersionCode: number;
  }>;
  startImmediateUpdate(): Promise<StartResult>;
};

const getNative = (): Native | undefined =>
  Platform.OS === 'android' ? NativeModules.AppUpdate : undefined;

export const UNSUPPORTED: UpdateInfo = {
  supported: false,
  available: false,
  inProgress: false,
  currentVersionName: '',
  currentVersionCode: 0,
  availableVersionCode: 0,
  stalenessDays: null,
  priority: 0,
  immediateAllowed: false,
};

/** 실패해도 throw하지 않는다 — 업데이트 확인 때문에 앱이 멈추면 안 된다. */
export async function checkForUpdate(): Promise<UpdateInfo> {
  const native = getNative();
  if (!native) return UNSUPPORTED;
  try {
    return { ...UNSUPPORTED, ...(await native.checkForUpdate()) };
  } catch {
    return UNSUPPORTED;
  }
}

export async function getCurrentVersion(): Promise<{
  name: string;
  code: number;
}> {
  const native = getNative();
  if (!native) return { name: '', code: 0 };
  try {
    const v = await native.getCurrentVersion();
    return { name: v.currentVersionName, code: v.currentVersionCode };
  } catch {
    return { name: '', code: 0 };
  }
}

export async function startImmediateUpdate(): Promise<StartResult> {
  const native = getNative();
  if (!native) return 'unavailable';
  try {
    return await native.startImmediateUpdate();
  } catch {
    return 'failed';
  }
}

/** 인앱 업데이트를 못 띄울 때: Play 스토어 앱의 상세 페이지 → 안 되면 웹 페이지 */
export async function openStorePage(): Promise<void> {
  try {
    await Linking.openURL(`market://details?id=${STORE_PACKAGE}`);
  } catch {
    await Linking.openURL(
      `https://play.google.com/store/apps/details?id=${STORE_PACKAGE}`,
    );
  }
}
