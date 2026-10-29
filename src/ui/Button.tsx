import React from 'react';
import { Pressable } from 'react-native';
import { Text } from './Text';
import { useTheme } from './theme';
import { BORDER, MIN_TOUCH, RADIUS } from './tokens';

type Props = {
  label: string;
  onPress: () => void;
  /** 먹색으로 채운 주 버튼 */
  primary?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  primary,
  disabled,
  accessibilityHint,
}: Props) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityHint={accessibilityHint}
      style={{
        minHeight: MIN_TOUCH,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: RADIUS.card,
        borderWidth: BORDER.card,
        borderColor: palette.ink,
        backgroundColor: primary ? palette.ink : 'transparent',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text font="sans600" size={14} color={primary ? palette.bg : palette.ink}>
        {label}
      </Text>
    </Pressable>
  );
}
