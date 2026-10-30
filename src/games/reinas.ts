import { shuffle } from './random';

/** regions[r][c] = region id (0..n-1). solution[r] = column of the queen in row r. */
export type Puzzle = { n: number; regions: number[][]; solution: number[] };

/** Random queen columns per row: one per column, no two queens touching diagonally. */
function placeQueens(n: number): number[] | null {
  const cols: number[] = [];
  const used = new Set<number>();
  const step = (r: number): boolean => {
    if (r === n) return true;
    for (const c of shuffle([...Array(n).keys()])) {
      if (used.has(c) || (r > 0 && Math.abs(cols[r - 1] - c) <= 1)) continue;
      cols.push(c);
      used.add(c);
      if (step(r + 1)) return true;
      cols.pop();
      used.delete(c);
    }
    return false;
  };
  return step(0) ? cols : null;
}

/** Grows one region from each queen by random flood fill until the board is covered. */
function growRegions(n: number, queens: number[]): number[][] {
  const regions = Array.from({ length: n }, () => Array(n).fill(-1));
  queens.forEach((c, r) => (regions[r][c] = r));
  let left = n * n - n;
  while (left > 0) {
    const r = Math.floor(Math.random() * n);
    const c = Math.floor(Math.random() * n);
    if (regions[r][c] === -1) continue;
    const [dr, dc] = shuffle([[0, 1], [1, 0], [0, -1], [-1, 0]])[0];
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nc < 0 || nr >= n || nc >= n || regions[nr][nc] !== -1) continue;
    regions[nr][nc] = regions[r][c];
    left--;
  }
  return regions;
}

/** Counts solutions up to `limit`. */
export function countSolutions(n: number, regions: number[][], limit = 2): number {
  const cols: number[] = [];
  const usedCols = new Set<number>();
  const usedRegions = new Set<number>();
  let count = 0;
  const step = (r: number) => {
    if (count >= limit) return;
    if (r === n) {
      count++;
      return;
    }
    for (let c = 0; c < n; c++) {
      const reg = regions[r][c];
      if (usedCols.has(c) || usedRegions.has(reg) || (r > 0 && Math.abs(cols[r - 1] - c) <= 1)) continue;
      cols.push(c);
      usedCols.add(c);
      usedRegions.add(reg);
      step(r + 1);
      cols.pop();
      usedCols.delete(c);
      usedRegions.delete(reg);
    }
  };
  step(0);
  return count;
}

export function generate(n: number): Puzzle {
  for (;;) {
    const queens = placeQueens(n);
    if (!queens) continue;
    // Several region layouts per queen placement; keep the first with a unique solution.
    for (let attempt = 0; attempt < 50; attempt++) {
      const regions = growRegions(n, queens);
      if (countSolutions(n, regions) === 1) return { n, regions, solution: queens };
    }
  }
}

export type CellState = 0 | 1 | 2; // empty, marked (×), queen

/** Cells holding a queen that breaks a rule (shared row/column/region or touching another queen). */
export function conflicts(board: CellState[][], regions: number[][]): Set<string> {
  const queens: [number, number][] = [];
  board.forEach((row, r) => row.forEach((s, c) => s === 2 && queens.push([r, c])));
  const bad = new Set<string>();
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      const [r1, c1] = queens[i];
      const [r2, c2] = queens[j];
      const clash =
        r1 === r2 ||
        c1 === c2 ||
        regions[r1][c1] === regions[r2][c2] ||
        (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1);
      if (clash) {
        bad.add(`${r1},${c1}`);
        bad.add(`${r2},${c2}`);
      }
    }
  }
  return bad;
}
