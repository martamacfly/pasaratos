import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { gameName, SITE_URL } from '@/games/catalog';

/** `detail` is an optional extra line for sharing, e.g. the coloured squares of a word game. */
export type DailyResult = { won: boolean; seconds?: number; detail?: string };
/** date (YYYY-MM-DD) -> game id -> result */
export type DailyLog = Record<string, Record<string, DailyResult>>;

const KEY = 'daily';
// Screens showing today's results reload when a new one is saved.
const listeners = new Set<() => void>();

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

export async function recordDaily(game: string, won: boolean, seconds?: number, detail?: string) {
  const log = await loadDaily();
  const today = dateKey();
  log[today] = { ...log[today], [game]: { won, seconds, detail } };
  await AsyncStorage.setItem(KEY, JSON.stringify(log));
  listeners.forEach((notify) => notify());
}

/** The whole daily log, kept up to date as challenges are completed. */
export function useDailyLog(): DailyLog {
  const [log, setLog] = useState<DailyLog>({});
  useEffect(() => {
    let alive = true;
    const reload = () => loadDaily().then((l) => alive && setLog(l));
    reload();
    listeners.add(reload);
    return () => {
      alive = false;
      listeners.delete(reload);
    };
  }, []);
  return log;
}

function resultLine(game: string, r: DailyResult) {
  const time =
    r.seconds !== undefined ? ` ${Math.floor(r.seconds / 60)}:${String(r.seconds % 60).padStart(2, '0')}` : '';
  const line = `${r.won ? '✅' : '❌'} ${gameName(game)}${time}`;
  return r.detail ? `${line}\n${r.detail}` : line;
}

/** Text to share today's results: one game, or every challenge done today. */
export function shareText(log: DailyLog, game?: string): string {
  const today = log[dateKey()] ?? {};
  const games = game ? [game] : Object.keys(today);
  const lines = games.filter((g) => today[g]).map((g) => resultLine(g, today[g]));
  const header = game ? 'Pasaratos · Reto del día' : `Pasaratos · Reto del día · ${games.length} completados`;
  return [`${header} (${dateLabel()})`, ...lines, SITE_URL].join('\n');
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
