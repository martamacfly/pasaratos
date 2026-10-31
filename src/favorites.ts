import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

// Games marked with the star, shown first on the menu, in the order they were starred.
const KEY = 'favorites';
const listeners = new Set<() => void>();

async function load(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function toggleFavorite(game: string) {
  const list = await load();
  const next = list.includes(game) ? list.filter((g) => g !== game) : [...list, game];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((notify) => notify());
}

/** Favourite game ids, kept up to date wherever a star is pressed. */
export function useFavorites(): string[] {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    const reload = () => load().then((l) => alive && setList(l));
    reload();
    listeners.add(reload);
    return () => {
      alive = false;
      listeners.delete(reload);
    };
  }, []);
  return list;
}
