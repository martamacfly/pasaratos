import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Banner, Button, DailyHeader, formatTime } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { type CellState, conflicts, generate } from '@/games/reinas';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors } from '@/theme';

const SIZES = [6, 7, 8];
const REGION_COLORS = ['#FFC9C9', '#FFD8A8', '#FFEC99', '#C0EB75', '#96F2D7', '#A5D8FF', '#D0BFFF', '#FCC2D7', '#CED4DA'];

const emptyBoard = (n: number): CellState[][] => Array.from({ length: n }, () => Array(n).fill(0));

export default function ReinasScreen() {
  const { width } = useWindowDimensions();
  const { daily, date, seed, saveKey } = useDaily('reinas');
  const [puzzle, setPuzzle] = useState(() => (daily ? withSeed(seed, () => generate(7)) : generate(7)));
  const [board, setBoard] = useState(() => emptyBoard(7));
  const { n, regions } = puzzle;
  const size = Math.min(width - 32, 460);
  const cell = size / n;

  const bad = useMemo(() => conflicts(board, regions), [board, regions]);
  const queens = board.flat().filter((s) => s === 2).length;
  const solved = queens === n && bad.size === 0;
  const [seconds, setSeconds] = useTimer(!solved);
  const [finished, setFinished] = useState(false);
  const stats = useStats(`reinas:${n}`, finished);

  const loaded = useAutosave(saveKey, { date, puzzle, board, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setPuzzle(s.puzzle);
    setBoard(s.board);
    setSeconds(s.seconds);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !solved || finished) return;
    setFinished(true);
    recordResult(`reinas:${n}`, true, seconds);
    if (daily) recordDaily('reinas', true, seconds);
  }, [loaded, solved, finished, n, seconds, daily]);

  function newGame(size: number) {
    setPuzzle(generate(size));
    setBoard(emptyBoard(size));
    setSeconds(0);
    setFinished(false);
  }

  if (!loaded) return null;

  function tap(r: number, c: number) {
    if (solved) return;
    setBoard((prev) =>
      prev.map((row, i) => row.map((s, j) => (i === r && j === c ? (((s + 1) % 3) as CellState) : s))),
    );
  }

  // Border between two cells is thick when they belong to different regions.
  const edge = (r: number, c: number, r2: number, c2: number) =>
    r2 < 0 || c2 < 0 || r2 >= n || c2 >= n || regions[r][c] !== regions[r2][c2] ? 2 : 0.5;

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
        Coloca {n} reinas: una por fila, columna y color. Dos reinas no pueden tocarse, ni en diagonal.
        Toca una vez para marcar ✕ y otra para poner 👑.
      </Text>
      <Text style={styles.timer}>
        ⏱ {formatTime(seconds)} · 👑 {queens}/{n}
        {stats?.best !== undefined && ` · 🏆 ${formatTime(stats.best)}`}
      </Text>

      <View style={{ width: size, height: size, flexDirection: 'row', flexWrap: 'wrap' }}>
        {board.map((row, r) =>
          row.map((s, c) => (
            <Pressable
              key={`${r},${c}`}
              onPress={() => tap(r, c)}
              style={[
                styles.cell,
                {
                  width: cell,
                  height: cell,
                  backgroundColor: s === 2 && bad.has(`${r},${c}`) ? colors.danger : REGION_COLORS[regions[r][c]],
                  borderTopWidth: edge(r, c, r - 1, c),
                  borderBottomWidth: edge(r, c, r + 1, c),
                  borderLeftWidth: edge(r, c, r, c - 1),
                  borderRightWidth: edge(r, c, r, c + 1),
                },
              ]}
            >
              {s === 1 && <Text style={{ fontSize: cell * 0.35, color: '#495057' }}>✕</Text>}
              {s === 2 && <Text style={{ fontSize: cell * 0.55 }}>👑</Text>}
            </Pressable>
          )),
        )}
      </View>

      <View style={{ width: size, gap: 10 }}>
        {solved && <Banner text={`¡Resuelto en ${formatTime(seconds)}! 🎉`} />}
        {solved ? (
          daily ? (
            <Button label="Jugar partida libre" onPress={() => router.replace('/reinas')} />
          ) : (
            <Button label="Nuevo tablero" onPress={() => newGame(n)} />
          )
        ) : (
          <Button label="Vaciar tablero" variant="secondary" onPress={() => setBoard(emptyBoard(n))} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 6, maxWidth: 460, width: '100%' },
  help: { fontSize: 14, color: colors.muted, textAlign: 'center', maxWidth: 460 },
  timer: { fontSize: 16, color: colors.muted, fontVariant: ['tabular-nums'] },
  cell: { alignItems: 'center', justifyContent: 'center', borderColor: '#212529' },
});
