import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getPermissionLevel,
  type PermissionLevel,
} from '../location/getLocation';
import { useOutfit } from '../state/OutfitContext';
import { APPARENT_OFFSET_RANGE } from '../storage/prefs';
import { Button } from '../ui/Button';
import { ExternalIcon } from '../ui/icons';
import { Label, Text } from '../ui/Text';
import { useTheme } from '../ui/theme';
import { BORDER, MIN_TOUCH, RADIUS, SPACE } from '../ui/tokens';
import { checkForUpdate, getCurrentVersion } from '../update/appUpdate';
import { PREVIEW_UPDATE_INFO } from './UpdateScreen';

/** TODO: 개인정보처리방침을 GitHub Pages 등에 게시한 뒤 주소를 넣는다 (docs/play-release.md 참고) */
export const PRIVACY_POLICY_URL = '';
const OPEN_METEO_URL = 'https://open-meteo.com/';

const PERMISSION_TEXT: Record<
  PermissionLevel,
  { title: string; body: string }
> = {
  always: {
    title: '항상 허용',
    body: '위젯이 지금 있는 곳의 날씨로 갱신돼요.',
  },
  whileInUse: {
    title: '앱 사용 중에만 허용',
    body: '위젯은 앱을 마지막으로 연 위치의 날씨를 보여줘요. 위치 설정에서 "항상 허용"을 고르면 이동해도 바로 반영돼요.',
  },
  denied: {
    title: '거부됨',
    body: '현재 위치를 알 수 없어요. 위치 권한을 허용해 주세요.',
  },
};

export function SettingsScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { settings, setApparentOffset } = useOutfit();
  const [permission, setPermission] = useState<PermissionLevel | null>(null);

  // 설정 앱에서 권한을 바꾸고 돌아오면 다시 읽는다
  useFocusEffect(
    useCallback(() => {
      getPermissionLevel().then(setPermission);
    }, []),
  );

  const offset = settings.apparentOffset;
  const step = (delta: number) => {
    const next = Math.max(
      APPARENT_OFFSET_RANGE.min,
      Math.min(APPARENT_OFFSET_RANGE.max, offset + delta),
    );
    if (next !== offset) setApparentOffset(next);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: 32,
        paddingHorizontal: SPACE.gutter,
        gap: 18,
      }}
    >
      <Text
        font="sans700"
        size={28}
        accessibilityRole="header"
        style={{ letterSpacing: -0.5 }}
      >
        설정
      </Text>

      <Section label="LOCATION · 위치 권한">
        <Text font="sans700" size={17}>
          {permission ? PERMISSION_TEXT[permission].title : '확인 중'}
        </Text>
        {permission ? (
          <Text size={13} color={palette.sub} style={{ lineHeight: 19 }}>
            {PERMISSION_TEXT[permission].body}
          </Text>
        ) : null}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 4,
          }}
        >
          <Button
            label="설정 열기"
            onPress={() => Linking.openSettings()}
            primary={permission !== 'always'}
          />
          {permission !== 'always' ? (
            <Button
              label="권한 안내 다시 보기"
              onPress={() => navigation.navigate('Onboarding')}
            />
          ) : null}
        </View>
      </Section>

      <Section label="FEELS LIKE · 체감 보정">
        <Text size={13} color={palette.sub} style={{ lineHeight: 19 }}>
          추천이 덥게 느껴지면 +, 춥게 느껴지면 −로 맞춰요. 체감온도에 이 값을
          더해 옷을 골라요.
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginTop: 4,
          }}
        >
          <StepButton
            label="−"
            a11y="보정값 1도 낮추기"
            onPress={() => step(-1)}
            disabled={offset <= APPARENT_OFFSET_RANGE.min}
          />
          <Text
            font="mono600"
            size={28}
            style={{ minWidth: 72, textAlign: 'center' }}
            accessibilityLabel={`보정값 ${offset}도`}
            accessibilityLiveRegion="polite"
          >
            {`${offset > 0 ? '+' : ''}${offset}°`}
          </Text>
          <StepButton
            label="+"
            a11y="보정값 1도 높이기"
            onPress={() => step(1)}
            disabled={offset >= APPARENT_OFFSET_RANGE.max}
          />
        </View>
      </Section>

      <Section label="DATA · 출처">
        <LinkRow
          label="Weather data by Open-Meteo.com"
          onPress={() => Linking.openURL(OPEN_METEO_URL)}
        />
        <Text size={12} color={palette.sub} style={{ lineHeight: 17 }}>
          날씨 데이터는 Open-Meteo(CC BY 4.0)를 사용해요.
        </Text>
      </Section>

      <AppVersionSection
        onUpdateAvailable={info => navigation.navigate('Update', { info })}
        onPreview={() =>
          navigation.navigate('Update', {
            info: PREVIEW_UPDATE_INFO,
            preview: true,
          })
        }
      />

      <Section label="PRIVACY · 개인정보">
        {PRIVACY_POLICY_URL ? (
          <LinkRow
            label="개인정보처리방침"
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          />
        ) : (
          <Text size={13} color={palette.sub}>
            개인정보처리방침 준비 중
          </Text>
        )}
        <Text size={12} color={palette.sub} style={{ lineHeight: 17 }}>
          대략적인 위치는 날씨 조회에만 쓰고, 계정·분석·광고 없이 기기 안에만
          저장해요.
        </Text>
      </Section>
    </ScrollView>
  );
}

type CheckState = 'idle' | 'checking' | 'latest' | 'unsupported';

const CHECK_TEXT: Record<Exclude<CheckState, 'idle'>, string> = {
  checking: '확인 중…',
  latest: '최신 버전이에요.',
  unsupported:
    'Play 스토어에서 설치한 앱에서만 확인할 수 있어요. 인터넷 연결도 확인해 주세요.',
};

/** 설정 > 앱 정보: 지금 버전 + 업데이트 확인 (새 버전이 있으면 업데이트 권유 화면) */
function AppVersionSection({
  onUpdateAvailable,
  onPreview,
}: {
  onUpdateAvailable: (info: Awaited<ReturnType<typeof checkForUpdate>>) => void;
  onPreview: () => void;
}) {
  const { palette } = useTheme();
  const [version, setVersion] = useState<{ name: string; code: number }>();
  const [check, setCheck] = useState<CheckState>('idle');

  useEffect(() => {
    getCurrentVersion().then(setVersion);
  }, []);

  const runCheck = async () => {
    setCheck('checking');
    const info = await checkForUpdate();
    if (!info.supported) setCheck('unsupported');
    else if (info.available || info.inProgress) {
      setCheck('idle');
      onUpdateAvailable(info);
    } else setCheck('latest');
  };

  return (
    <Section label="APP · 앱 정보">
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <Text font="sans700" size={17}>
          옷벤토리
        </Text>
        <Text font="mono500" size={13} color={palette.sub}>
          {version?.name ? `v${version.name} · BUILD ${version.code}` : ''}
        </Text>
      </View>
      {check !== 'idle' ? (
        <Text
          size={13}
          color={palette.sub}
          accessibilityLiveRegion="polite"
          style={{ lineHeight: 19 }}
        >
          {CHECK_TEXT[check]}
        </Text>
      ) : null}
      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}
      >
        <Button
          label="업데이트 확인"
          onPress={runCheck}
          disabled={check === 'checking'}
        />
        {__DEV__ ? (
          <Button label="업데이트 화면 미리보기" onPress={onPreview} />
        ) : null}
      </View>
    </Section>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { palette } = useTheme();
  return (
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
          {label}
        </Label>
      </View>
      <View style={{ padding: 12, gap: 6 }}>{children}</View>
    </View>
  );
}

function StepButton({
  label,
  a11y,
  onPress,
  disabled,
}: {
  label: string;
  a11y: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled: !!disabled }}
      style={{
        width: MIN_TOUCH + 4,
        height: MIN_TOUCH + 4,
        borderRadius: RADIUS.card,
        borderWidth: BORDER.card,
        borderColor: palette.ink,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Text font="mono600" size={22}>
        {label}
      </Text>
    </Pressable>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      style={{
        minHeight: MIN_TOUCH,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Text
        font="sans600"
        size={14}
        style={{ textDecorationLine: 'underline' }}
      >
        {label}
      </Text>
      <ExternalIcon color={palette.ink} />
    </Pressable>
  );
}
