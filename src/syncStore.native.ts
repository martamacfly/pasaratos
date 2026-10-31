import Storage from 'expo-sqlite/kv-store';

// Phones: expo-sqlite's key-value store, which can be read synchronously (see syncStore.ts).

export function readSync(key: string): string | null {
  try {
    return Storage.getItemSync(key);
  } catch {
    return null;
  }
}

export function writeSync(key: string, value: string) {
  try {
    Storage.setItemSync(key, value);
  } catch {
    // The settings just won't be remembered.
  }
}
