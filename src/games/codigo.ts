import { colorblind, SAFE_COLORS } from '@/theme';
import { random, shuffle } from './random';

export type Level = 'facil' | 'medio' | 'dificil';
export const LEVELS: Record<Level, { length: number; colors: number; repeat: boolean; label: string }> = {
  facil: { length: 4, colors: 5, repeat: false, label: 'Fácil' },
  medio: { length: 4, colors: 6, repeat: true, label: 'Medio' },
  dificil: { length: 5, colors: 7, repeat: true, label: 'Difícil' },
};
export const TRIES = 10;
export const PEG_COLORS = colorblind
  ? SAFE_COLORS.slice(0, 7)
  : ['#E03131', '#1971C2', '#2F9E44', '#F59F00', '#9C36B5', '#0C8599', '#E64980'];

/** Secret code: `length` colour indices, repeated or not depending on the level. */
export function generate(level: Level): number[] {
  const { length, colors, repeat } = LEVELS[level];
  if (!repeat) return shuffle([...Array(colors).keys()]).slice(0, length);
  return Array.from({ length }, () => Math.floor(random() * colors));
}

/** exact: right colour in the right place; near: right colour in another place. */
export function feedback(guess: number[], secret: number[]) {
  let exact = 0;
  const left: Record<number, number> = {};
  const rest: number[] = [];
  guess.forEach((g, i) => {
    if (g === secret[i]) exact++;
    else {
      left[secret[i]] = (left[secret[i]] ?? 0) + 1;
      rest.push(g);
    }
  });
  let near = 0;
  for (const g of rest) {
    if (left[g] > 0) {
      near++;
      left[g]--;
    }
  }
  return { exact, near };
}
