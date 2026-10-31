import AsyncStorage from '@react-native-async-storage/async-storage';
import { reloadAppAsync } from 'expo';
import { SETTINGS_KEY } from '@/settings';

// Everything the app saves (games in progress, levels, stats, daily challenges, hints, settings)
// lives in AsyncStorage, so a backup is all of it packed into one text code.

const PREFIX = 'PASARATOS1:';

// btoa/atob only take Latin-1, and saved games contain words with accents and Ñ.
const toBase64 = (text: string) => btoa(unescape(encodeURIComponent(text)));
const fromBase64 = (code: string) => decodeURIComponent(escape(atob(code)));

export async function exportBackup(): Promise<string> {
  const keys = await AsyncStorage.getAllKeys();
  const entries = await AsyncStorage.multiGet(keys);
  const data = Object.fromEntries(entries.filter(([, v]) => v !== null));
  return PREFIX + toBase64(JSON.stringify(data));
}

/** Replaces everything saved with the backup. Resolves to false if the code isn't a valid backup. */
export async function importBackup(code: string): Promise<boolean> {
  let data: Record<string, string>;
  try {
    const text = code.trim();
    if (!text.startsWith(PREFIX)) return false;
    data = JSON.parse(fromBase64(text.slice(PREFIX.length)));
    if (typeof data !== 'object' || data === null || Object.values(data).some((v) => typeof v !== 'string')) {
      return false;
    }
  } catch {
    return false;
  }
  await AsyncStorage.clear();
  await AsyncStorage.multiSet(Object.entries(data));
  return true;
}

/** Deletes all progress (games, levels, stats, daily challenges, hints). Settings are kept. */
export async function eraseProgress() {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((k) => k !== SETTINGS_KEY));
}

/** Starts the app again, so every screen reads what is saved now. */
export function restartApp() {
  if (typeof window !== 'undefined' && window.location) window.location.reload();
  else reloadAppAsync().catch(() => {});
}
