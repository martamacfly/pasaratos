import { createContext, useContext, useEffect, useState } from 'react';
import { readSync, writeSync } from '@/syncStore';

export type Settings = {
  theme: 'auto' | 'light' | 'dark';
  bigText: boolean;
  /** Orange and blue instead of green and yellow, and other colour pairs that are easy to tell apart. */
  colorblind: boolean;
  showTimer: boolean;
  /** Number games paint a wrong number in red as soon as it is written. */
  showErrors: boolean;
  /** Sudoku highlights the row, column and box of the selected cell, and the same numbers. */
  highlight: boolean;
  confirmRestart: boolean;
  haptics: boolean;
  confetti: boolean;
  /** Hour of the daily challenge reminder, or null for none (phones only). */
  reminder: number | null;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'auto',
  bigText: false,
  colorblind: false,
  showTimer: true,
  showErrors: false,
  highlight: true,
  confirmRestart: true,
  haptics: true,
  confetti: true,
  reminder: null,
};

// Read by the inline script of the web page too (see +html.tsx), so keep the key in sync.
export const SETTINGS_KEY = 'settings';
const listeners = new Set<() => void>();

/**
 * Settings are kept in a store that can be read synchronously, so the colours (chosen once, when
 * the app starts) already follow them on the first frame.
 */
function read(): Settings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(readSync(SETTINGS_KEY) ?? '{}') };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

let current = read();

/** Settings as they were when the app started: the colours depend on these and need a restart. */
export const START_SETTINGS = current;

export function getSettings() {
  return current;
}

export function updateSettings(change: Partial<Settings>) {
  current = { ...current, ...change };
  writeSync(SETTINGS_KEY, JSON.stringify(current));
  listeners.forEach((notify) => notify());
}

/** Current settings, updated as soon as any of them changes. Used once, by the root layout. */
export function useSettingsState(): Settings {
  const [settings, setSettings] = useState(current);
  useEffect(() => {
    const reload = () => setSettings(current);
    listeners.add(reload);
    return () => {
      listeners.delete(reload);
    };
  }, []);
  return settings;
}

export const SettingsContext = createContext<Settings>(current);

/** Settings in effect, from the root layout. */
export function useSettings() {
  return useContext(SettingsContext);
}
