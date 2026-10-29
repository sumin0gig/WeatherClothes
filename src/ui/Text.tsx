import React from 'react';
import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { FONT, type FontKey } from './tokens';
import { useTheme } from './theme';

type Props = TextProps & {
  font?: FontKey;
  size?: number;
  color?: string;
  /** 대문자 라벨용 자간 (em 단위, 예: 0.1) */
  tracking?: number;
};

/** 앱 공통 텍스트. 기본은 Plex Sans KR 400, 먹색. */
export function Text({
  font = 'sans400',
  size = 14,
  color,
  tracking,
  style,
  ...rest
}: Props) {
  const { palette } = useTheme();
  const base: TextStyle = {
    fontFamily: FONT[font],
    fontSize: size,
    color: color ?? palette.ink,
    includeFontPadding: false,
    ...(tracking ? { letterSpacing: tracking * size } : null),
  };
  return <RNText {...rest} style={[base, style]} />;
}

/** 대문자 Mono 라벨 (예: OUTER, FEELS LIKE) */
export function Label(props: Omit<Props, 'font'> & { strong?: boolean }) {
  const { strong, size = 10, tracking = 0.1, ...rest } = props;
  return (
    <Text
      font={strong ? 'mono600' : 'mono500'}
      size={size}
      tracking={tracking}
      {...rest}
    />
  );
}
