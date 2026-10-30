import { latinAllowed, latinSquare } from './latin';
import { shuffle } from './random';

/** value[lo] must be smaller than value[hi]; lo and hi are adjacent cells. */
export type Ineq = { lo: number; hi: number };
export type Futoshiki = { n: number; givens: number[]; ineqs: Ineq[]; solution: number[] };

function count(n: number, givens: number[], ineqs: Ineq[], limit = 2): number {
  const grid = [...givens];
  const related = Array.from({ length: n * n }, () => [] as Ineq[]);
  for (const q of ineqs) {
    related[q.lo].push(q);
    related[q.hi].push(q);
  }
  let found = 0;
  const step = (i: number) => {
    if (found >= limit) return;
    if (i === n * n) {
      found++;
      return;
    }
    if (givens[i]) return step(i + 1);
    for (let v = 1; v <= n; v++) {
      if (!latinAllowed(grid, n, i, v)) continue;
      grid[i] = v;
      const ok = related[i].every((q) => !grid[q.lo] || !grid[q.hi] || grid[q.lo] < grid[q.hi]);
      if (ok) step(i + 1);
      grid[i] = 0;
    }
  };
  step(0);
  return found;
}

/** Minimal puzzle with a unique solution; `extraSigns` adds back that many inequalities to make it easier. */
export function generate(n: number, extraSigns = 0): Futoshiki {
  const solution = latinSquare(n);
  const all: Ineq[] = [];
  for (let i = 0; i < n * n; i++) {
    const neighbours = [];
    if (i % n < n - 1) neighbours.push(i + 1);
    if (i < n * (n - 1)) neighbours.push(i + n);
    for (const j of neighbours) all.push(solution[i] < solution[j] ? { lo: i, hi: j } : { lo: j, hi: i });
  }

  let ineqs = shuffle(all);
  const givens = Array(n * n).fill(0);
  // With every inequality a unique solution is almost certain; add given numbers if not.
  for (const i of shuffle([...givens.keys()])) {
    if (count(n, givens, ineqs) === 1) break;
    givens[i] = solution[i];
  }
  // Then drop inequalities, and finally givens, while the solution stays unique.
  for (const q of [...ineqs]) {
    const without = ineqs.filter((x) => x !== q);
    if (count(n, givens, without) === 1) ineqs = without;
  }
  for (const i of shuffle([...givens.keys()])) {
    if (!givens[i]) continue;
    givens[i] = 0;
    if (count(n, givens, ineqs) !== 1) givens[i] = solution[i];
  }
  const unused = shuffle(all.filter((q) => !ineqs.includes(q)));
  ineqs = [...ineqs, ...unused.slice(0, extraSigns)];
  return { n, givens, ineqs, solution };
}

/** Cells taking part in an inequality that the current numbers break. */
export function ineqConflicts(grid: number[], ineqs: Ineq[]): Set<number> {
  const bad = new Set<number>();
  for (const q of ineqs) {
    if (grid[q.lo] && grid[q.hi] && grid[q.lo] >= grid[q.hi]) {
      bad.add(q.lo);
      bad.add(q.hi);
    }
  }
  return bad;
}
