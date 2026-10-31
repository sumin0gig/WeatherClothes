import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOutfit } from '../state/OutfitContext';
import { setOnboardingDone } from '../storage/prefs';
import { Button } from '../ui/Button';
import { PinIcon } from '../ui/icons';
import { Label, Text } from '../ui/Text';
import { useTheme } from '../ui/theme';
import { BORDER, RADIUS, SPACE } from '../ui/tokens';

/**
 * 위치 권한 사전 고지(prominent disclosure). Play 정책상 시스템 팝업 전에 앱 화면으로 먼저 설명한다.
 * 문구를 바꾸면 Play Console 백그라운드 위치 선언서·개인정보처리방침과 맞춰야 한다.
 */
export const DISCLOSURE_TEXT =
  '홈 화면 위젯이 지금 있는 곳의 날씨로 옷을 추천하려면, 앱을 사용하지 않을 때도 대략적인 위치가 필요해요. ' +
  '위치는 날씨 조회에만 쓰고 저장하거나 다른 곳에 보내지 않아요.';

type Step = 'intro' | 'background';

export function OnboardingScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { refresh } = useOutfit();
  const [step, setStep] = useState<Step>('intro');
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    await setOnboardingDone(true);
    refresh({ force: true });
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const askForeground = async () => {
    setBusy(true);
    try {
      const res = await Location.requestForegroundPermissionsAsync();
      if (res.granted) setStep('background');
      else await finish(); // 거부해도 앱은 동작한다
    } finally {
      setBusy(false);
    }
  };

  const askBackground = async () => {
    setBusy(true);
    try {
      // 안드로이드 11 이상은 시스템 설정 화면으로 이동해 사용자가 "항상 허용"을 직접 고른다
      await Location.requestBackgroundPermissionsAsync();
    } catch {
      // 거부·취소해도 앱 사용 중 위치로 동작한다
    } finally {
      setBusy(false);
      await finish();
    }
  };

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
      <Label size={11} color={palette.sub}>
        {step === 'intro' ? 'STEP 1 / 2 · LOCATION' : 'STEP 2 / 2 · ALWAYS'}
      </Label>

      <Text
        font="sans700"
        size={30}
        accessibilityRole="header"
        style={{ letterSpacing: -0.6, lineHeight: 38 }}
      >
        {step === 'intro'
          ? '지금 있는 곳의\n날씨로 옷을 골라요'
          : '위젯도 지금 위치로\n바뀌게 할까요?'}
      </Text>

      <View
        style={{
          backgroundColor: palette.card,
          borderWidth: BORDER.card,
          borderColor: palette.ink,
          borderRadius: RADIUS.card,
          padding: 14,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <PinIcon color={palette.ink} />
          <Label size={10} strong>
            대략적인 위치 · 항상
          </Label>
        </View>
        {step === 'intro' ? (
          <Text size={15} style={{ lineHeight: 23 }}>
            {DISCLOSURE_TEXT}
          </Text>
        ) : (
          <Text size={15} style={{ lineHeight: 23 }}>
            다음 화면에서{' '}
            <Text font="sans700" size={15}>
              "항상 허용"
            </Text>
            을 골라 주세요. 그래야 앱을 열지 않아도 위젯이 이동한 곳의 날씨로
            바뀌어요.
          </Text>
        )}
      </View>

      <View style={{ gap: 6 }}>
        {[
          '정밀 위치는 쓰지 않아요 (동네 단위)',
          '계정·광고·분석 없음',
          '거부해도 앱은 쓸 수 있어요. 나중에 설정에서 바꿀 수 있어요',
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

      <View style={{ flex: 1 }} />

      <View style={{ gap: 8 }}>
        {step === 'intro' ? (
          <>
            <Button
              label="계속"
              onPress={askForeground}
              primary
              disabled={busy}
            />
            <Button label="나중에" onPress={finish} disabled={busy} />
          </>
        ) : (
          <>
            <Button
              label="항상 허용 설정하기"
              onPress={askBackground}
              primary
              disabled={busy}
            />
            <Button label="지금은 건너뛰기" onPress={finish} disabled={busy} />
          </>
        )}
      </View>
    </ScrollView>
  );
}
