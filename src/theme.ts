import { Appearance, Platform } from 'react-native';
import { START_SETTINGS } from '@/settings';

function systemDark() {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  }
  return Appearance.getColorScheme() === 'dark';
}

/** Whether the app is drawn dark. Decided once at start-up, since styles are built from it. */
export const dark = START_SETTINGS.theme === 'dark' || (START_SETTINGS.theme === 'auto' && systemDark());
export const colorblind = START_SETTINGS.colorblind;

const LIGHT = {
  bg: '#F6F4EF',
  card: '#FFFFFF',
  text: '#1F2328',
  muted: '#6B7280',
  border: '#D6D3CC',
  accent: '#3B5BDB',
  accentSoft: '#DBE4FF',
  success: '#2F9E44',
  successSoft: '#D3F9D8',
  warning: '#E8A400',
  danger: '#E03131',
  dangerSoft: '#FFE3E3',
};

const DARK: typeof LIGHT = {
  bg: '#14161B',
  card: '#22252D',
  text: '#ECEEF2',
  muted: '#9AA1AD',
  border: '#3A3E48',
  accent: '#748FFC',
  accentSoft: '#26305A',
  success: '#40C057',
  successSoft: '#1B3B24',
  warning: '#FAB005',
  danger: '#FA5252',
  dangerSoft: '#4A1F22',
};

export const colors = dark ? DARK : LIGHT;

export const radius = 12;

function toHsl(hex: string): [number, number, number] {
  const full = hex.length === 4 ? hex.replace(/\w/g, (c) => c + c) : hex;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function fromHsl(h: number, s: number, l: number) {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return (
    '#' +
    [0, 8, 4]
      .map((n) =>
        Math.round(f(n) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

/**
 * A colour written for the light design, adapted to the dark one: pale backgrounds and tints become
 * dark ones of the same hue, dark text becomes light, and strong colours stay about the same.
 */
export function tone(hex: string) {
  if (!dark) return hex;
  const [h, s, l] = toHsl(hex);
  // Pale tints stay a little lighter than the cards, so highlights still stand out; strong colours
  // are only brightened a bit; dark ones (text, lines) are mirrored.
  const next = l >= 0.65 ? 0.12 + (1 - l) * 0.9 : l > 0.35 ? Math.min(l + 0.08, 0.72) : Math.min(1 - l, 0.92);
  return fromHsl(h, Math.min(s, l >= 0.65 ? 0.45 : 0.75), next);
}

/** `hex`, lightened if needed so it reads well as text on the dark design. */
export function readable(hex: string) {
  const [h, s, l] = toHsl(hex);
  return l >= 0.55 ? hex : fromHsl(h, s, 0.6);
}

/** The hue of `hex` at another lightness, e.g. a dark background tinted with a game's colour. */
export function shade(hex: string, lightness: number, saturation = 0.3) {
  const [h, s] = toHsl(hex);
  return fromHsl(h, Math.min(s, saturation), lightness);
}

/** Colours that stay distinct for every kind of colour blindness (Okabe & Ito), plus a grey. */
export const SAFE_COLORS = ['#D55E00', '#0072B2', '#009E73', '#F0E442', '#CC79A7', '#56B4E9', '#E69F00', '#868E96'];
