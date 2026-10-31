import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { BackHandler, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { setUpdateSnooze } from '../storage/prefs';
import { Button } from '../ui/Button';
import { Label, Text } from '../ui/Text';
import { useTheme } from '../ui/theme';
import { BORDER, RADIUS, SPACE } from '../ui/tokens';
import {
  openStorePage,
  startImmediateUpdate,
  type UpdateInfo,
} from '../update/appUpdate';
import { isForcedUpdate, makeSnooze, UPDATE_POLICY } from '../update/policy';

type Status = 'idle' | 'busy' | 'failed';

/**
 * 업데이트 권유 화면. 설치된 버전이 Play 스토어 최신 버전보다 낮을 때 RootNavigator가 띄운다.
 * "지금 업데이트" → Play 전체 화면 업데이트(끝나면 앱이 다시 열림). 못 띄우면 Play 스토어 페이지로.
 */
export function UpdateScreen() {
  const { palette, accent } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Update'>>();
  const info = params.info;
  const preview = !!params.preview;
  const forced = isForcedUpdate(info);
  const [status, setStatus] = useState<Status>('idle');

  // 꼭 필요한 업데이트면 뒤로 가기로 닫지 못하게 한다
  useEffect(() => {
    if (!forced) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [forced]);

  const close = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const update = async () => {
    if (preview) {
      close();
      return;
    }
    setStatus('busy');
    const result = info.immediateAllowed
      ? await startImmediateUpdate()
      : 'unavailable';
    if (result === 'ok') return; // Play가 설치 후 앱을 다시 시작한다
    if (result === 'canceled') {
      setStatus('idle');
      return;
    }
    // Play 업데이트 화면을 못 띄우면 스토어 페이지로 보낸다
    try {
      await openStorePage();
      setStatus('idle');
    } catch {
      setStatus('failed');
    }
  };

  const later = async () => {
    if (!preview) await setUpdateSnooze(makeSnooze(info, Date.now()));
    close();
  };

  const title = info.inProgress
    ? '업데이트를\n마저 끝낼게요'
    : forced
    ? '업데이트가\n필요해요'
    : '새 버전이\n나왔어요';

  const current = info.currentVersionName ? `v${info.currentVersionName}` : '—';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + 40,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: SPACE.gutter,
        gap: 18,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: accent ?? palette.ink,
          }}
        />
        <Label size={11} color={palette.sub}>
          {preview ? 'UPDATE · 미리보기' : 'UPDATE · 새 버전'}
        </Label>
      </View>

      <Text
        font="sans700"
        size={30}
        accessibilityRole="header"
        style={{ letterSpacing: -0.6, lineHeight: 38 }}
      >
        {title}
      </Text>

      {/* 케어 라벨 카드: 지금 버전 → 새 버전 */}
      <View
        style={{
          backgroundColor: palette.card,
          borderWidth: BORDER.card,
          borderColor: palette.ink,
          borderRadius: RADIUS.card,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderBottomWidth: BORDER.hairline,
            borderBottomColor: palette.ink,
          }}
        >
          <Label size={10} strong>
            VERSION · 버전
          </Label>
        </View>

        <View
          style={{ flexDirection: 'row' }}
          accessible
          accessibilityLabel={`지금 버전 ${current}, 빌드 ${info.currentVersionCode}. 새 버전 빌드 ${info.availableVersionCode}.`}
        >
          <VersionCell
            label="지금 · NOW"
            value={current}
            build={info.currentVersionCode}
            muted
          />
          <View
            style={{ width: BORDER.hairline, backgroundColor: palette.rule }}
          />
          <VersionCell
            label="새 버전 · LATEST"
            value="최신"
            build={info.availableVersionCode}
          />
        </View>

        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderTopWidth: BORDER.hairline,
            borderTopColor: palette.rule,
          }}
        >
          <Text size={12} color={palette.sub}>
            {info.stalenessDays != null && info.stalenessDays > 0
              ? `Play 스토어에 올라온 지 ${info.stalenessDays}일 됐어요`
              : 'Play 스토어에 새 버전이 올라왔어요'}
          </Text>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        {[
          '옷장 제외 목록과 설정은 그대로 남아요',
          'Play 스토어에서 받아요. 다 되면 앱이 다시 열려요',
          '새 버전에는 고친 문제와 바뀐 추천 기준이 들어 있어요',
        ].map(line => (
          <View key={line} style={{ flexDirection: 'row', gap: 8 }}>
            <Text font="mono600" size={13} color={palette.sub}>
              —
            </Text>
            <Text
              size={13}
              color={palette.sub}
              style={{ flex: 1, lineHeight: 19 }}
            >
              {line}
            </Text>
          </View>
        ))}
      </View>

      {status === 'failed' ? (
        <Text
          size={13}
          accessibilityLiveRegion="polite"
          style={{ lineHeight: 19 }}
        >
          Play 스토어를 열지 못했어요. Play 스토어에서 "옷벤토리"를 찾아
          업데이트해 주세요.
        </Text>
      ) : null}

      <View style={{ flex: 1 }} />

      <View style={{ gap: 8 }}>
        <Button
          label={status === 'busy' ? 'Play 스토어 여는 중…' : '지금 업데이트'}
          onPress={update}
          primary
          disabled={status === 'busy'}
        />
        {forced ? null : (
          <Button
            label="나중에"
            onPress={later}
            disabled={status === 'busy'}
            accessibilityHint={`${UPDATE_POLICY.snoozeDays}일 동안 다시 묻지 않아요`}
          />
        )}
        {forced ? null : (
          <Text
            size={12}
            color={palette.sub}
            style={{ textAlign: 'center', marginTop: 2 }}
          >
            {`나중에를 누르면 ${UPDATE_POLICY.snoozeDays}일 뒤에 다시 알려 드려요`}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function VersionCell({
  label,
  value,
  build,
  muted,
}: {
  label: string;
  value: string;
  build: number;
  muted?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, padding: 12, gap: 4 }}>
      <Label size={10} color={palette.sub}>
        {label}
      </Label>
      <Text
        font={/^[\x20-\x7E]+$/.test(value) ? 'mono600' : 'sans700'}
        size={28}
        color={muted ? palette.sub : palette.ink}
        style={{
          letterSpacing: -0.5,
          textDecorationLine: muted ? 'line-through' : 'none',
        }}
      >
        {value}
      </Text>
      <Label size={10} color={palette.sub}>
        {`BUILD ${build || '—'}`}
      </Label>
    </View>
  );
}

/** 설정 화면의 미리보기 버튼용 가짜 정보 (개발 빌드에서만 노출) */
export const PREVIEW_UPDATE_INFO: UpdateInfo = {
  supported: true,
  available: true,
  inProgress: false,
  currentVersionName: '1.0',
  currentVersionCode: 1,
  availableVersionCode: 2,
  stalenessDays: 2,
  priority: 0,
  immediateAllowed: true,
};
