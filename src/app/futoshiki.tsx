import { router } from 'expo-router';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Banner, Button, DailyHeader, formatTime, NumberPad } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { useGameTheme } from '@/gameTheme';
import { generate, ineqConflicts } from '@/games/futoshiki';
import { latinConflicts } from '@/games/latin';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors, radius } from '@/theme';

type Level = 'facil' | 'medio' | 'dificil';
// 6×6 takes seconds to generate, so the hardest level is a 5×5 with the fewest signs possible.
const LEVELS: Record<Level, { n: number; extraSigns: number; label: string }> = {
  facil: { n: 4, extraSigns: 2, label: 'Fácil' },
  medio: { n: 5, extraSigns: 5, label: 'Medio' },
  dificil: { n: 5, extraSigns: 0, label: 'Difícil' },
};
const create = (l: Level) => generate(LEVELS[l].n, LEVELS[l].extraSigns);

export default function FutoshikiScreen() {
  const { width } = useWindowDimensions();
  const theme = useGameTheme();
  const { daily, date, seed, saveKey } = useDaily('futoshiki');
  const [level, setLevel] = useState<Level>(daily ? 'dificil' : 'medio');
  const [puzzle, setPuzzle] = useState(() => (daily ? withSeed(seed, () => create('dificil')) : create('medio')));
  const [board, setBoard] = useState<number[]>(puzzle.givens);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const { n, givens, ineqs, solution } = puzzle;

  // Cells and the gaps holding the < > signs share the width: n cells + (n-1) gaps of 45%.
  const boardSize = Math.min(width - 32, 420);
  const cell = boardSize / (n + (n - 1) * 0.45);
  const gap = cell * 0.45;

  const bad = useMemo(() => new Set([...latinConflicts(board, n), ...ineqConflicts(board, ineqs)]), [board, n, ineqs]);
  const solved = board.every((v, i) => v === solution[i]);
  const [seconds, setSeconds] = useTimer(!solved);
  const stats = useStats(`futoshiki:${level}`, finished);

  const loaded = useAutosave(saveKey, { date, level, puzzle, board, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setLevel(s.level ?? 'dificil');
    setPuzzle(s.puzzle);
    setBoard(s.board);
    setSeconds(s.seconds);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !solved || finished) return;
    setFinished(true);
    recordResult(`futoshiki:${level}`, true, seconds);
    if (daily) recordDaily('futoshiki', true, seconds);
  }, [loaded, solved, finished, level, seconds, daily]);

  function newGame(l: Level = level) {
    const p = create(l);
    setLevel(l);
    setPuzzle(p);
    setBoard(p.givens);
    setSelected(null);
    setSeconds(0);
    setFinished(false);
  }

  function input(v: number) {
    if (selected === null || givens[selected] || solved) return;
    setBoard((prev) => prev.map((x, i) => (i === selected ? v : x)));
  }

  if (!loaded) return null;

  const sign = (a: number, b: number, vertical: boolean) => {
    const q = ineqs.find((x) => (x.lo === a && x.hi === b) || (x.lo === b && x.hi === a));
    if (!q) return '';
    const firstSmaller = q.lo === a;
    return vertical ? (firstSmaller ? '∧' : '∨') : firstSmaller ? '<' : '>';
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {daily ? (
        <DailyHeader />
      ) : (
        <View style={styles.row}>
          {(Object.keys(LEVELS) as Level[]).map((l) => (
            <Button
              key={l}
              label={LEVELS[l].label}
              variant={l === level ? 'primary' : 'secondary'}
              onPress={() => newGame(l)}
              style={{ flex: 1 }}
            />
          ))}
        </View>
      )}
      <Text style={styles.help}>
        Rellena con números del 1 al {n} sin repetir en filas ni columnas, respetando los signos {'<'} y {'>'}.
      </Text>
      <Text style={styles.timer}>
        {formatTime(seconds)}
        {stats?.best !== undefined && ` · Récord ${formatTime(stats.best)}`}
      </Text>

      <View style={{ width: boardSize }}>
        {Array.from({ length: n }, (_, r) => (
          <Fragment key={r}>
            <View style={{ flexDirection: 'row' }}>
              {Array.from({ length: n }, (_, c) => {
                const i = r * n + c;
                return (
                  <Fragment key={c}>
                    <Pressable
                      onPress={() => setSelected(i)}
                      style={[
                        styles.cell,
                        { width: cell, height: cell },
                        givens[i] !== 0 && { backgroundColor: '#ECEAE4' },
                        i === selected && { backgroundColor: theme.main + '40', borderColor: theme.main },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: cell * 0.5,
                          fontWeight: givens[i] ? '800' : '600',
                          color: bad.has(i) && !givens[i] ? colors.danger : givens[i] ? colors.text : theme.main,
                        }}
                      >
                        {board[i] || ''}
                      </Text>
                    </Pressable>
                    {c < n - 1 && (
                      <View style={[styles.gap, { width: gap, height: cell }]}>
                        <Text style={[styles.sign, { fontSize: gap * 0.8 }]}>{sign(i, i + 1, false)}</Text>
                      </View>
                    )}
                  </Fragment>
                );
              })}
            </View>
            {r < n - 1 && (
              <View style={{ flexDirection: 'row' }}>
                {Array.from({ length: n }, (_, c) => (
                  <View key={c} style={[styles.gap, { width: cell + (c < n - 1 ? gap : 0), height: gap, paddingRight: c < n - 1 ? gap : 0 }]}>
                    <Text style={[styles.sign, { fontSize: gap * 0.8 }]}>{sign(r * n + c, (r + 1) * n + c, true)}</Text>
                  </View>
                ))}
              </View>
            )}
          </Fragment>
        ))}
      </View>

      <View style={{ width: boardSize, gap: 10 }}>
        {solved && <Banner text={`¡Resuelto en ${formatTime(seconds)}!`} />}
        {solved ? (
          daily ? (
            <Button label="Jugar partida libre" onPress={() => router.replace('/futoshiki')} />
          ) : (
            <Button label="Nuevo tablero" onPress={() => newGame()} />
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
  timer: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    backgroundColor: colors.card,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
    overflow: 'hidden',
  },
  cell: {
    backgroundColor: colors.card,
    borderRadius: radius / 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gap: { alignItems: 'center', justifyContent: 'center' },
  sign: { fontWeight: '800', color: '#E8590C' },
});
