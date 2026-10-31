import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { CATEGORY_CODE } from '../outfit/catalog';
import type { ClothItem } from '../outfit/types';
import { ClothImage } from './ClothImage';
import { Label, Text } from './Text';
import { useTheme } from './theme';
import { BORDER, RADIUS } from './tokens';

type Props = {
  item: ClothItem;
  /** 이름 아래 보조 줄 (예: '울', '면 · 12–22°') */
  detail: string;
  /** 라벨 줄 오른쪽 점 색 (재질 점수로 뽑힌 옷). 없으면 점 없음 */
  dotColor?: string | null;
  /** 제외 상태 표시 (옷장) */
  excluded?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

/** 케어 라벨 스타일 카드: 상단 Mono 카테고리 라벨 / 이미지 / 이름 / 보조 줄 */
export function LabelCard({
  item,
  detail,
  dotColor,
  excluded,
  onPress,
  accessibilityLabel,
  style,
}: Props) {
  const { palette } = useTheme();

  const body = (
    <>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 7,
          paddingVertical: 5,
          borderBottomWidth: BORDER.hairline,
          borderBottomColor: palette.ink,
        }}
      >
        <Label size={9} strong>
          {CATEGORY_CODE[item.category]}
        </Label>
        {dotColor ? (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: dotColor,
              borderWidth: 1,
              borderColor: palette.ink,
            }}
          />
        ) : null}
      </View>
      <ClothImage item={item} height={78} />
      <View
        style={{
          paddingHorizontal: 7,
          paddingTop: 6,
          paddingBottom: 8,
          gap: 2,
        }}
      >
        <Text
          font="sans600"
          size={13}
          numberOfLines={1}
          style={excluded ? { textDecorationLine: 'line-through' } : undefined}
        >
          {item.name}
        </Text>
        <Label size={10} tracking={0} color={palette.sub} numberOfLines={1}>
          {detail}
        </Label>
      </View>
      {excluded ? (
        <View
          style={{
            position: 'absolute',
            top: 30,
            right: 6,
            backgroundColor: palette.ink,
            paddingHorizontal: 6,
            paddingVertical: 3,
            borderRadius: 3,
          }}
        >
          <Label size={9} strong color={palette.bg}>
            제외
          </Label>
        </View>
      ) : null}
    </>
  );

  const frame: ViewStyle = {
    backgroundColor: palette.card,
    borderWidth: BORDER.card,
    borderColor: palette.ink,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    opacity: excluded ? 0.5 : 1,
  };

  if (!onPress) {
    return (
      <View
        style={[frame, style]}
        accessible
        accessibilityLabel={accessibilityLabel ?? `${item.name}, ${detail}`}
      >
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!excluded }}
      accessibilityLabel={accessibilityLabel}
      android_ripple={{ color: palette.rule }}
      style={[frame, style]}
    >
      {body}
    </Pressable>
  );
}
