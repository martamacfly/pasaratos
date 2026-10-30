import { PISTAS } from './pistas';
import { random, shuffle } from './random';
import { SOLUTIONS } from './words';

export type Placement = { word: string; cells: number[] };
export type Sopa = { size: number; letters: string[]; words: Placement[] };

const DIRECTIONS = [
  [0, 1], [1, 0], [1, 1], [-1, 1], // forwards: →, ↓, ↘, ↗
  [0, -1], [-1, 0], [-1, -1], [1, -1], // backwards, used from medium level up
];
const ALPHABET = 'AAAABCDEEEEFGHIIIJLLMNNÑOOOOPQRRSSSTTUUVYZ';

export function generate(size: number, count: number, backwards: boolean): Sopa {
  const dirs = backwards ? DIRECTIONS : DIRECTIONS.slice(0, 4);
  const pool = shuffle([...new Set([...PISTAS.map((p) => p.word), ...SOLUTIONS])].filter((w) => w.length <= size));
  const grid: (string | null)[] = Array(size * size).fill(null);
  const words: Placement[] = [];

  for (const word of pool) {
    if (words.length >= count) break;
    if (words.some((w) => w.word.includes(word) || word.includes(w.word))) continue;
    for (let tries = 0; tries < 60; tries++) {
      const [dr, dc] = dirs[Math.floor(random() * dirs.length)];
      const r0 = Math.floor(random() * size);
      const c0 = Math.floor(random() * size);
      const cells = [...word].map((_, i) => [r0 + dr * i, c0 + dc * i]);
      if (cells.some(([r, c]) => r < 0 || c < 0 || r >= size || c >= size)) continue;
      const idx = cells.map(([r, c]) => r * size + c);
      if (idx.some((i, k) => grid[i] !== null && grid[i] !== word[k])) continue;
      idx.forEach((i, k) => (grid[i] = word[k]));
      words.push({ word, cells: idx });
      break;
    }
  }

  const letters = grid.map((l) => l ?? ALPHABET[Math.floor(random() * ALPHABET.length)]);
  return { size, letters, words: words.sort((a, b) => a.word.localeCompare(b.word)) };
}

/** Cells on the straight line from a to b (horizontal, vertical or diagonal), or null if not aligned. */
export function lineBetween(a: number, b: number, size: number): number[] | null {
  const [r1, c1] = [Math.floor(a / size), a % size];
  const [r2, c2] = [Math.floor(b / size), b % size];
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  const len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
  if (r1 !== r2 && c1 !== c2 && Math.abs(r2 - r1) !== Math.abs(c2 - c1)) return null;
  return Array.from({ length: len + 1 }, (_, i) => (r1 + dr * i) * size + (c1 + dc * i));
}
