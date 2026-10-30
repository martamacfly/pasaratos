import { random, shuffle } from './random';

export const adjacent = (a: number, b: number, n: number) =>
  (Math.abs(a - b) === 1 && Math.floor(a / n) === Math.floor(b / n)) || Math.abs(a - b) === n;

function neighbours(i: number, n: number): number[] {
  const out: number[] = [];
  if (i >= n) out.push(i - n);
  if (i < n * (n - 1)) out.push(i + n);
  if (i % n > 0) out.push(i - 1);
  if (i % n < n - 1) out.push(i + 1);
  return out;
}

/**
 * Random path through every cell of an n×n grid, using "backbite" moves on a snake path:
 * the end of the path jumps onto a neighbour and the loop this creates is reversed.
 */
export function hamiltonianPath(n: number): number[] {
  let path: number[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) path.push(r * n + (r % 2 ? n - 1 - c : c));
  for (let k = 0; k < n * n * 30; k++) {
    if (random() < 0.5) path.reverse();
    const end = path[path.length - 1];
    const options = neighbours(end, n).filter((x) => x !== path[path.length - 2]);
    const nb = options[Math.floor(random() * options.length)];
    const idx = path.indexOf(nb);
    path = [...path.slice(0, idx + 1), ...path.slice(idx + 1).reverse()];
  }
  return path;
}

// ---- Camino numerado: draw one line through every cell, passing the numbers in order.

/** clues maps cell -> number (1 = start, highest = end). */
export type Camino = { n: number; clues: Record<number, number>; solution: number[] };

export function generateCamino(n: number): Camino {
  const solution = hamiltonianPath(n);
  const checkpoints = n + 2;
  const inner = shuffle([...Array(solution.length - 2).keys()].map((k) => k + 1))
    .slice(0, checkpoints - 2)
    .sort((a, b) => a - b);
  const indices = [0, ...inner, solution.length - 1];
  const clues: Record<number, number> = {};
  indices.forEach((idx, k) => (clues[solution[idx]] = k + 1));
  return { n, clues, solution };
}

/** A path wins if it covers every cell, starts at 1 and meets the numbers in increasing order. */
export function caminoSolved(c: Camino, path: number[]): boolean {
  if (path.length !== c.n * c.n || c.clues[path[0]] !== 1) return false;
  let next = 1;
  for (const cell of path) {
    const clue = c.clues[cell];
    if (clue === undefined) continue;
    if (clue !== next) return false;
    next++;
  }
  return true;
}

// ---- Conectar colores: join each pair of dots with a line; lines fill the whole board.

export type Colores = { n: number; pairs: [number, number][]; solution: number[][] };

export function generateColores(n: number): Colores {
  const count = n;
  for (;;) {
    const path = hamiltonianPath(n);
    // Split the path into `count` pieces of at least 3 cells.
    const lengths = Array(count).fill(3);
    for (let left = n * n - 3 * count; left > 0; left--) lengths[Math.floor(random() * count)]++;
    const pieces: number[][] = [];
    let at = 0;
    for (const len of lengths) {
      pieces.push(path.slice(at, at + len));
      at += len;
    }
    // Dots right next to each other make a piece trivial; try again.
    if (pieces.some((p) => adjacent(p[0], p[p.length - 1], n))) continue;
    return { n, pairs: pieces.map((p) => [p[0], p[p.length - 1]]), solution: pieces };
  }
}

/** Solved when every pair is joined and no cell is left empty. */
export function coloresSolved(c: Colores, lines: number[][]): boolean {
  const covered = new Set(lines.flat());
  return (
    covered.size === c.n * c.n &&
    c.pairs.every(([a, b], k) => {
      const line = lines[k];
      return line.length > 1 && ((line[0] === a && line[line.length - 1] === b) || (line[0] === b && line[line.length - 1] === a));
    })
  );
}
