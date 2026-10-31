import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatBandRange } from '../outfit/bands';
import { CATALOG, CATEGORY_LABEL } from '../outfit/catalog';
import { MATERIAL_LABEL } from '../outfit/materialScore';
import type { Category } from '../outfit/types';
import { useOutfit } from '../state/OutfitContext';
import { LabelCard } from '../ui/LabelCard';
import { Label, Text } from '../ui/Text';
import { useTheme } from '../ui/theme';
import { BORDER, RADIUS, SPACE } from '../ui/tokens';

type Filter = 'all' | Category;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '전체' },
  ...(
    [
      'outer',
      'top',
      'bottom',
      'onepiece',
      'inner',
      'legwear',
      'acc',
    ] as Category[]
  ).map(key => ({
    key,
    label: CATEGORY_LABEL[key],
  })),
];

export function ClosetScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { excludedIds, toggleExcluded } = useOutfit();
  const [filter, setFilter] = useState<Filter>('all');

  const items = useMemo(
    () =>
      filter === 'all'
        ? CATALOG
        : CATALOG.filter(item => item.category === filter),
    [filter],
  );
  const excludedCount = CATALOG.filter(item =>
    excludedIds.includes(item.id),
  ).length;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.bg,
        paddingTop: insets.top + 12,
      }}
    >
      <View style={{ paddingHorizontal: SPACE.gutter, gap: 4 }}>
        <Text
          font="sans700"
          size={28}
          accessibilityRole="header"
          style={{ letterSpacing: -0.5 }}
        >
          옷장
        </Text>
        <Label size={12} tracking={0} color={palette.sub}>
          {`${CATALOG.length}벌 · ${excludedCount}벌 제외 중`}
        </Label>
      </View>

      <View style={{ marginTop: 14 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityRole="tablist"
          contentContainerStyle={{ paddingHorizontal: SPACE.gutter, gap: 6 }}
        >
          {FILTERS.map(f => {
            const on = f.key === filter;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={{
                  minHeight: 36,
                  paddingHorizontal: 12,
                  borderRadius: RADIUS.pill,
                  borderWidth: BORDER.card,
                  borderColor: palette.ink,
                  backgroundColor: on ? palette.ink : 'transparent',
                  justifyContent: 'center',
                }}
                hitSlop={{ top: 4, bottom: 4 }}
              >
                <Text
                  font="sans600"
                  size={13}
                  color={on ? palette.bg : palette.ink}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <Text
        size={12}
        color={palette.sub}
        style={{ marginTop: 12, marginHorizontal: SPACE.gutter }}
      >
        탭하면 추천에서 빠져요. 다시 탭하면 돌아와요.
      </Text>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        numColumns={3}
        style={{ marginTop: 10 }}
        contentContainerStyle={{
          paddingHorizontal: SPACE.gutter,
          paddingBottom: 24,
          gap: SPACE.gap,
        }}
        columnWrapperStyle={{ gap: SPACE.gap }}
        renderItem={({ item }) => {
          const excluded = excludedIds.includes(item.id);
          return (
            <View style={{ flex: 1 / 3 }}>
              <LabelCard
                item={item}
                excluded={excluded}
                detail={`${MATERIAL_LABEL[item.material]} · ${formatBandRange(
                  item.bands,
                )}`}
                onPress={() => toggleExcluded(item.id)}
                accessibilityLabel={`${item.name} — ${
                  excluded ? '제외됨. 탭하면 다시 추천' : '탭하면 추천에서 제외'
                }`}
              />
            </View>
          );
        }}
      />
    </View>
  );
}
