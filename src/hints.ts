import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

// Each game has its own hints for free play: it starts with a few, and winning that game's daily
// challenge earns one more (once per day).
export const STARTING_HINTS = 3;
const KEY = 'hints:games';
const listeners = new Set<() => void>();

/** game id -> hints left; a game that isn't there still has all its starting hints. */
type Hints = Record<string, number>;

async function load(): Promise<Hints> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const countOf = (hints: Hints, game: string) => hints[game] ?? STARTING_HINTS;

async function change(game: string, delta: number) {
  const hints = await load();
  hints[game] = countOf(hints, game) + delta;
  await AsyncStorage.setItem(KEY, JSON.stringify(hints));
  listeners.forEach((notify) => notify());
}

export async function addHint(game: string) {
  await change(game, 1);
}

/** Uses one of the game's hints; resolves to false when it had none left. */
export async function spendHint(game: string): Promise<boolean> {
  if (countOf(await load(), game) <= 0) return false;
  await change(game, -1);
  return true;
}

/** Hints the game has left, kept up to date as they are earned and spent. */
export function useHints(game: string): number {
  const [count, setCount] = useState(STARTING_HINTS);
  useEffect(() => {
    let alive = true;
    const reload = () => load().then((h) => alive && setCount(countOf(h, game)));
    reload();
    listeners.add(reload);
    return () => {
      alive = false;
      listeners.delete(reload);
    };
  }, [game]);
  return count;
}
