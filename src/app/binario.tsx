import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Banner, Button, DailyHeader, formatTime } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { conflicts, generate, type Grid } from '@/games/binario';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors } from '@/theme';

const SIZES = [6, 8];
const SYMBOLS = ['', '☀️', '🌙'];

export default function BinarioScreen() {
  const { width } = useWindowDimensions();
  const [n, setN] = useState(6);
  const { daily, date, seed, saveKey } = useDaily('binario');
  const [game, setGame] = useState(() => (daily ? withSeed(seed, () => generate(6)) : generate(6)));
  const [board, setBoard] = useState<Grid>(game.puzzle);
  const [finished, setFinished] = useState(false);
  const size = Math.min(width - 32, 420);
  const cell = size / n;

  const bad = useMemo(() => conflicts(board, n), [board, n]);
  const solved = board.every((v, i) => v === game.solution[i]);
  const [seconds, setSeconds] = useTimer(!solved);
  const stats = useStats(`binario:${n}`, finished);

  const loaded = useAutosave(saveKey, { date, n, game, board, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setN(s.n);
    setGame(s.game);
    setBoard(s.board);
    setSeconds(s.seconds);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !solved || finished) return;
    setFinished(true);
    recordResult(`binario:${n}`, true, seconds);
    if (daily) recordDaily('binario', true, seconds);
  }, [loaded, solved, finished, n, seconds, daily]);

  function newGame(size: number) {
    const g = generate(size);
    setN(size);
    setGame(g);
    setBoard(g.puzzle);
    setSeconds(0);
    setFinished(false);
  }

  function tap(i: number) {
    if (solved || game.puzzle[i]) return;
    setBoard((prev) => prev.map((v, j) => (j === i ? (v + 1) % 3 : v)));
  }

  if (!loaded) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {daily ? (
        <DailyHeader />
      ) : (
        <View style={styles.row}>
          {SIZES.map((s) => (
            <Button
              key={s}
              label={`${s}×${s}`}
              variant={s === n ? 'primary' : 'secondary'}
              onPress={() => newGame(s)}
              style={{ flex: 1 }}
            />
          ))}
        </View>
      )}
      <Text style={styles.help}>
        Rellena con ☀️ y 🌙: la misma cantidad de cada uno por fila y columna, nunca tres iguales seguidos y sin
        filas ni columnas repetidas.
      </Text>
      <Text style={styles.timer}>
        ⏱ {formatTime(seconds)}
        {stats?.best !== undefined && ` · 🏆 ${formatTime(stats.best)}`}
      </Text>

      <View style={[styles.grid, { width: size, height: size }]}>
        {board.map((v, i) => (
          <Pressable
            key={i}
            onPress={() => tap(i)}
            style={[
              styles.cell,
              { width: cell, height: cell },
              game.puzzle[i] !== 0 && { backgroundColor: '#ECEAE4' },
              bad.has(i) && { backgroundColor: colors.dangerSoft },
            ]}
          >
            <Text style={{ fontSize: cell * 0.5 }}>{SYMBOLS[v]}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ width: size, gap: 10 }}>
        {solved && <Banner text={`¡Resuelto en ${formatTime(seconds)}! 🎉`} />}
        {solved ? (
          daily ? (
            <Button label="Jugar partida libre" onPress={() => router.replace('/binario')} />
          ) : (
            <Button label="Nuevo tablero" onPress={() => newGame(n)} />
          )
        ) : (
          <Button label="Vaciar tablero" variant="secondary" onPress={() => setBoard(game.puzzle)} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 6, maxWidth: 420, width: '100%' },
  help: { fontSize: 14, color: colors.muted, textAlign: 'center', maxWidth: 420 },
  timer: { fontSize: 16, color: colors.muted, fontVariant: ['tabular-nums'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.card },
  cell: { alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: colors.border },
});
