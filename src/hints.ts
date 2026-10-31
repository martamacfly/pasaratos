import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

// Hints are earned by winning daily challenges (one per game and day) and spent in free play.
const KEY = 'hints';
const listeners = new Set<() => void>();

async function load(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? Number(JSON.parse(raw)) || 0 : 0;
  } catch {
    return 0;
  }
}

async function save(count: number) {
  await AsyncStorage.setItem(KEY, JSON.stringify(count));
  listeners.forEach((notify) => notify());
}

export async function addHint() {
  await save((await load()) + 1);
}

/** Uses one hint; resolves to false when there were none left. */
export async function spendHint(): Promise<boolean> {
  const count = await load();
  if (count <= 0) return false;
  await save(count - 1);
  return true;
}

/** Hints available, kept up to date as they are earned and spent. */
export function useHints(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    const reload = () => load().then((c) => alive && setCount(c));
    reload();
    listeners.add(reload);
    return () => {
      alive = false;
      listeners.delete(reload);
    };
  }, []);
  return count;
}
