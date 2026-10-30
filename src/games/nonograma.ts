/** Cells: true = filled. Row-major, n×n. */
export type Picture = boolean[];

/** Lengths of consecutive filled runs, e.g. [1,1,0,1] -> [2,1]. Empty line -> [0]. */
export function runs(line: boolean[]): number[] {
  const result: number[] = [];
  let count = 0;
  for (const v of line) {
    if (v) count++;
    else if (count) {
      result.push(count);
      count = 0;
    }
  }
  if (count) result.push(count);
  return result.length ? result : [0];
}

export function clues(p: Picture, n: number) {
  const rows = Array.from({ length: n }, (_, r) => runs(p.slice(r * n, r * n + n)));
  const cols = Array.from({ length: n }, (_, c) => runs(Array.from({ length: n }, (_, r) => p[r * n + c])));
  return { rows, cols };
}

// Line solver state per cell: -1 unknown, 0 empty, 1 filled.
type Cell = -1 | 0 | 1;

/** Every arrangement of `clue` in a line of length n consistent with what is already known. */
function arrangements(clue: number[], known: Cell[]): Cell[][] {
  const n = known.length;
  const blocks = clue[0] === 0 ? [] : clue;
  const out: Cell[][] = [];
  const line: Cell[] = Array(n).fill(0);
  const place = (b: number, start: number) => {
    if (b === blocks.length) {
      for (let i = start; i < n; i++) line[i] = 0;
      if (line.every((v, i) => known[i] === -1 || known[i] === v)) out.push([...line]);
      return;
    }
    const remaining = blocks.slice(b + 1).reduce((s, x) => s + x + 1, 0);
    for (let s = start; s + blocks[b] + remaining <= n; s++) {
      for (let i = start; i < s; i++) line[i] = 0;
      for (let i = s; i < s + blocks[b]; i++) line[i] = 1;
      // Prune early when the prefix already contradicts known cells.
      let ok = true;
      for (let i = start; i < s + blocks[b]; i++) if (known[i] !== -1 && known[i] !== line[i]) ok = false;
      if (s + blocks[b] < n) {
        line[s + blocks[b]] = 0;
        if (known[s + blocks[b]] === 1) ok = false;
      }
      if (ok) place(b + 1, s + blocks[b] + 1);
    }
  };
  place(0, 0);
  return out;
}

/** True if the clues can be solved line by line without guessing (which also means a unique solution). */
export function lineSolvable(rowClues: number[][], colClues: number[][], n: number): boolean {
  const grid: Cell[] = Array(n * n).fill(-1);
  let changed = true;
  while (changed) {
    changed = false;
    for (let k = 0; k < 2 * n; k++) {
      const isRow = k < n;
      const idx = isRow ? Array.from({ length: n }, (_, i) => k * n + i) : Array.from({ length: n }, (_, i) => i * n + (k - n));
      const known = idx.map((i) => grid[i]);
      if (!known.includes(-1)) continue;
      const options = arrangements(isRow ? rowClues[k] : colClues[k - n], known);
      if (options.length === 0) return false;
      idx.forEach((cell, i) => {
        if (grid[cell] !== -1) return;
        const v = options[0][i];
        if (options.every((o) => o[i] === v)) {
          grid[cell] = v;
          changed = true;
        }
      });
    }
  }
  return !grid.includes(-1);
}

export function generate(n: number): Picture {
  for (;;) {
    const p = Array.from({ length: n * n }, () => Math.random() < 0.58);
    const { rows, cols } = clues(p, n);
    if (lineSolvable(rows, cols, n)) return p;
  }
}
