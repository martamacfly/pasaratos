import { useFocusEffect } from 'expo-router';
import { type ReactNode, useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { longestStreak } from '@/achievements';
import { Text } from '@/components/AppText';
import { GameIcon } from '@/components/icons';
import { formatTime } from '@/components/ui';
import { dateKey, type DailyLog, loadDaily, streak } from '@/daily';
import { ALL_GAMES, CAN_LOSE, gameName } from '@/games/catalog';
import { useGameTheme } from '@/gameTheme';
import { useWindowSize } from '@/hooks/useWindowSize';
import { LEVEL_COUNT, load as loadLevels, type Progress } from '@/levels';
import { loadStats, type Stats } from '@/storage';
import { colors, radius } from '@/theme';

type Data = { stats: Record<string, Stats>; daily: DailyLog; levels: Progress };

const WEEKS = 6; // weeks shown in the daily challenge calendar
const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const VARIANT_NAMES: Record<string, string> = {
  facil: 'Fácil',
  normal: 'Normal',
  medio: 'Medio',
  dificil: 'Difícil',
  experto: 'Experto',
};

/** "facil" -> "Fácil", "7" -> "7×7". */
const variantName = (v: string) => VARIANT_NAMES[v] ?? (/^\d+$/.test(v) ? `${v}×${v}` : v);

/** Stats and levels keys look like "sudoku:facil", or just "palabra" for games without variants. */
const split = (key: string) => {
  const [game, variant = ''] = key.split(':');
  return { game, variant };
};

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
}

export default function EstadisticasScreen() {
  const { width } = useWindowSize();
  const theme = useGameTheme();
  const [data, setData] = useState<Data | null>(null);

  // Reloaded every time the screen is shown, since games played meanwhile change everything.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([loadStats(), loadDaily(), loadLevels()]).then(
        ([stats, daily, levels]) => alive && setData({ stats, daily, levels }),
      );
      return () => {
        alive = false;
      };
    }, []),
  );

  const content = Math.max(Math.min(width, 980) - 32, 280);
  const columns = content < 560 ? 1 : content < 860 ? 2 : 3;
  const cardWidth = (content - (columns - 1) * 12) / columns;
  if (!data) return <View style={styles.container} />;

  const { stats, daily, levels } = data;
  const entries = Object.entries(stats);
  const solved = entries.reduce((sum, [, s]) => sum + s.won, 0);
  const time = entries.reduce((sum, [, s]) => sum + (s.time ?? 0), 0);
  const levelsDone = Object.values(levels).reduce((sum, l) => sum + l.length, 0);
  const playedBy = (game: string) =>
    entries.filter(([k]) => split(k).game === game).reduce((sum, [, s]) => sum + s.played, 0);
  const favorite = [...ALL_GAMES].sort((a, b) => playedBy(b.id) - playedBy(a.id))[0];
  const dailyWins = Object.values(daily).reduce((sum, day) => sum + Object.values(day).filter((r) => r.won).length, 0);
  const palabra = stats.palabra;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{ width: content, gap: 22 }}>
        <View style={styles.tiles}>
          <Tile value={String(solved)} label="partidas resueltas" />
          <Tile value={time ? formatDuration(time) : '—'} label="jugando con reloj" />
          <Tile value={String(levelsDone)} label="niveles completados" />
          <Tile value={playedBy(favorite.id) ? favorite.name : '—'} label="juego favorito" small />
        </View>

        <Section title="Reto del día">
          <View style={styles.row}>
            <Figure value={streak(daily)} label="racha actual" />
            <Figure value={longestStreak(daily)} label="mejor racha" />
            <Figure value={dailyWins} label="retos ganados" />
          </View>
          <Calendar daily={daily} color={theme.main} />
        </Section>

        {palabra?.dist && (
          <Section title="Palabra oculta · intentos">
            <Distribution stats={palabra} color={theme.main} />
          </Section>
        )}

        <Section title="Por juego">
          <View style={styles.grid}>
            {ALL_GAMES.map((g) => (
              <GameCard key={g.id} game={g.id} data={data} width={cardWidth} />
            ))}
          </View>
        </Section>
        <Text style={styles.footnote}>
          El tiempo jugado y los intentos de Palabra oculta se cuentan desde que se añadieron las estadísticas.
        </Text>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function Tile({ value, label, small }: { value: string; label: string; small?: boolean }) {
  const theme = useGameTheme();
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileValue, { color: theme.main }, small && { fontSize: 20 }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function Figure({ value, label }: { value: number; label: string }) {
  const theme = useGameTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[styles.figure, { color: theme.main }]}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

/** The last weeks, Monday to Sunday, each day coloured by how many challenges were won. */
function Calendar({ daily, color }: { daily: DailyLog; color: string }) {
  const today = new Date();
  // Monday of the first week shown.
  const start = new Date(today);
  start.setDate(today.getDate() - ((today.getDay() + 6) % 7) - (WEEKS - 1) * 7);
  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      return day;
    }),
  );
  const wins = (d: Date) => Object.values(daily[dateKey(d)] ?? {}).filter((r) => r.won).length;
  // 0, 1-2, 3-5, 6-9, 10+ challenges won.
  const level = (n: number) => (n === 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : n <= 9 ? 3 : 4);
  const OPACITY = [0, 0.3, 0.55, 0.8, 1];

  return (
    <View style={[styles.card, styles.calendar]}>
      <View style={styles.calendarRow}>
        {DAY_LETTERS.map((l) => (
          <Text key={l} style={styles.dayLetter}>
            {l}
          </Text>
        ))}
      </View>
      {weeks.map((week, w) => (
        <View key={w} style={styles.calendarRow}>
          {week.map((day) => {
            const future = day > today;
            const n = wins(day);
            return (
              <View key={dateKey(day)} style={[styles.day, future && { opacity: 0.3 }]}>
                {n > 0 && <View style={[styles.dayFill, { backgroundColor: color, opacity: OPACITY[level(n)] }]} />}
                <Text style={[styles.dayNumber, level(n) >= 3 && { color: '#fff' }]}>{day.getDate()}</Text>
              </View>
            );
          })}
        </View>
      ))}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Retos ganados: menos</Text>
        {OPACITY.map((o, k) => (
          <View key={k} style={[styles.legendBox, { backgroundColor: k ? color : colors.bg, opacity: k ? o : 1 }]} />
        ))}
        <Text style={styles.legendText}>más</Text>
      </View>
    </View>
  );
}

/** Bars with how many words were guessed at each attempt. */
function Distribution({ stats, color }: { stats: Stats; color: string }) {
  const dist = Array.from({ length: Math.max(6, stats.dist?.length ?? 0) }, (_, k) => stats.dist?.[k] ?? 0);
  const max = Math.max(...dist, 1);
  const lost = stats.played - stats.won;
  return (
    <View style={[styles.card, { gap: 6 }]}>
      {dist.map((n, k) => (
        <View key={k} style={styles.barRow}>
          <Text style={styles.barLabel}>{k + 1}</Text>
          <View style={{ flex: 1 }}>
            <View
              style={[
                styles.bar,
                { width: `${Math.max((n / max) * 100, 8)}%`, backgroundColor: n ? color : colors.border },
              ]}
            >
              <Text style={styles.barValue}>{n}</Text>
            </View>
          </View>
        </View>
      ))}
      {lost > 0 && <Text style={styles.tileLabel}>Sin acertar: {lost}</Text>}
    </View>
  );
}

function GameCard({ game, data, width }: { game: string; data: Data; width: number }) {
  const theme = useGameTheme();
  const mine = (record: Record<string, unknown>) => Object.keys(record).filter((k) => split(k).game === game);
  const statKeys = mine(data.stats);
  const levelKeys = mine(data.levels);
  // Some games keep their stats without a variant ("palabra") but their levels with one ("palabra:normal"):
  // the bare key only gets its own row when there is nothing else to show.
  const named = [...new Set([...statKeys, ...levelKeys].map((k) => split(k).variant).filter(Boolean))];
  const variants = named.length ? named : statKeys.length || levelKeys.length ? [''] : [];
  const played = statKeys.reduce((sum, k) => sum + data.stats[k].played, 0);
  const won = statKeys.reduce((sum, k) => sum + data.stats[k].won, 0);

  return (
    <View style={[styles.card, styles.gameCard, { width }]}>
      <View style={styles.gameHead}>
        <GameIcon id={game} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={styles.gameName}>{gameName(game)}</Text>
          <Text style={styles.tileLabel}>
            {played === 0
              ? 'Sin jugar todavía'
              : CAN_LOSE.has(game)
                ? `Ganadas ${won} de ${played} · ${Math.round((won / played) * 100)} %`
                : `${won} resueltas`}
          </Text>
        </View>
      </View>
      {variants.map((v) => {
        const s = data.stats[v ? `${game}:${v}` : game];
        const done = data.levels[v ? `${game}:${v}` : game]?.length ?? 0;
        return (
          <View key={v} style={styles.variant}>
            <Text style={styles.variantName}>{v ? variantName(v) : 'Niveles'}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${(done / LEVEL_COUNT) * 100}%`, backgroundColor: theme.main }]} />
            </View>
            <Text style={styles.variantInfo}>
              {done}/{LEVEL_COUNT}
              {s?.best !== undefined && ` · ${formatTime(s.best)}`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const shadow = {
  shadowColor: '#1B2559',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, alignItems: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.muted, letterSpacing: 1.2, marginLeft: 4 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    flexGrow: 1,
    flexBasis: 140,
    backgroundColor: colors.card,
    borderRadius: radius * 1.5,
    padding: 16,
    gap: 2,
    ...shadow,
  },
  tileValue: { fontSize: 28, fontWeight: '900' },
  tileLabel: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  figure: { fontSize: 30, fontWeight: '900' },
  row: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius * 1.5, padding: 14, ...shadow },
  card: { backgroundColor: colors.card, borderRadius: radius * 1.5, padding: 16, gap: 4, ...shadow },
  calendar: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  calendarRow: { flexDirection: 'row', gap: 4 },
  dayLetter: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '800', color: colors.muted },
  day: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dayFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  dayNumber: { fontSize: 13, fontWeight: '700', color: colors.text },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 6 },
  legendText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  legendBox: { width: 14, height: 14, borderRadius: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 14, fontSize: 14, fontWeight: '800', color: colors.text, textAlign: 'center' },
  bar: { height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 8 },
  barValue: { fontSize: 13, fontWeight: '800', color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gameCard: { gap: 8 },
  gameHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gameName: { fontSize: 16, fontWeight: '800', color: colors.text },
  variant: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  variantName: { width: 62, fontSize: 13, fontWeight: '700', color: colors.text },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.bg, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  variantInfo: { minWidth: 76, fontSize: 12, fontWeight: '700', color: colors.muted, textAlign: 'right' },
  footnote: { fontSize: 12, color: colors.muted, textAlign: 'center' },
});
