import { shuffle } from './random';

/** Board of 81 cells, row-major. 0 = empty. */
export type Board = number[];
export type Difficulty = 'facil' | 'medio' | 'dificil';

const CLUES: Record<Difficulty, number> = { facil: 40, medio: 32, dificil: 26 };

const row = (i: number) => Math.floor(i / 9);
const col = (i: number) => i % 9;
const box = (i: number) => Math.floor(row(i) / 3) * 3 + Math.floor(col(i) / 3);

export function canPlace(board: Board, i: number, n: number) {
  for (let j = 0; j < 81; j++) {
    if (j !== i && board[j] === n && (row(j) === row(i) || col(j) === col(i) || box(j) === box(i))) {
      return false;
    }
  }
  return true;
}

/** Counts solutions up to `limit`, filling `board` in place with the first one found when limit is 1. */
function solve(board: Board, limit: number, randomize = false): number {
  const empty = board.indexOf(0);
  if (empty === -1) return 1;
  let count = 0;
  const candidates = randomize ? shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]) : [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (const n of candidates) {
    if (!canPlace(board, empty, n)) continue;
    board[empty] = n;
    count += solve(board, limit - count, randomize);
    if (count >= limit) return count;
    board[empty] = 0;
  }
  return count;
}

export function generate(difficulty: Difficulty): { puzzle: Board; solution: Board } {
  const solution: Board = Array(81).fill(0);
  solve(solution, 1, true);

  const puzzle = [...solution];
  let clues = 81;
  for (const i of shuffle([...Array(81).keys()])) {
    if (clues <= CLUES[difficulty]) break;
    const saved = puzzle[i];
    puzzle[i] = 0;
    if (solve([...puzzle], 2) !== 1) puzzle[i] = saved;
    else clues--;
  }
  return { puzzle, solution };
}

/** Indices of cells whose value clashes with another cell in its row, column or box. */
export function conflicts(board: Board): Set<number> {
  const result = new Set<number>();
  board.forEach((n, i) => {
    if (n !== 0 && !canPlace(board, i, n)) result.add(i);
  });
  return result;
}

export const sameUnit = (a: number, b: number) => row(a) === row(b) || col(a) === col(b) || box(a) === box(b);
