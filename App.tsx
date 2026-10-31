import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { OutfitProvider } from './src/state/OutfitContext';
import { getOnboardingDone } from './src/storage/prefs';
import { useTheme } from './src/ui/theme';

function Shell({ showOnboarding }: { showOnboarding: boolean }) {
  const { dark } = useTheme();
  return (
    <>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <RootNavigator showOnboarding={showOnboarding} />
    </>
  );
}

export default function App() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    getOnboardingDone().then(setOnboardingDone);
  }, []);

  if (onboardingDone === null) return null;

  return (
    <SafeAreaProvider>
      <OutfitProvider>
        <Shell showOnboarding={!onboardingDone} />
      </OutfitProvider>
    </SafeAreaProvider>
  );
}
