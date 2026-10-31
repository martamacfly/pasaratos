import type { Achievement } from '@/achievements';
import type { ShareCardData } from '@/components/ShareCard';
import { formatTime } from '@/components/ui';
import { type DailyLog, type DailyResult, dateKey, dateLabel, streak } from '@/daily';
import { ALL_GAMES, gameName, SITE_URL, variantName } from '@/games/catalog';

// Texts and pictures for sharing progress with friends. Texts end with the link so they can play too.

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

// ---- Pictures (ShareCard) for the same things.

const TIER_NAME = { bronce: 'bronce', plata: 'plata', oro: 'oro' } as const;

export function levelCard({ game, variant, level }: LevelInfo, result?: string): ShareCardData {
  return {
    kicker: '¡NIVEL COMPLETADO!',
    title: `${gameName(game)} · Nivel ${level}`,
    subtitle: [variantName(variant), result].filter(Boolean).join(' · '),
    badge: { game },
  };
}

export function achievementCard(a: Achievement): ShareCardData {
  return {
    kicker: '¡LOGRO DESBLOQUEADO!',
    title: a.title,
    subtitle: `${a.desc} · Medalla de ${TIER_NAME[a.tier]}`,
    badge: { medal: a.tier },
  };
}

export function achievementsSummaryCard(list: Achievement[]): ShareCardData {
  const unlocked = list.filter((a) => a.unlocked);
  const count = (tier: Achievement['tier']) => unlocked.filter((a) => a.tier === tier).length;
  return {
    kicker: 'MIS LOGROS',
    title: `${unlocked.length} de ${list.length} logros`,
    subtitle: `${count('oro')} de oro · ${count('plata')} de plata · ${count('bronce')} de bronce`,
    badge: { count: `${unlocked.length}/${list.length}` },
  };
}

/** One game's daily challenge, as recorded today. */
export function dailyGameCard(game: string, r: DailyResult): ShareCardData {
  const result = !r.won
    ? 'Esta vez no salió'
    : r.seconds !== undefined
      ? `Superado en ${formatTime(r.seconds)}`
      : 'Superado';
  return { kicker: 'RETO DEL DÍA', title: gameName(game), subtitle: `${dateLabel()} · ${result}`, badge: { game } };
}

/** Every daily challenge done today. */
export function dailyDayCard(log: DailyLog): ShareCardData {
  const today = Object.values(log[dateKey()] ?? {});
  const won = today.filter((r) => r.won).length;
  const days = streak(log);
  return {
    kicker: 'RETO DEL DÍA',
    title: `${won} ${won === 1 ? 'reto superado' : 'retos superados'}`,
    subtitle: [dateLabel(), days > 1 && `${days} días seguidos`].filter(Boolean).join(' · '),
    badge: { count: `${won}/${ALL_GAMES.length}` },
  };
}
