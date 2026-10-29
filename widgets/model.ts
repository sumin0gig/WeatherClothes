import type { TodayOutfit } from '../src/core/getTodayOutfit';
import { bandInfo } from '../src/outfit/bands';
import { CATEGORY_ABBR } from '../src/outfit/catalog';
import { getClothImage } from '../src/outfit/images';
import type { ClothItem } from '../src/outfit/types';
import { getAccent } from '../src/ui/accent';
import type { ImageRequireSource } from 'react-native';

/** 위젯 컴포넌트는 계산하지 않는다. 그릴 값은 모두 여기서 미리 만든다. */
export type WidgetTile = {
  name: string;
  abbr: string;
  image?: ImageRequireSource;
};

export type WidgetModel = {
  locationName: string;
  tempText: string;
  bandText: string;
  accent: string;
  shortTip?: string;
  wet: boolean;
  /** 4×2용: outer, top 또는 onepiece, bottom, extras[0] */
  tiles4: WidgetTile[];
  /** 2×2용: 겉옷(없으면 상의) + 그다음 하나 */
  tiles2: WidgetTile[];
  stale: boolean;
};

const toTile = (item: ClothItem): WidgetTile => ({
  name: item.name,
  abbr: CATEGORY_ABBR[item.category],
  image: getClothImage(item.id),
});

export function toWidgetModel(data: TodayOutfit): WidgetModel {
  const { outfit, weather } = data;
  const main = [
    outfit.outer,
    outfit.onepiece ?? outfit.top,
    outfit.bottom ?? outfit.legwear,
    outfit.extras[0],
  ];
  const tiles4 = main
    .filter((i): i is ClothItem => !!i)
    .slice(0, 4)
    .map(toTile);
  const ordered = [
    outfit.outer,
    outfit.onepiece,
    outfit.top,
    outfit.bottom,
    ...outfit.extras,
  ].filter((i): i is ClothItem => !!i);
  return {
    locationName: data.locationName,
    tempText: `${Math.round(weather.apparentTemp)}°`,
    bandText: `체감 · ${bandInfo(outfit.band).short}`,
    accent: getAccent(outfit.band),
    shortTip: outfit.shortTip,
    wet: outfit.tags.includes('rain') || outfit.tags.includes('snow'),
    tiles4,
    tiles2: ordered.slice(0, 2).map(toTile),
    stale: data.stale,
  };
}
