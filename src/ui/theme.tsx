import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { DARK, LIGHT, type Palette } from './tokens';

type Theme = {
  dark: boolean;
  palette: Palette;
  /** 오늘 날씨 구간의 포인트 컬러. 아직 날씨가 없으면 null */
  accent: string | null;
};

const ThemeContext = createContext<Theme>({
  dark: false,
  palette: LIGHT,
  accent: null,
});

/** 시스템 다크 모드를 따른다. accent는 OutfitProvider가 날씨 구간으로 정해 내려준다. */
export function ThemeProvider({
  accent,
  children,
}: {
  accent: string | null;
  children: React.ReactNode;
}) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const value = useMemo<Theme>(
    () => ({ dark, palette: dark ? DARK : LIGHT, accent }),
    [dark, accent],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
