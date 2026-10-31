import { type DailyLog, loadDaily } from './daily';
import { ALL_GAMES } from './games/catalog';
import { load as loadLevels, type Progress } from './levels';
import { loadStats, type Stats } from './storage';

export type Tier = 'bronce' | 'plata' | 'oro';
type Data = { stats: Record<string, Stats>; daily: DailyLog; levels: Progress };
type Definition = { id: string; title: string; desc: string; tier: Tier; goal: number; progress: (d: Data) => number };
export type Achievement = Omit<Definition, 'progress'> & { progress: number; unlocked: boolean };

/** Wins of a game across all its variants ("sudoku", "sudoku:facil"…), or of every game. */
function wins(stats: Record<string, Stats>, game?: string) {
  return Object.entries(stats)
    .filter(([key]) => !game || key === game || key.startsWith(`${game}:`))
    .reduce((sum, [, s]) => sum + s.won, 0);
}

/** Longest run of consecutive days with at least one daily challenge done. */
export function longestStreak(daily: DailyLog) {
  const days = Object.keys(daily)
    .filter((d) => Object.keys(daily[d]).length > 0)
    .sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of days) {
    const date = new Date(`${d}T12:00:00`);
    run = prev && Math.round((date.getTime() - prev.getTime()) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }
  return best;
}

const DEFINITIONS: Definition[] = [
  {
    id: 'primera',
    title: 'Primer paso',
    desc: 'Gana tu primera partida',
    tier: 'bronce',
    goal: 1,
    progress: (d) => wins(d.stats),
  },
  {
    id: 'aficionado',
    title: 'Aficionado',
    desc: 'Gana 10 partidas',
    tier: 'bronce',
    goal: 10,
    progress: (d) => wins(d.stats),
  },
  {
    id: 'veterano',
    title: 'Veterano',
    desc: 'Gana 50 partidas',
    tier: 'plata',
    goal: 50,
    progress: (d) => wins(d.stats),
  },
  {
    id: 'leyenda',
    title: 'Leyenda',
    desc: 'Gana 200 partidas',
    tier: 'oro',
    goal: 200,
    progress: (d) => wins(d.stats),
  },
  {
    id: 'explorador',
    title: 'Explorador',
    desc: 'Gana en 5 juegos distintos',
    tier: 'bronce',
    goal: 5,
    progress: (d) => ALL_GAMES.filter((g) => wins(d.stats, g.id) > 0).length,
  },
  {
    id: 'todoterreno',
    title: 'Todoterreno',
    desc: 'Gana al menos una vez en todos los juegos',
    tier: 'oro',
    goal: ALL_GAMES.length,
    progress: (d) => ALL_GAMES.filter((g) => wins(d.stats, g.id) > 0).length,
  },
  {
    id: 'retador',
    title: 'Retador',
    desc: 'Completa tu primer reto del día',
    tier: 'bronce',
    goal: 1,
    progress: (d) =>
      Object.values(d.daily).reduce((sum, day) => sum + Object.values(day).filter((r) => r.won).length, 0),
  },
  {
    id: 'constante',
    title: 'Constante',
    desc: 'Haz retos 3 días seguidos',
    tier: 'bronce',
    goal: 3,
    progress: (d) => longestStreak(d.daily),
  },
  {
    id: 'imparable',
    title: 'Imparable',
    desc: 'Haz retos 7 días seguidos',
    tier: 'plata',
    goal: 7,
    progress: (d) => longestStreak(d.daily),
  },
  {
    id: 'habito',
    title: 'Hábito de hierro',
    desc: 'Haz retos 30 días seguidos',
    tier: 'oro',
    goal: 30,
    progress: (d) => longestStreak(d.daily),
  },
  {
    id: 'dia-perfecto',
    title: 'Día perfecto',
    desc: 'Gana todos los retos de un mismo día',
    tier: 'oro',
    goal: ALL_GAMES.length,
    progress: (d) =>
      Math.max(0, ...Object.values(d.daily).map((day) => Object.values(day).filter((r) => r.won).length)),
  },
  {
    id: 'escalador',
    title: 'Escalador',
    desc: 'Completa 10 niveles de una misma dificultad',
    tier: 'bronce',
    goal: 10,
    progress: (d) => Math.max(0, ...Object.values(d.levels).map((l) => l.length)),
  },
  {
    id: 'cumbre',
    title: 'Cumbre',
    desc: 'Completa los 20 niveles de una dificultad',
    tier: 'plata',
    goal: 20,
    progress: (d) => Math.max(0, ...Object.values(d.levels).map((l) => l.length)),
  },
  {
    id: 'coleccionista',
    title: 'Coleccionista',
    desc: 'Completa 100 niveles en total',
    tier: 'oro',
    goal: 100,
    progress: (d) => Object.values(d.levels).reduce((sum, l) => sum + l.length, 0),
  },
  {
    id: 'cerebrito',
    title: 'Cerebrito',
    desc: 'Gana un Sudoku experto',
    tier: 'plata',
    goal: 1,
    progress: (d) => d.stats['sudoku:experto']?.won ?? 0,
  },
  {
    id: 'rayo',
    title: 'Rayo',
    desc: 'Resuelve un Sudoku fácil en menos de 5 minutos',
    tier: 'plata',
    goal: 1,
    progress: (d) => ((d.stats['sudoku:facil']?.best ?? Infinity) < 300 ? 1 : 0),
  },
  {
    id: 'artificiero',
    title: 'Artificiero',
    desc: 'Gana un Buscaminas experto',
    tier: 'oro',
    goal: 1,
    progress: (d) => d.stats['buscaminas:experto']?.won ?? 0,
  },
  {
    id: 'linguista',
    title: 'Lingüista',
    desc: 'Acierta 25 palabras ocultas',
    tier: 'plata',
    goal: 25,
    progress: (d) => wins(d.stats, 'palabra'),
  },
];

export async function loadAchievements(): Promise<Achievement[]> {
  const [stats, daily, levels] = await Promise.all([loadStats(), loadDaily(), loadLevels()]);
  const data = { stats, daily, levels };
  return DEFINITIONS.map(({ progress, ...def }) => {
    const value = Math.min(progress(data), def.goal);
    return { ...def, progress: value, unlocked: value >= def.goal };
  });
}
