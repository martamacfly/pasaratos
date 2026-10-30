import { random } from './random';

/** Tiles 1..n²-1 in row-major order; 0 is the gap. */
export type Board = number[];

export const solvedBoard = (n: number): Board => Array.from({ length: n * n }, (_, i) => (i === n * n - 1 ? 0 : i + 1));

export const isSolved = (b: Board) => b.every((v, i) => v === (i === b.length - 1 ? 0 : i + 1));

function neighbours(i: number, n: number) {
  const out: number[] = [];
  if (i >= n) out.push(i - n);
  if (i < n * (n - 1)) out.push(i + n);
  if (i % n > 0) out.push(i - 1);
  if (i % n < n - 1) out.push(i + 1);
  return out;
}

/** Shuffles by sliding tiles at random from the solved board, so the puzzle is always solvable. */
export function generate(n: number): Board {
  const b = solvedBoard(n);
  let gap = b.length - 1;
  let previous = -1;
  for (let k = 0; k < n * n * 25; k++) {
    // Never slide straight back, or the shuffle undoes itself.
    const options = neighbours(gap, n).filter((x) => x !== previous);
    const tile = options[Math.floor(random() * options.length)];
    [b[gap], b[tile]] = [b[tile], b[gap]];
    previous = gap;
    gap = tile;
  }
  return isSolved(b) ? generate(n) : b;
}

/**
 * Tapping a tile in the gap's row or column slides it, and every tile between them, one step
 * towards the gap. Returns the new board, or null if the tile cannot move.
 */
export function slide(b: Board, n: number, tile: number): Board | null {
  const gap = b.indexOf(0);
  const [tr, tc, gr, gc] = [Math.floor(tile / n), tile % n, Math.floor(gap / n), gap % n];
  if (tile === gap || (tr !== gr && tc !== gc)) return null;
  const step = tr === gr ? Math.sign(tc - gc) : Math.sign(tr - gr) * n;
  const next = [...b];
  for (let i = gap; i !== tile; i += step) next[i] = next[i + step];
  next[tile] = 0;
  return next;
}
