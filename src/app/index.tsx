import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { useWindowSize } from '@/hooks/useWindowSize';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { CheckGlyph, CrossGlyph, GameIcon, Glyph, MedalGlyph } from '@/components/icons';
import { loadAchievements } from '@/achievements';
import { ShareButton } from '@/components/ui';
import { type DailyLog, dateKey, dateLabel, loadDaily, shareText, streak } from '@/daily';
import { ALL_GAMES, CAN_LOSE, SECTIONS } from '@/games/catalog';
import { loadStats, type Stats } from '@/storage';
import { colors, radius } from '@/theme';

const MAX_WIDTH = 1240;

/** Adds up the stats of every variant of a game (e.g. "sudoku:facil", "sudoku:medio"). */
function total(all: Record<string, Stats>, id: string) {
  return Object.entries(all)
    .filter(([key]) => key === id || key.startsWith(`${id}:`))
    .reduce((sum, [, s]) => ({ played: sum.played + s.played, won: sum.won + s.won }), { played: 0, won: 0 });
}

export default function Home() {
  const { width } = useWindowSize();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [daily, setDaily] = useState<DailyLog>({});
  const [medals, setMedals] = useState({ unlocked: 0, total: 0 });

  useFocusEffect(
    useCallback(() => {
      loadStats().then(setStats);
      loadDaily().then(setDaily);
      loadAchievements().then((list) =>
        setMedals({ unlocked: list.filter((a) => a.unlocked).length, total: list.length }),
      );
    }, []),
  );

  const today = daily[dateKey()] ?? {};
  const doneToday = Object.keys(today).length;
  const days = streak(daily);

  // The web build's pre-rendered page starts with width 0, so keep sizes from going negative.
  const content = Math.max(Math.min(width, MAX_WIDTH) - 32, 280);
  const columns = content < 560 ? 2 : content < 820 ? 3 : content < 1100 ? 4 : 5;
  const cardWidth = (content - (columns - 1) * 12) / columns;
  // Six icons per row on phones; on wider screens a fixed size and as many per row as fit.
  const dailySize = content < 560 ? (content - 28 - 5 * 8) / 6 : 64;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
        <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#5C7CFA" />
              <Stop offset="1" stopColor="#364FC7" />
            </LinearGradient>
          </Defs>
          <Rect width="100" height="100" fill="url(#hero)" />
        </Svg>
        <View style={[styles.inner, { width: content }]}>
          <View style={styles.brand}>
            <Image source={require('../../assets/icon.png')} style={styles.logo} />
            <View>
              <Text style={styles.title}>Pasaratos</Text>
              <Text style={styles.tagline}>Pasatiempos para cada rato</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/logros')}
            style={({ pressed }) => [styles.medals, pressed && { opacity: 0.8 }]}
          >
            <Glyph size={26}>
              <MedalGlyph ink="#F2B705" />
            </Glyph>
            <Text style={styles.medalsText}>
              {medals.unlocked}/{medals.total}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.inner, { width: content, marginTop: -56 }]}>
        <View style={styles.dailyCard}>
          <View style={styles.dailyTop}>
            <View>
              <Text style={styles.dailyTitle}>Reto del día</Text>
              <Text style={styles.dailyDate}>{dateLabel()}</Text>
            </View>
            {days > 0 && (
              <View style={styles.streak}>
                <Text style={styles.streakNumber}>{days}</Text>
                <Text style={styles.streakLabel}>{days === 1 ? 'día\nseguido' : 'días\nseguidos'}</Text>
              </View>
            )}
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(doneToday / ALL_GAMES.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {doneToday === ALL_GAMES.length
              ? '¡Todos los retos de hoy completados!'
              : `${doneToday} de ${ALL_GAMES.length} completados · el mismo tablero para todo el mundo`}
          </Text>
          <View style={styles.dailyGrid}>
            {ALL_GAMES.map((g) => {
              const result = today[g.id];
              return (
                <Pressable
                  key={g.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Reto del día: ${g.name}`}
                  onPress={() => router.push({ pathname: g.href as '/sudoku', params: { reto: '1' } })}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : result ? 0.55 : 1 }]}
                >
                  <GameIcon id={g.id} size={dailySize} />
                  {result && (
                    <View style={[styles.badge, { backgroundColor: result.won ? colors.success : colors.danger }]}>
                      <Glyph size={14}>{result.won ? <CheckGlyph ink="#fff" /> : <CrossGlyph ink="#fff" />}</Glyph>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
          {doneToday > 0 && <ShareButton text={shareText(daily)} label="Compartir mi día" />}
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} style={{ marginTop: 28 }}>
            <Text style={styles.section}>{section.title}</Text>
            <View style={styles.cards}>
              {section.games.map((g) => {
                const t = total(stats, g.id);
                return (
                  <Pressable
                    key={g.id}
                    accessibilityRole="button"
                    onPress={() => router.push(g.href as '/sudoku')}
                    style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && styles.cardPressed]}
                  >
                    <GameIcon id={g.id} size={52} />
                    <Text style={styles.name}>{g.name}</Text>
                    <Text style={styles.desc} numberOfLines={3}>
                      {g.desc}
                    </Text>
                    {t.played > 0 && (
                      <Text style={styles.stats}>
                        {CAN_LOSE.has(g.id) ? `${t.won} de ${t.played} ganadas` : `${t.won} resueltos`}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingBottom: 80, alignItems: 'center', overflow: 'hidden' },
  inner: { alignSelf: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  medals: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  medalsText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  logo: { width: 60, height: 60, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  dailyCard: {
    backgroundColor: colors.card,
    borderRadius: radius * 1.5,
    padding: 14,
    gap: 10,
    shadowColor: '#1B2559',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  dailyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dailyTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  dailyDate: { fontSize: 14, color: colors.muted, marginTop: 2 },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF4E6',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  streakNumber: { fontSize: 24, fontWeight: '900', color: '#E8590C' },
  streakLabel: { fontSize: 11, lineHeight: 13, fontWeight: '700', color: '#E8590C' },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#EDF2FF', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.accent },
  progressText: { fontSize: 13, color: colors.muted },
  dailyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  badge: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  section: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius * 1.25,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#ECE9E2',
    shadowColor: '#1B2559',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardPressed: { transform: [{ scale: 0.97 }], opacity: 0.85 },
  name: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 4 },
  desc: { fontSize: 13, lineHeight: 18, color: colors.muted },
  stats: { fontSize: 12, color: colors.success, fontWeight: '700', marginTop: 2 },
});
