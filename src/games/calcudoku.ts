import { latinAllowed, latinSquare } from './latin';
import { random, shuffle } from './random';

export type Op = '+' | '−' | '×' | '÷' | '';
export type Cage = { cells: number[]; op: Op; target: number };
export type Calcudoku = { n: number; cages: Cage[]; solution: number[] };

function evaluate(op: Op, values: number[]): number {
  switch (op) {
    case '+':
      return values.reduce((a, b) => a + b, 0);
    case '×':
      return values.reduce((a, b) => a * b, 1);
    case '−':
      return Math.abs(values[0] - values[1]);
    case '÷':
      return Math.max(...values) / Math.min(...values);
    default:
      return values[0];
  }
}

/** Whether the cage can still reach its target given the values placed so far (0 = empty). */
function cageOk(cage: Cage, grid: number[], n: number): boolean {
  const values = cage.cells.map((i) => grid[i]);
  const filled = values.filter(Boolean);
  if (filled.length === values.length) return evaluate(cage.op, values) === cage.target;
  const left = values.length - filled.length;
  if (cage.op === '+') {
    const sum = filled.reduce((a, b) => a + b, 0);
    return sum + left <= cage.target && sum + left * n >= cage.target;
  }
  if (cage.op === '×') {
    const product = filled.reduce((a, b) => a * b, 1);
    return cage.target % product === 0;
  }
  return true;
}

function count(n: number, cages: Cage[], limit = 2): number {
  const cageOf = Array<Cage>(n * n);
  cages.forEach((c) => c.cells.forEach((i) => (cageOf[i] = c)));
  const grid = Array(n * n).fill(0);
  let found = 0;
  const step = (i: number) => {
    if (found >= limit) return;
    if (i === n * n) {
      found++;
      return;
    }
    for (let v = 1; v <= n; v++) {
      if (!latinAllowed(grid, n, i, v)) continue;
      grid[i] = v;
      if (cageOk(cageOf[i], grid, n)) step(i + 1);
      grid[i] = 0;
    }
  };
  step(0);
  return found;
}

function makeCages(n: number, solution: number[]): Cage[] {
  const owner = Array(n * n).fill(-1);
  const groups: number[][] = [];
  for (const start of shuffle([...owner.keys()])) {
    if (owner[start] !== -1) continue;
    const roll = random();
    const size = roll < 0.12 ? 1 : roll < 0.6 ? 2 : roll < 0.92 ? 3 : 4;
    const cells = [start];
    owner[start] = groups.length;
    while (cells.length < size) {
      const options = cells.flatMap((i) =>
        [i - n, i + n, i % n > 0 ? i - 1 : -1, i % n < n - 1 ? i + 1 : -1].filter((j) => j >= 0 && j < n * n && owner[j] === -1),
      );
      if (!options.length) break;
      const next = options[Math.floor(random() * options.length)];
      owner[next] = groups.length;
      cells.push(next);
    }
    groups.push(cells);
  }

  return groups.map((cells) => {
    const values = cells.map((i) => solution[i]);
    let op: Op = '';
    if (cells.length === 2) {
      const [a, b] = values;
      const options: Op[] = ['+', '−', '×', '−'];
      if (Math.max(a, b) % Math.min(a, b) === 0) options.push('÷', '÷', '÷');
      op = options[Math.floor(random() * options.length)];
    } else if (cells.length > 2) {
      op = random() < 0.55 ? '+' : '×';
    }
    return { cells, op, target: evaluate(op, values) };
  });
}

export function generate(n: number): Calcudoku {
  for (;;) {
    const solution = latinSquare(n);
    for (let attempt = 0; attempt < 20; attempt++) {
      const cages = makeCages(n, solution);
      if (count(n, cages) === 1) return { n, cages, solution };
    }
  }
}

/** Cells of complete cages whose numbers don't give the target. */
export function cageConflicts(grid: number[], cages: Cage[]): Set<number> {
  const bad = new Set<number>();
  for (const cage of cages) {
    const values = cage.cells.map((i) => grid[i]);
    if (values.every(Boolean) && evaluate(cage.op, values) !== cage.target) cage.cells.forEach((i) => bad.add(i));
  }
  return bad;
}
