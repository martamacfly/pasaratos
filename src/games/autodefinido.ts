import { cellsOf, type Dir, type Entry, generate as crossword } from './crucigrama';
import { CORTAS } from './pistas';

export type ClueRef = { dir: Dir; short: string; entry: number };
export type Cell =
  | { kind: 'letter'; letter: string }
  | { kind: 'clue'; clues: ClueRef[] } // one or two clues (one pointing right, one pointing down)
  | { kind: 'block' };
export type Autodefinido = { rows: number; cols: number; cells: Cell[][]; entries: Entry[] };

/**
 * Builds an arrow-word: a crossword whose clues sit in the cell just before each word
 * (to its left for across words, above for down words). The crossword generator already
 * keeps that cell free of letters, so it only needs an extra row/column when a word starts
 * on the top or left edge.
 */
export function generate(words = 7, maxSize = 6): Autodefinido {
  const cw = crossword(words, maxSize);
  const shiftR = cw.entries.some((e) => e.dir === 'down' && e.row === 0) ? 1 : 0;
  const shiftC = cw.entries.some((e) => e.dir === 'across' && e.col === 0) ? 1 : 0;
  const rows = cw.rows + shiftR;
  const cols = cw.cols + shiftC;

  const cells: Cell[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ kind: 'block' }) as Cell));
  cw.grid.forEach((row, r) =>
    row.forEach((l, c) => {
      if (l !== null) cells[r + shiftR][c + shiftC] = { kind: 'letter', letter: l };
    }),
  );

  const entries = cw.entries.map((e) => ({ ...e, row: e.row + shiftR, col: e.col + shiftC }));
  entries.forEach((e, k) => {
    const r = e.dir === 'down' ? e.row - 1 : e.row;
    const c = e.dir === 'across' ? e.col - 1 : e.col;
    const cell = cells[r][c];
    const ref: ClueRef = { dir: e.dir, short: CORTAS[e.word] ?? e.clue, entry: k };
    if (cell.kind === 'clue') cell.clues.push(ref);
    else cells[r][c] = { kind: 'clue', clues: [ref] };
  });
  // Show the clue pointing right above the one pointing down when a cell holds both.
  for (const row of cells) for (const cell of row) if (cell.kind === 'clue') cell.clues.sort((a) => (a.dir === 'across' ? -1 : 1));

  return { rows, cols, cells, entries };
}

export { cellsOf };
