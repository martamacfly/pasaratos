import { shuffle } from './random';

/** Cells hold 0 (empty), 1 (sun) or 2 (moon). Row-major, n×n. */
export type Grid = number[];

/** True if placing value v at index i breaks no rule given the cells filled so far. */
function allowed(g: Grid, n: number, i: number, v: number): boolean {
  const r = Math.floor(i / n);
  const c = i % n;
  const at = (rr: number, cc: number) => (rr === r && cc === c ? v : g[rr * n + cc]);

  // No three equal in a row, horizontally or vertically.
  for (let k = -2; k <= 0; k++) {
    if (c + k >= 0 && c + k + 2 < n && [0, 1, 2].every((d) => at(r, c + k + d) === v)) return false;
    if (r + k >= 0 && r + k + 2 < n && [0, 1, 2].every((d) => at(r + k + d, c) === v)) return false;
  }

  // At most n/2 of each symbol per row and column.
  let rowCount = 0;
  let colCount = 0;
  for (let k = 0; k < n; k++) {
    if (at(r, k) === v) rowCount++;
    if (at(k, c) === v) colCount++;
  }
  if (rowCount > n / 2 || colCount > n / 2) return false;

  // A completed row or column must not repeat another completed one.
  const line = (get: (k: number) => number) => Array.from({ length: n }, (_, k) => get(k)).join('');
  const rowStr = line((k) => at(r, k));
  if (!rowStr.includes('0')) {
    for (let rr = 0; rr < n; rr++) if (rr !== r && line((k) => at(rr, k)) === rowStr) return false;
  }
  const colStr = line((k) => at(k, c));
  if (!colStr.includes('0')) {
    for (let cc = 0; cc < n; cc++) if (cc !== c && line((k) => at(k, cc)) === colStr) return false;
  }
  return true;
}

function solve(g: Grid, n: number, limit: number, randomize = false): number {
  const i = g.indexOf(0);
  if (i === -1) return 1;
  let count = 0;
  for (const v of randomize ? shuffle([1, 2]) : [1, 2]) {
    if (!allowed(g, n, i, v)) continue;
    g[i] = v;
    count += solve(g, n, limit - count, randomize);
    if (count >= limit) return count;
    g[i] = 0;
  }
  return count;
}

export function generate(n: number): { puzzle: Grid; solution: Grid } {
  const solution: Grid = Array(n * n).fill(0);
  solve(solution, n, 1, true);
  const puzzle = [...solution];
  for (const i of shuffle([...puzzle.keys()])) {
    const saved = puzzle[i];
    puzzle[i] = 0;
    if (solve([...puzzle], n, 2) !== 1) puzzle[i] = saved;
  }
  return { puzzle, solution };
}

/** Indices of cells involved in a broken rule (three in a row or too many of one symbol). */
export function conflicts(g: Grid, n: number): Set<number> {
  const bad = new Set<number>();
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const v = g[r * n + c];
      if (!v) continue;
      if (c + 2 < n && g[r * n + c + 1] === v && g[r * n + c + 2] === v) [0, 1, 2].forEach((d) => bad.add(r * n + c + d));
      if (r + 2 < n && g[(r + 1) * n + c] === v && g[(r + 2) * n + c] === v) [0, 1, 2].forEach((d) => bad.add((r + d) * n + c));
    }
  }
  for (let k = 0; k < n; k++) {
    for (const v of [1, 2]) {
      const row = Array.from({ length: n }, (_, j) => k * n + j);
      const col = Array.from({ length: n }, (_, j) => j * n + k);
      for (const line of [row, col]) {
        const same = line.filter((i) => g[i] === v);
        if (same.length > n / 2) same.forEach((i) => bad.add(i));
      }
    }
  }
  return bad;
}
