import { random, shuffle } from './random';

export type Level = 'facil' | 'medio' | 'dificil' | 'experto';
export const LEVELS: Record<Level, { size: number; mines: number; label: string }> = {
  facil: { size: 9, mines: 10, label: 'Fácil' },
  medio: { size: 12, mines: 24, label: 'Medio' },
  dificil: { size: 14, mines: 40, label: 'Difícil' },
  experto: { size: 16, mines: 56, label: 'Experto' },
};

export function neighbors(i: number, size: number): number[] {
  const r = Math.floor(i / size);
  const c = i % size;
  const result: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr;
      const nc = c + dc;
      if ((dr || dc) && nr >= 0 && nc >= 0 && nr < size && nc < size) result.push(nr * size + nc);
    }
  }
  return result;
}

/** Places mines anywhere except the first tapped cell and its neighbours, so the first tap opens an area. */
export function placeMines(size: number, mines: number, safe: number): boolean[] {
  const excluded = new Set([safe, ...neighbors(safe, size)]);
  const candidates = shuffle([...Array(size * size).keys()].filter((i) => !excluded.has(i)));
  const result = Array(size * size).fill(false);
  candidates.slice(0, mines).forEach((i) => (result[i] = true));
  return result;
}

/**
 * Daily board: the mines can't depend on where each player taps first, so the seed fixes
 * both the mines and a safe starting cell that the screen opens for the player.
 */
export function dailyBoard(size: number, mines: number): { mines: boolean[]; start: number } {
  const start = Math.floor(random() * size * size);
  return { mines: placeMines(size, mines, start), start };
}

export function countAround(mines: boolean[], i: number, size: number) {
  return neighbors(i, size).filter((j) => mines[j]).length;
}

/** Cells to reveal when opening `start`: flood-fills through cells with no adjacent mines. */
export function flood(mines: boolean[], revealed: boolean[], flags: boolean[], start: number, size: number): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  const stack = [start];
  while (stack.length) {
    const i = stack.pop()!;
    if (seen.has(i) || revealed[i] || flags[i]) continue;
    seen.add(i);
    out.push(i);
    if (!mines[i] && countAround(mines, i, size) === 0) stack.push(...neighbors(i, size));
  }
  return out;
}
