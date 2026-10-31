import type { Achievement } from '@/achievements';
import { gameName, SITE_URL, variantName } from '@/games/catalog';

// Texts for sharing progress with friends. Each ends with the link so they can play too.

/** The level of a game on screen, as LevelBar reports it to the page. */
export type LevelInfo = { game: string; variant: string | number; level: number };

/** `result` is the victory message, e.g. "¡Resuelto en 3:04!". */
export function levelShareText({ game, variant, level }: LevelInfo, result?: string) {
  const where = `el nivel ${level} de ${gameName(game)} (${variantName(variant)})`;
  return [`🧩 He completado ${where} en Pasaratos.`, result, '¿Te atreves?', SITE_URL].filter(Boolean).join('\n');
}

const TIER_EMOJI = { bronce: '🥉', plata: '🥈', oro: '🥇' } as const;

export function achievementShareText(a: Achievement) {
  return [
    `${TIER_EMOJI[a.tier]} He conseguido el logro «${a.title}» en Pasaratos: ${a.desc.toLowerCase()}.`,
    SITE_URL,
  ].join('\n');
}

export function achievementsSummaryText(list: Achievement[]) {
  const unlocked = list.filter((a) => a.unlocked);
  const medals = unlocked.map((a) => TIER_EMOJI[a.tier]).join('');
  return [`🏅 Llevo ${unlocked.length} de ${list.length} logros en Pasaratos.`, medals, SITE_URL]
    .filter(Boolean)
    .join('\n');
}
