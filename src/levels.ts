import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

/** Levels per difficulty (or per size) of every game. */
export const LEVEL_COUNT = 20;

const KEY = 'levels';
/** "game:variant" -> numbers of the completed levels */
export type Progress = Record<string, number[]>;

// Level bars on screen reload when a level is saved as completed.
const listeners = new Set<() => void>();

export async function load(): Promise<Progress> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Seed for a level's generator: every player gets the same board for the same level. */
export const levelSeed = (game: string, variant: string | number, level: number) => `nivel:${game}:${variant}:${level}`;

export async function completeLevel(game: string, variant: string | number, level: number) {
  const all = await load();
  const key = `${game}:${variant}`;
  all[key] = [...new Set([...(all[key] ?? []), level])];
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
  listeners.forEach((notify) => notify());
}

/** A level is open when it is the first one or the one before it has been completed. */
export const isUnlocked = (done: number[], level: number) => level === 1 || done.includes(level - 1);

/**
 * Completed levels of one game variant, kept up to date as levels are completed, and whether they
 * have been read from storage yet.
 */
export function useLevelProgress(game: string, variant: string | number): [number[], boolean] {
  const key = `${game}:${variant}`;
  // Remember which variant the list belongs to, so a change of difficulty isn't answered with the old one.
  const [state, setState] = useState<{ key: string; done: number[] } | null>(null);
  useEffect(() => {
    let alive = true;
    const reload = () => load().then((all) => alive && setState({ key, done: all[key] ?? [] }));
    reload();
    listeners.add(reload);
    return () => {
      alive = false;
      listeners.delete(reload);
    };
  }, [key]);
  const current = state?.key === key ? state.done : null;
  return [current ?? [], current !== null];
}
