import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Banner, Button, DailyHeader, formatTime, NumberPad } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { cageConflicts, generate } from '@/games/calcudoku';
import { latinConflicts } from '@/games/latin';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors } from '@/theme';

const SIZES = [4, 5, 6, 7];

export default function CalcudokuScreen() {
  const { width } = useWindowDimensions();
  const { daily, date, seed, saveKey } = useDaily('calcudoku');
  const [puzzle, setPuzzle] = useState(() => (daily ? withSeed(seed, () => generate(5)) : generate(4)));
  const { n, cages, solution } = puzzle;
  const [board, setBoard] = useState<number[]>(() => Array(n * n).fill(0));
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const boardSize = Math.min(width - 32, 420);
  const cell = boardSize / n;

  const cageOf = useMemo(() => {
    const owner = Array(n * n).fill(0);
    cages.forEach((c, k) => c.cells.forEach((i) => (owner[i] = k)));
    return owner;
  }, [cages, n]);
  const bad = useMemo(() => new Set([...latinConflicts(board, n), ...cageConflicts(board, cages)]), [board, n, cages]);
  const solved = board.every((v, i) => v === solution[i]);
  const [seconds, setSeconds] = useTimer(!solved);
  const stats = useStats(`calcudoku:${n}`, finished);

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
    recordResult(`calcudoku:${n}`, true, seconds);
    if (daily) recordDaily('calcudoku', true, seconds);
  }, [loaded, solved, finished, n, seconds, daily]);

  function newGame(size: number) {
    setPuzzle(generate(size));
    setBoard(Array(size * size).fill(0));
    setSelected(null);
    setSeconds(0);
    setFinished(false);
  }

  function input(v: number) {
    if (selected === null || solved) return;
    setBoard((prev) => prev.map((x, i) => (i === selected ? v : x)));
  }

  if (!loaded) return null;

  // Each cage shows its target on its top-left cell.
  const labelAt = new Map(cages.map((c) => [Math.min(...c.cells), `${c.target}${c.op}`]));
  // Neighbouring cells both draw their shared border, so cage edges use half the width on each side;
  // lines inside a cage are thin and light so the cages stand out.
  const edge = (i: number, j: number, inside: boolean) => {
    const cage = !inside || cageOf[i] !== cageOf[j];
    return { width: !inside ? 2.5 : cage ? 1.5 : 0.5, color: cage ? colors.text : '#D6D3CC' };
  };
  const borders = (i: number, r: number, c: number) => {
    const t = edge(i, i - n, r > 0);
    const b = edge(i, i + n, r < n - 1);
    const l = edge(i, i - 1, c > 0);
    const rt = edge(i, i + 1, c < n - 1);
    return {
      borderTopWidth: t.width,
      borderTopColor: t.color,
      borderBottomWidth: b.width,
      borderBottomColor: b.color,
      borderLeftWidth: l.width,
      borderLeftColor: l.color,
      borderRightWidth: rt.width,
      borderRightColor: rt.color,
    };
  };

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
        Números del 1 al {n} sin repetir en filas ni columnas. Cada zona marcada debe dar su resultado con la
        operación indicada.
      </Text>
      <Text style={styles.timer}>
        ⏱ {formatTime(seconds)}
        {stats?.best !== undefined && ` · 🏆 ${formatTime(stats.best)}`}
      </Text>

      <View style={{ width: boardSize, height: boardSize, flexDirection: 'row', flexWrap: 'wrap' }}>
        {board.map((v, i) => {
          const r = Math.floor(i / n);
          const c = i % n;
          return (
            <Pressable
              key={i}
              onPress={() => setSelected(i)}
              style={[
                styles.cell,
                { width: cell, height: cell, ...borders(i, r, c) },
                i === selected && { backgroundColor: '#BAC8FF' },
              ]}
            >
              {labelAt.has(i) && <Text style={[styles.label, { fontSize: Math.min(cell * 0.2, 15) }]}>{labelAt.get(i)}</Text>}
              <Text style={{ fontSize: cell * 0.45, fontWeight: '600', color: bad.has(i) ? colors.danger : colors.accent }}>
                {v || ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ width: boardSize, gap: 10 }}>
        {solved && <Banner text={`¡Resuelto en ${formatTime(seconds)}! 🎉`} />}
        {solved ? (
          daily ? (
            <Button label="Jugar partida libre" onPress={() => router.replace('/calcudoku')} />
          ) : (
            <Button label="Nuevo tablero" onPress={() => newGame(n)} />
          )
        ) : (
          <NumberPad max={n} onPress={input} width={boardSize} />
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
  cell: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  label: { position: 'absolute', top: 2, left: 4, fontWeight: '700', color: colors.text },
});
