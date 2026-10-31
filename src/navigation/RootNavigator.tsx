import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClosetScreen } from '../screens/ClosetScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { UpdateScreen } from '../screens/UpdateScreen';
import { Text } from '../ui/Text';
import { useTheme } from '../ui/theme';
import { BORDER } from '../ui/tokens';
import { checkForUpdate, type UpdateInfo } from '../update/appUpdate';
import { shouldPromptUpdate } from '../update/policy';
import { getUpdateSnooze } from '../storage/prefs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Main: undefined;
  Onboarding: undefined;
  /** 업데이트 권유. preview는 설정 화면의 개발용 미리보기 */
  Update: { info: UpdateInfo; preview?: boolean };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

const TAB_LABEL: Record<string, string> = {
  Today: '오늘',
  Closet: '옷장',
  Settings: '설정',
};

/** 하단 탭: 오늘 / 옷장 / 설정. 현재 탭은 위쪽 3px 먹색 선 + 굵게. */
function TabBar({ state, navigation }: BottomTabBarProps) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        borderTopWidth: BORDER.card,
        borderTopColor: palette.ink,
        backgroundColor: palette.bg,
        paddingBottom: Math.max(insets.bottom, 10),
      }}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented)
                navigation.navigate(route.name);
            }}
            style={{
              flex: 1,
              minHeight: 56,
              alignItems: 'center',
              justifyContent: 'center',
              borderTopWidth: 3,
              borderTopColor: focused ? palette.ink : 'transparent',
              marginTop: -BORDER.card,
            }}
          >
            <Text
              font={focused ? 'sans700' : 'sans500'}
              size={13}
              color={focused ? palette.ink : palette.sub}
            >
              {TAB_LABEL[route.name] ?? route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const renderTabBar = (props: BottomTabBarProps) => <TabBar {...props} />;

/**
 * 앱을 열 때 한 번 Play 스토어 최신 버전을 확인하고, 더 새 버전이 있으면 업데이트 권유 화면을 띄운다.
 * Play에서 설치하지 않은 빌드(디버그 등)에서는 확인이 안 되므로 아무것도 하지 않는다.
 */
function useUpdatePrompt(
  navigation: NativeStackScreenProps<RootStackParamList, 'Main'>['navigation'],
) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [info, snooze] = await Promise.all([
        checkForUpdate(),
        getUpdateSnooze(),
      ]);
      if (cancelled || !shouldPromptUpdate(info, snooze, Date.now())) return;
      navigation.navigate('Update', { info });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigation]);
}

function MainTabs({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Main'>) {
  useUpdatePrompt(navigation);
  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={renderTabBar}
    >
      <Tabs.Screen name="Today" component={TodayScreen} />
      <Tabs.Screen name="Closet" component={ClosetScreen} />
      <Tabs.Screen name="Settings" component={SettingsScreen} />
    </Tabs.Navigator>
  );
}

export function RootNavigator({ showOnboarding }: { showOnboarding: boolean }) {
  const { dark, palette } = useTheme();
  const base = dark ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: {
      ...base.colors,
      background: palette.bg,
      card: palette.bg,
      text: palette.ink,
      border: palette.ink,
    },
  };
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        initialRouteName={showOnboarding ? 'Onboarding' : 'Main'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.bg },
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Update"
          component={UpdateScreen}
          options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
