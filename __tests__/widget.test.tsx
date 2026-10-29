import { buildWidgetTree } from 'react-native-android-widget/lib/commonjs/api/build-widget-tree';
import type { TodayOutfit } from '../src/core/getTodayOutfit';
import { CATALOG } from '../src/outfit/catalog';
import { recommend } from '../src/outfit/recommend';
import { getAccent } from '../src/ui/accent';
import { toWidgetModel } from '../widgets/model';
import { renderWidget, WIDGET_NAMES } from '../widgets/renderWidget';
import { makeWeather } from './helpers/fixtures';

function today(
  apparentTemp: number,
  extra: Partial<Parameters<typeof makeWeather>[0]> = {},
): TodayOutfit {
  const weather = makeWeather({ apparentTemp, ...extra });
  return {
    locationName: '부산 해운대구',
    weather,
    outfit: recommend(weather, CATALOG, [], '2026-10-29'),
    updatedAt: 0,
    stale: false,
  };
}

/** 위젯 트리에서 모든 텍스트를 모은다 */
function texts(node: any): string[] {
  const own = node.type === 'TextWidget' ? [node.props.text] : [];
  return [...own, ...(node.children ?? []).flatMap(texts)];
}

const SIZES = [
  { width: 320, height: 160 },
  { width: 160, height: 160 },
  { width: 400, height: 220 },
];

describe('위젯 렌더링', () => {
  it.each(WIDGET_NAMES)(
    '%s: 라이트/다크 모두 네이티브 트리로 변환된다',
    name => {
      for (const size of SIZES) {
        for (const data of [
          today(11, { precipProb: 80 }),
          today(30),
          today(0),
        ]) {
          const rep = renderWidget(name, { data }, size) as any;
          expect(() => buildWidgetTree(rep.light)).not.toThrow();
          expect(() => buildWidgetTree(rep.dark)).not.toThrow();
        }
      }
    },
  );

  it('4×2: 지역, 체감온도, 팁, 옷 이름이 들어간다', () => {
    const data = today(14, { precipProb: 80 });
    const tree = buildWidgetTree(
      (renderWidget('TodayOutfit', { data }, SIZES[0]) as any).light,
    );
    const all = texts(tree);
    expect(all).toContain('부산 해운대구');
    expect(all).toContain('14°');
    expect(all).toContain('체감 · 12–16°');
    expect(all).toContain('비 소식 · 우산');
    expect(all).toContain('슬랙스');
    expect(tree.props).toMatchObject({ clickAction: 'OPEN_APP' });
  });

  it('포인트 컬러는 구간 색을 쓴다', () => {
    const hot = toWidgetModel(today(30));
    const cold = toWidgetModel(today(0));
    expect(hot.accent).toBe(getAccent(8));
    expect(cold.accent).toBe(getAccent(1));
  });

  it('이미지가 없으면 카테고리 약자 자리표시자', () => {
    const model = toWidgetModel(today(14));
    expect(model.tiles4.every(t => !t.image)).toBe(true);
    const all = texts(
      buildWidgetTree(
        (renderWidget('TodayOutfit', { data: today(14) }, SIZES[0]) as any)
          .light,
      ),
    );
    expect(all).toEqual(expect.arrayContaining(['OUT', 'TOP', 'BTM']));
  });

  it('4×2 타일은 최대 4개, 2×2는 2개', () => {
    const model = toWidgetModel(today(0, { precipProb: 90 }));
    expect(model.tiles4.length).toBeLessThanOrEqual(4);
    expect(model.tiles2.length).toBe(2);
  });

  it.each(['NO_LOCATION', 'NO_WEATHER'] as const)('에러 상태 %s', error => {
    for (const name of WIDGET_NAMES) {
      const tree = buildWidgetTree(
        (renderWidget(name, { error }, SIZES[0]) as any).light,
      );
      const all = texts(tree).join(' ');
      expect(all).toContain(
        error === 'NO_LOCATION'
          ? '앱을 한 번 열어 위치를 설정해 주세요'
          : '날씨를 불러오지 못했어요',
      );
    }
  });
});
