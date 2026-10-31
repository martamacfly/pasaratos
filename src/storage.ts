import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';

/**
 * `time`: seconds spent in finished games with a clock (counted since it was added).
 * `dist`: for Palabra oculta, how many words were guessed at each attempt (index 0 = first).
 */
export type Stats = { played: number; won: number; best?: number; time?: number; dist?: number[] };

const STATS_KEY = 'stats';

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function loadStats(): Promise<Record<string, Stats>> {
  return (await readJson<Record<string, Stats>>(STATS_KEY)) ?? {};
}

/**
 * Records a finished game. `id` identifies the variant (e.g. "sudoku:facil"),
 * so best times are only compared within the same difficulty or size. `attempts` is how many tries a
 * won game took, for games that have them.
 */
export async function recordResult(id: string, won: boolean, seconds?: number, attempts?: number) {
  const all = await loadStats();
  const s = all[id] ?? { played: 0, won: 0 };
  s.played++;
  if (seconds !== undefined) s.time = (s.time ?? 0) + seconds;
  if (won) {
    s.won++;
    if (seconds !== undefined && (s.best === undefined || seconds < s.best)) s.best = seconds;
    if (attempts !== undefined) {
      s.dist = s.dist ?? [];
      s.dist[attempts - 1] = (s.dist[attempts - 1] ?? 0) + 1;
    }
  }
  all[id] = s;
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(all));
}

/** Stats for one variant, refreshed whenever `id` or `refresh` changes. */
export function useStats(id: string, refresh: unknown): Stats | undefined {
  const [stats, setStats] = useState<Stats>();
  useEffect(() => {
    let alive = true;
    loadStats().then((all) => alive && setStats(all[id]));
    return () => {
      alive = false;
    };
  }, [id, refresh]);
  return stats;
}

/**
 * Restores a saved game once on mount, then saves `snapshot` whenever it changes.
 * Returns false until the saved game (if any) has been loaded, so screens can avoid
 * flashing a fresh board before the restored one.
 */
export function useAutosave<T>(key: string, snapshot: T, restore: (saved: T) => void): boolean {
  const [loaded, setLoaded] = useState(false);
  const restoreRef = useRef(restore);
  restoreRef.current = restore;

  useEffect(() => {
    readJson<T>(`game:${key}`).then((saved) => {
      if (saved) restoreRef.current(saved);
      setLoaded(true);
    });
  }, [key]);

  const json = JSON.stringify(snapshot);
  useEffect(() => {
    if (loaded) AsyncStorage.setItem(`game:${key}`, json).catch(() => {});
  }, [key, json, loaded]);

  return loaded;
}
