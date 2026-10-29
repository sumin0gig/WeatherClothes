import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import {
  getTodayOutfit,
  NoLocationError,
  type TodayOutfit,
} from '../core/getTodayOutfit';
import {
  DEFAULT_SETTINGS,
  getExcludedIds,
  getSettings,
  setExcludedIds,
  setSettings,
  type Settings,
} from '../storage/prefs';
import { getAccent } from '../ui/accent';
import { ThemeProvider } from '../ui/theme';
import { updateAllWidgets } from '../widget/updateWidgets';

export type LoadError = 'NO_LOCATION' | 'NO_WEATHER';

type State = {
  loading: boolean;
  data: TodayOutfit | null;
  error: LoadError | null;
  excludedIds: string[];
  settings: Settings;
};

type Ctx = State & {
  /** force: 캐시를 무시하고 날씨를 새로 받는다 */
  refresh: (opts?: { force?: boolean }) => Promise<void>;
  toggleExcluded: (id: string) => Promise<void>;
  setApparentOffset: (value: number) => Promise<void>;
};

const OutfitContext = createContext<Ctx | null>(null);

export function OutfitProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({
    loading: true,
    data: null,
    error: null,
    excludedIds: [],
    settings: DEFAULT_SETTINGS,
  });
  const inFlight = useRef<Promise<void> | null>(null);
  /** 진행 중에 다시 요청이 들어오면, 끝난 뒤 한 번 더 계산한다 (제외 토글을 연달아 눌러도 마지막 상태가 반영되게) */
  const rerun = useRef<{ force: boolean } | null>(null);

  const refresh = useCallback(
    async (opts: { force?: boolean } = {}): Promise<void> => {
      if (inFlight.current) {
        rerun.current = {
          force: (rerun.current?.force ?? false) || !!opts.force,
        };
        return inFlight.current;
      }
      const takeRerun = () => {
        const next = rerun.current;
        rerun.current = null;
        return next;
      };
      const run = (async () => {
        let next: { force: boolean } | null = { force: !!opts.force };
        rerun.current = null;
        while (next) {
          const force = next.force;
          setState(s => ({ ...s, loading: true }));
          try {
            const data = await getTodayOutfit({ forceRefresh: force });
            setState(s => ({ ...s, loading: false, data, error: null }));
            await updateAllWidgets(data);
          } catch (e) {
            const error: LoadError =
              e instanceof NoLocationError ? 'NO_LOCATION' : 'NO_WEATHER';
            setState(s => ({ ...s, loading: false, error }));
            await updateAllWidgets(null, error);
          }
          next = takeRerun();
        }
        inFlight.current = null;
      })();
      inFlight.current = run;
      return run;
    },
    [],
  );

  useEffect(() => {
    (async () => {
      const [excludedIds, settings] = await Promise.all([
        getExcludedIds(),
        getSettings(),
      ]);
      setState(s => ({ ...s, excludedIds, settings }));
      await refresh();
    })();
    // 앱으로 돌아올 때마다 갱신 (캐시 규칙 덕분에 대부분 네트워크 없이 끝난다)
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const toggleExcluded = useCallback(
    async (id: string) => {
      const current = await getExcludedIds();
      const next = current.includes(id)
        ? current.filter(x => x !== id)
        : [...current, id];
      setState(s => ({ ...s, excludedIds: next }));
      await setExcludedIds(next);
      await refresh(); // 추천 재계산 + 위젯 즉시 갱신
    },
    [refresh],
  );

  const setApparentOffset = useCallback(
    async (value: number) => {
      const next = { ...(await getSettings()), apparentOffset: value };
      await setSettings(next);
      setState(s => ({ ...s, settings: { ...next } }));
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<Ctx>(
    () => ({ ...state, refresh, toggleExcluded, setApparentOffset }),
    [state, refresh, toggleExcluded, setApparentOffset],
  );

  const accent = state.data ? getAccent(state.data.outfit.band) : null;

  return (
    <OutfitContext.Provider value={value}>
      <ThemeProvider accent={accent}>{children}</ThemeProvider>
    </OutfitContext.Provider>
  );
}

export function useOutfit(): Ctx {
  const ctx = useContext(OutfitContext);
  if (!ctx) throw new Error('useOutfit must be used inside OutfitProvider');
  return ctx;
}
