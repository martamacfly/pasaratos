import { shuffle } from './random';

/** Random n×n Latin square (values 1..n, row-major): a cyclic square with rows, columns and symbols shuffled. */
export function latinSquare(n: number): number[] {
  const rows = shuffle([...Array(n).keys()]);
  const cols = shuffle([...Array(n).keys()]);
  const symbols = shuffle([...Array(n).keys()].map((v) => v + 1));
  const grid: number[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) grid.push(symbols[(rows[r] + cols[c]) % n]);
  return grid;
}

/** Cells that repeat a value in their row or column. */
export function latinConflicts(grid: number[], n: number): Set<number> {
  const bad = new Set<number>();
  grid.forEach((v, i) => {
    if (!v) return;
    const r = Math.floor(i / n);
    const c = i % n;
    for (let k = 0; k < n; k++) {
      const j1 = r * n + k;
      const j2 = k * n + c;
      if (j1 !== i && grid[j1] === v) bad.add(i);
      if (j2 !== i && grid[j2] === v) bad.add(i);
    }
  });
  return bad;
}

/** True if v is not already used in the row or column of cell i. */
export function latinAllowed(grid: number[], n: number, i: number, v: number) {
  const r = Math.floor(i / n);
  const c = i % n;
  for (let k = 0; k < n; k++) {
    if (grid[r * n + k] === v || grid[k * n + c] === v) return false;
  }
  return true;
}

/** Adds to `bad` the filled cells (non-zero) that don't match the solution. For the "show errors" setting. */
export function withWrong(bad: Set<number>, grid: number[], solution: number[]): Set<number> {
  grid.forEach((v, i) => v !== 0 && v !== solution[i] && bad.add(i));
  return bad;
}
