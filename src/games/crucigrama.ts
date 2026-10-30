import { PISTAS } from './pistas';
import { random, shuffle } from './random';

export type Dir = 'across' | 'down';
export type Entry = { number: number; word: string; clue: string; row: number; col: number; dir: Dir };
export type Crossword = { rows: number; cols: number; grid: (string | null)[][]; entries: Entry[] };

const MAX_SIZE = 11;
const TARGET_WORDS = 10;

type Placed = { word: string; clue: string; row: number; col: number; dir: Dir };

class Builder {
  cells = new Map<string, { letter: string; across: boolean; down: boolean }>();
  placed: Placed[] = [];
  minR = 0;
  maxR = 0;
  minC = 0;
  maxC = 0;

  at(r: number, c: number) {
    return this.cells.get(`${r},${c}`);
  }

  /** Number of crossings if the word fits at (row, col), or -1 if it does not. */
  fits(word: string, row: number, col: number, dir: Dir): number {
    const dr = dir === 'down' ? 1 : 0;
    const dc = dir === 'across' ? 1 : 0;
    if (this.at(row - dr, col - dc) || this.at(row + dr * word.length, col + dc * word.length)) return -1;
    let crossings = 0;
    let minR = this.minR, maxR = this.maxR, minC = this.minC, maxC = this.maxC;
    for (let i = 0; i < word.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      minR = Math.min(minR, r); maxR = Math.max(maxR, r);
      minC = Math.min(minC, c); maxC = Math.max(maxC, c);
      const cell = this.at(r, c);
      if (cell) {
        if (cell.letter !== word[i] || cell[dir]) return -1;
        crossings++;
      } else if (this.at(r + dc, c + dr) || this.at(r - dc, c - dr)) {
        // A new letter must not sit right next to another word running in parallel.
        return -1;
      }
    }
    if (maxR - minR + 1 > MAX_SIZE || maxC - minC + 1 > MAX_SIZE) return -1;
    return crossings;
  }

  place(p: Placed) {
    const dr = p.dir === 'down' ? 1 : 0;
    const dc = p.dir === 'across' ? 1 : 0;
    for (let i = 0; i < p.word.length; i++) {
      const r = p.row + dr * i;
      const c = p.col + dc * i;
      const cell = this.at(r, c) ?? { letter: p.word[i], across: false, down: false };
      cell[p.dir] = true;
      this.cells.set(`${r},${c}`, cell);
      this.minR = Math.min(this.minR, r); this.maxR = Math.max(this.maxR, r);
      this.minC = Math.min(this.minC, c); this.maxC = Math.max(this.maxC, c);
    }
    this.placed.push(p);
  }

  /** Best position crossing the existing words, preferring more crossings. */
  tryAdd(word: string, clue: string): boolean {
    let best: Placed | null = null;
    let bestScore = 0;
    for (const [key, cell] of this.cells) {
      const [r, c] = key.split(',').map(Number);
      for (let i = 0; i < word.length; i++) {
        if (word[i] !== cell.letter) continue;
        for (const dir of ['across', 'down'] as Dir[]) {
          const row = dir === 'down' ? r - i : r;
          const col = dir === 'across' ? c - i : c;
          const score = this.fits(word, row, col, dir);
          if (score > bestScore || (score === bestScore && score > 0 && random() < 0.3)) {
            best = { word, clue, row, col, dir };
            bestScore = score;
          }
        }
      }
    }
    if (best) this.place(best);
    return best !== null;
  }
}

function attempt(): Builder {
  const b = new Builder();
  const pool = shuffle(PISTAS);
  const first = pool.find((p) => p.word.length >= 6) ?? pool[0];
  b.place({ ...first, row: 0, col: 0, dir: random() < 0.5 ? 'across' : 'down' });
  for (const p of pool) {
    if (b.placed.length >= TARGET_WORDS) break;
    if (p === first) continue;
    b.tryAdd(p.word, p.clue);
  }
  return b;
}

export function generate(): Crossword {
  let best = attempt();
  for (let i = 0; i < 15 && best.placed.length < TARGET_WORDS; i++) {
    const b = attempt();
    if (b.placed.length > best.placed.length) best = b;
  }

  const rows = best.maxR - best.minR + 1;
  const cols = best.maxC - best.minC + 1;
  const grid: (string | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (const [key, cell] of best.cells) {
    const [r, c] = key.split(',').map(Number);
    grid[r - best.minR][c - best.minC] = cell.letter;
  }

  // Number entries in reading order; words starting on the same cell share a number.
  const starts = best.placed
    .map((p) => ({ ...p, row: p.row - best.minR, col: p.col - best.minC }))
    .sort((a, b) => a.row - b.row || a.col - b.col);
  const numbers = new Map<string, number>();
  const entries: Entry[] = starts.map((p) => {
    const key = `${p.row},${p.col}`;
    if (!numbers.has(key)) numbers.set(key, numbers.size + 1);
    return { ...p, number: numbers.get(key)! };
  });

  return { rows, cols, grid, entries };
}

export function cellsOf(e: Entry): [number, number][] {
  return [...e.word].map((_, i) => (e.dir === 'across' ? [e.row, e.col + i] : [e.row + i, e.col]));
}
