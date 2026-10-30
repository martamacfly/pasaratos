import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';

export type DailyResult = { won: boolean; seconds?: number };
/** date (YYYY-MM-DD) -> game id -> result */
export type DailyLog = Record<string, Record<string, DailyResult>>;

const KEY = 'daily';

export function dateKey(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function dateLabel(d = new Date()) {
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

export async function loadDaily(): Promise<DailyLog> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function recordDaily(game: string, won: boolean, seconds?: number) {
  const log = await loadDaily();
  const today = dateKey();
  log[today] = { ...log[today], [game]: { won, seconds } };
  await AsyncStorage.setItem(KEY, JSON.stringify(log));
}

/** Consecutive days, ending today (or yesterday if today has nothing yet), with at least one challenge done. */
export function streak(log: DailyLog): number {
  const day = new Date();
  if (!log[dateKey(day)]) day.setDate(day.getDate() - 1);
  let count = 0;
  while (log[dateKey(day)] && Object.keys(log[dateKey(day)]).length > 0) {
    count++;
    day.setDate(day.getDate() - 1);
  }
  return count;
}

/**
 * Daily mode is opened with `?reto=1`. Everyone gets the same puzzle for a given game and day
 * because the generator runs with `seed`; the game is saved apart from the free-play one.
 */
export function useDaily(game: string) {
  const { reto } = useLocalSearchParams<{ reto?: string }>();
  const daily = reto === '1';
  const date = dateKey();
  return { daily, date, seed: `${date}:${game}`, saveKey: daily ? `${game}:reto` : game };
}
