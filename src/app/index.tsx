import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { type DailyLog, dateKey, loadDaily, streak } from '@/daily';
import { loadStats, type Stats } from '@/storage';
import { colors, radius } from '@/theme';

const GAMES = [
  { id: 'sudoku', href: '/sudoku', emoji: '🔢', name: 'Sudoku', desc: 'Rellena la cuadrícula 9×9 sin repetir números.', color: '#DBE4FF' },
  { id: 'palabra', href: '/palabra', emoji: '🔤', name: 'Palabra oculta', desc: 'Adivina la palabra de 5 letras en 6 intentos.', color: '#D3F9D8' },
  { id: 'reinas', href: '/reinas', emoji: '👑', name: 'Reinas', desc: 'Una reina por fila, columna y color. Sin tocarse.', color: '#FFE8CC' },
  { id: 'crucigrama', href: '/crucigrama', emoji: '✏️', name: 'Crucigrama', desc: 'Completa las palabras a partir de sus pistas.', color: '#F3D9FA' },
  { id: 'binario', href: '/binario', emoji: '☀️', name: 'Binario', desc: 'Soles y lunas a partes iguales, nunca tres seguidos.', color: '#FFF3BF' },
  { id: 'buscaminas', href: '/buscaminas', emoji: '💣', name: 'Buscaminas', desc: 'Despeja el campo sin pisar ninguna mina.', color: '#E9ECEF' },
  { id: 'nonograma', href: '/nonograma', emoji: '🖼️', name: 'Nonograma', desc: 'Pinta casillas según los números y descubre el dibujo.', color: '#C5F6FA' },
  { id: 'sopa', href: '/sopa', emoji: '🔍', name: 'Sopa de letras', desc: 'Encuentra todas las palabras escondidas.', color: '#FFDEEB' },
] as const;

// Games that can be lost show "won of played"; the rest only count solved puzzles.
const CAN_LOSE = new Set<string>(['palabra', 'buscaminas']);

/** Adds up the stats of every variant of a game (e.g. "sudoku:facil", "sudoku:medio"). */
function total(all: Record<string, Stats>, id: string) {
  return Object.entries(all)
    .filter(([key]) => key === id || key.startsWith(`${id}:`))
    .reduce((sum, [, s]) => ({ played: sum.played + s.played, won: sum.won + s.won }), { played: 0, won: 0 });
}

export default function Home() {
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [daily, setDaily] = useState<DailyLog>({});

  useFocusEffect(
    useCallback(() => {
      loadStats().then(setStats);
      loadDaily().then(setDaily);
    }, []),
  );

  const today = daily[dateKey()] ?? {};
  const doneToday = Object.keys(today).length;
  const days = streak(daily);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.daily}>
        <View style={styles.dailyHeader}>
          <Text style={styles.dailyTitle}>📅 Reto del día</Text>
          <Text style={styles.dailyMeta}>
            {doneToday}/{GAMES.length}
            {days > 0 && ` · 🔥 ${days} ${days === 1 ? 'día' : 'días'}`}
          </Text>
        </View>
        <Text style={styles.dailyText}>El mismo tablero para todo el mundo. Cambia cada día a medianoche.</Text>
        <View style={styles.dailyGrid}>
          {GAMES.map((g) => {
            const result = today[g.id];
            return (
              <Pressable
                key={g.id}
                onPress={() => router.push({ pathname: g.href, params: { reto: '1' } })}
                style={({ pressed }) => [
                  styles.dailyGame,
                  result && { backgroundColor: result.won ? colors.successSoft : colors.dangerSoft },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.emoji}>{g.emoji}</Text>
                <Text style={styles.dailyBadge}>{result ? (result.won ? '✅' : '❌') : ' '}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.subtitle}>Partida libre</Text>
      {GAMES.map((g) => {
        const t = total(stats, g.id);
        return (
          <Pressable
            key={g.href}
            onPress={() => router.push(g.href)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
          >
            <View style={[styles.icon, { backgroundColor: g.color }]}>
              <Text style={styles.emoji}>{g.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{g.name}</Text>
              <Text style={styles.desc}>{g.desc}</Text>
              {t.played > 0 && (
                <Text style={styles.stats}>
                  {CAN_LOSE.has(g.id) ? `✅ ${t.won} de ${t.played} ganadas` : `✅ ${t.won} resueltos`}
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  subtitle: { fontSize: 16, color: colors.muted, marginBottom: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: { width: 56, height: 56, borderRadius: radius, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 28 },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  desc: { fontSize: 14, color: colors.muted, marginTop: 2 },
  stats: { fontSize: 13, color: colors.success, fontWeight: '600', marginTop: 4 },
  daily: { backgroundColor: '#FFF3BF', borderRadius: radius, padding: 14, gap: 8, marginBottom: 8 },
  dailyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dailyTitle: { fontSize: 18, fontWeight: '800', color: '#8F6400' },
  dailyMeta: { fontSize: 15, fontWeight: '700', color: '#8F6400' },
  dailyText: { fontSize: 13, color: '#8F6400' },
  dailyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dailyGame: {
    width: '22%',
    flexGrow: 1,
    aspectRatio: 1.2,
    backgroundColor: colors.card,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyBadge: { fontSize: 12, marginTop: 2 },
});
