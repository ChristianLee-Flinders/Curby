import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { addDays, nextSlot } from '@/lib/format';
import type { Place } from '@/lib/places';

export type Mode = 'driver' | 'host';

type Search = { place: Place | null; arrive: Date; leave: Date };

type AppState = {
  mode: Mode;
  setMode: (m: Mode) => void;
  search: Search;
  setPlace: (p: Place | null) => void;
  setTimes: (arrive: Date, leave: Date) => void;
};

const MODE_KEY = 'curby.mode';

function defaultTimes() {
  const now = new Date();
  // Before 7pm: next slot today for 4 hours. Otherwise tomorrow 9:00–17:00.
  if (now.getHours() < 19) {
    const a = nextSlot(now);
    return { arrive: a, leave: new Date(a.getTime() + 4 * 36e5) };
  }
  const a = addDays(now, 1);
  a.setHours(9, 0, 0, 0);
  const b = new Date(a);
  b.setHours(17, 0, 0, 0);
  return { arrive: a, leave: b };
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>('driver');
  const [search, setSearch] = useState<Search>(() => ({ place: null, ...defaultTimes() }));

  useEffect(() => {
    AsyncStorage.getItem(MODE_KEY)
      .then((m) => {
        if (m === 'host' || m === 'driver') setModeState(m);
      })
      .catch(() => {});
  }, []);

  const value = useMemo<AppState>(
    () => ({
      mode,
      setMode: (m) => {
        setModeState(m);
        AsyncStorage.setItem(MODE_KEY, m).catch(() => {});
      },
      search,
      setPlace: (place) => setSearch((s) => ({ ...s, place })),
      setTimes: (arrive, leave) => setSearch((s) => ({ ...s, arrive, leave })),
    }),
    [mode, search]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppState must be used inside AppStateProvider');
  return v;
}
