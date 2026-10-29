import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bandInfo } from '../outfit/bands';
import { MATERIAL_LABEL } from '../outfit/materialScore';
import { outfitItems } from '../outfit/recommend';
import { useOutfit } from '../state/OutfitContext';
import { ACCENT_TEXT } from '../ui/accent';
import { Button } from '../ui/Button';
import { PinIcon, ThermoIcon, UmbrellaIcon } from '../ui/icons';
import { LabelCard } from '../ui/LabelCard';
import { Label, Text } from '../ui/Text';
import { useTheme } from '../ui/theme';
import { BORDER, MIN_TOUCH, RADIUS, SPACE } from '../ui/tokens';
import { describeDay, hourSlots } from '../weather/summary';

const formatTime = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
};

export function TodayScreen() {
  const { palette, accent } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, error, loading, refresh, settings } = useOutfit();

  if (!data) {
    return (
      <View
        style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top }}
      >
        {error ? (
          <ErrorState kind={error} onRetry={() => refresh({ force: true })} />
        ) : (
          <Loading />
        )}
      </View>
    );
  }

  const { weather, outfit, locationName, updatedAt, stale } = data;
  const band = bandInfo(outfit.band);
  const items = outfitItems(outfit);
  const wet = outfit.tags.includes('rain') || outfit.tags.includes('snow');
  const offset = settings.apparentOffset;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24 }}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => refresh({ force: true })}
          tintColor={palette.ink}
        />
      }
    >
      {/* 1. 헤더 */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: SPACE.gutter,
        }}
      >
        <Pressable
          onPress={() => refresh({ force: true })}
          accessibilityRole="button"
          accessibilityLabel={`${locationName}. 탭하면 위치와 날씨를 새로고침`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            minHeight: MIN_TOUCH,
            flexShrink: 1,
          }}
        >
          <PinIcon color={palette.ink} />
          <Text font="sans600" size={15} numberOfLines={1}>
            {locationName}
          </Text>
        </Pressable>
        <Label size={11} tracking={0.06} color={palette.sub}>
          {stale
            ? `오프라인 · ${formatTime(updatedAt)}`
            : `${formatTime(updatedAt)} 갱신`}
        </Label>
      </View>

      {/* 2. 히어로 */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          paddingHorizontal: SPACE.gutter,
          paddingTop: 6,
        }}
      >
        <View>
          <Label size={11} tracking={0.12} color={palette.sub}>
            FEELS LIKE · 체감
          </Label>
          <Text
            font="sans700"
            size={120}
            style={{ lineHeight: 112, letterSpacing: -7 }}
            accessibilityLabel={`체감온도 ${Math.round(
              weather.apparentTemp,
            )}도`}
          >
            {`${Math.round(weather.apparentTemp)}°`}
          </Text>
        </View>
        <View
          style={{
            alignItems: 'flex-end',
            gap: 10,
            paddingBottom: 10,
            flexShrink: 1,
          }}
        >
          <View
            style={{
              backgroundColor: palette.ink,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 4,
            }}
          >
            <Label size={12} strong tracking={0.04} color={palette.bg}>
              {`BAND ${outfit.band} · ${band.short}`}
            </Label>
          </View>
          <Text font="sans500" size={15} style={{ textAlign: 'right' }}>
            {describeDay(weather)}
          </Text>
          {offset !== 0 ? (
            <Label size={10} tracking={0} color={palette.sub}>
              {`보정 ${offset > 0 ? '+' : ''}${offset}° 적용`}
            </Label>
          ) : null}
        </View>
      </View>

      {/* 3. 지표 한 줄 */}
      <View
        style={{
          marginHorizontal: SPACE.gutter,
          marginTop: 16,
          flexDirection: 'row',
          borderTopWidth: BORDER.card,
          borderBottomWidth: BORDER.card,
          borderColor: palette.ink,
        }}
      >
        <Metric label="기온" value={`${Math.round(weather.temp)}°`} first />
        <Metric label="습도" value={`${Math.round(weather.humidity)}%`} />
        <Metric label="강수" value={`${Math.round(weather.precipProb)}%`} />
        <Metric label="바람" value={`${Math.round(weather.windSpeed)}km/h`} />
      </View>

      {/* 4. 시간대 4칸 */}
      <View
        style={{
          marginHorizontal: SPACE.gutter,
          marginTop: 12,
          flexDirection: 'row',
          gap: 6,
        }}
      >
        {hourSlots(weather).map(slot => (
          <View
            key={slot.label}
            accessible
            accessibilityLabel={`${slot.label}시, 체감 ${
              slot.apparentTemp != null
                ? Math.round(slot.apparentTemp)
                : '알 수 없음'
            }도, ${slot.status}`}
            style={{
              flex: 1,
              padding: 8,
              borderRadius: RADIUS.card,
              backgroundColor: slot.wet ? palette.ink : palette.tile,
              gap: 4,
            }}
          >
            <Label
              size={10}
              tracking={0}
              color={slot.wet ? palette.bg : palette.sub}
            >
              {slot.label}
            </Label>
            <Text
              font="mono600"
              size={16}
              color={slot.wet ? palette.bg : palette.ink}
            >
              {slot.apparentTemp != null
                ? `${Math.round(slot.apparentTemp)}°`
                : '—'}
            </Text>
            <Text
              size={11}
              color={slot.wet ? palette.bg : palette.sub}
              numberOfLines={1}
            >
              {slot.status}
            </Text>
          </View>
        ))}
      </View>

      {/* 5. 팁 띠 */}
      {outfit.tip && accent ? (
        <View
          accessibilityRole="text"
          style={{
            marginHorizontal: SPACE.gutter,
            marginTop: 12,
            backgroundColor: accent,
            borderRadius: RADIUS.card,
            paddingHorizontal: 14,
            paddingVertical: 11,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {wet ? (
            <UmbrellaIcon color={ACCENT_TEXT} />
          ) : (
            <ThermoIcon color={ACCENT_TEXT} />
          )}
          <Text
            font="sans600"
            size={13}
            color={ACCENT_TEXT}
            style={{ flex: 1, lineHeight: 18 }}
          >
            {outfit.tip}
          </Text>
        </View>
      ) : null}

      {/* 6. 오늘의 옷 */}
      <View style={{ marginHorizontal: SPACE.gutter, marginTop: 18, gap: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <Text font="sans700" size={18} accessibilityRole="header">
            오늘의 옷
          </Text>
          <Label size={11} tracking={0.06} color={palette.sub}>
            {`${items.length} ITEMS`}
          </Label>
        </View>
        {items.length === 0 ? (
          <Text size={13} color={palette.sub}>
            지금 날씨에 맞는 옷이 옷장에 없어요. 옷장에서 제외한 옷을 다시 켜
            보세요.
          </Text>
        ) : (
          <View style={{ gap: SPACE.gap }}>
            {chunk(items, 3).map(row => (
              <View
                key={row.map(i => i?.id ?? 'empty').join()}
                style={{ flexDirection: 'row', gap: SPACE.gap }}
              >
                {row.map((item, i) => {
                  if (!item)
                    return <View key={`empty-${i}`} style={{ flex: 1 }} />;
                  const boosted = outfit.boostedIds.includes(item.id);
                  return (
                    <LabelCard
                      key={item.id}
                      item={item}
                      detail={
                        item.conditions
                          ? '오늘 날씨용'
                          : MATERIAL_LABEL[item.material]
                      }
                      dotColor={boosted ? accent : null}
                      accessibilityLabel={`${item.name}, ${
                        MATERIAL_LABEL[item.material]
                      }${boosted ? ', 날씨에 맞는 재질' : ''}`}
                      style={{ flex: 1 }}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

/** 3열 그리드용: 마지막 줄은 빈 칸(undefined)으로 채워 카드 폭을 맞춘다 */
function chunk<T>(list: T[], size: number): (T | undefined)[][] {
  const rows: (T | undefined)[][] = [];
  for (let i = 0; i < list.length; i += size) {
    const row: (T | undefined)[] = list.slice(i, i + size);
    while (row.length < size) row.push(undefined);
    rows.push(row);
  }
  return rows;
}

function Metric({
  label,
  value,
  first,
}: {
  label: string;
  value: string;
  first?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label} ${value}`}
      style={{
        flex: 1,
        paddingVertical: 8,
        paddingLeft: first ? 0 : 10,
        borderLeftWidth: first ? 0 : BORDER.hairline,
        borderLeftColor: palette.rule,
        gap: 2,
      }}
    >
      <Label size={10} tracking={0} color={palette.sub}>
        {label}
      </Label>
      <Text font="mono600" size={15} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function Loading() {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Label size={12} color={palette.sub}>
        날씨를 불러오는 중
      </Label>
    </View>
  );
}

function ErrorState({
  kind,
  onRetry,
}: {
  kind: 'NO_LOCATION' | 'NO_WEATHER';
  onRetry: () => void;
}) {
  const { palette } = useTheme();
  const navigation = useNavigation<any>();
  const noLocation = kind === 'NO_LOCATION';
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACE.gutter,
        gap: 14,
      }}
    >
      <Label size={11} color={palette.sub}>
        {noLocation ? 'NO LOCATION' : 'NO WEATHER'}
      </Label>
      <Text font="sans700" size={24}>
        {noLocation ? '위치를 알 수 없어요' : '날씨를 불러오지 못했어요'}
      </Text>
      <Text size={14} color={palette.sub} style={{ lineHeight: 21 }}>
        {noLocation
          ? '현재 위치의 날씨로 옷을 추천하려면 대략적인 위치 권한이 필요해요.'
          : '인터넷 연결을 확인하고 다시 시도해 주세요.'}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
        {noLocation ? (
          <>
            <Button
              label="권한 안내 보기"
              onPress={() => navigation.navigate('Onboarding')}
              primary
            />
            <Button label="설정 열기" onPress={() => Linking.openSettings()} />
          </>
        ) : (
          <Button label="다시 시도" onPress={onRetry} primary />
        )}
      </View>
    </View>
  );
}
