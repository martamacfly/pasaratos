// All generators draw from `random()` so the daily challenge can swap in a seeded source
// and give every player the same puzzle on the same day.
let source: () => number = Math.random;

export function random() {
  return source();
}

/** mulberry32: small, fast seeded PRNG returning floats in [0, 1). */
function seeded(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Runs `fn` with a deterministic random source derived from `seed`. */
export function withSeed<T>(seed: string, fn: () => T): T {
  const previous = source;
  source = seeded(seed);
  try {
    return fn();
  } finally {
    source = previous;
  }
}

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}
