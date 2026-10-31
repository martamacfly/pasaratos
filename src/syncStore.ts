// Small store that can be read synchronously when the app starts, for the settings the colours
// depend on. The web uses localStorage; phones use syncStore.native.ts.

export function readSync(key: string): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSync(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or storage full: the settings just won't be remembered.
  }
}
