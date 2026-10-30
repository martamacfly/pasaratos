import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Banner, Button, DailyHeader, formatTime } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { useGameTheme } from '@/gameTheme';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { clues, generate, runs } from '@/games/nonograma';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors } from '@/theme';

const SIZES = [5, 8, 10, 12];
type Mark = 0 | 1 | 2; // empty, filled, crossed

export default function NonogramaScreen() {
  const { width } = useWindowDimensions();
  const theme = useGameTheme();
  const { daily, date, seed, saveKey } = useDaily('nonograma');
  const [n, setN] = useState(daily ? 10 : 5);
  const [picture, setPicture] = useState(() => (daily ? withSeed(seed, () => generate(10)) : generate(5)));
  const [marks, setMarks] = useState<Mark[]>(() => Array(daily ? 100 : 25).fill(0));
  const [crossMode, setCrossMode] = useState(false);
  const [finished, setFinished] = useState(false);

  const { rows, cols } = useMemo(() => clues(picture, n), [picture, n]);
  // Clue strips get room for the longest clue; cells share the remaining width.
  const clueSpace = n === 5 ? 56 : 84;
  const boardSize = Math.min(width - 32, 460);
  const cell = (boardSize - clueSpace) / n;

  const solved = rows.every((clue, r) => runs(marks.slice(r * n, r * n + n).map((m) => m === 1)).join() === clue.join()) &&
    cols.every((clue, c) => runs(Array.from({ length: n }, (_, r) => marks[r * n + c] === 1)).join() === clue.join());
  const [seconds, setSeconds] = useTimer(!solved);
  const stats = useStats(`nonograma:${n}`, finished);

  const loaded = useAutosave(saveKey, { date, n, picture, marks, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setN(s.n);
    setPicture(s.picture);
    setMarks(s.marks);
    setSeconds(s.seconds);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !solved || finished) return;
    setFinished(true);
    recordResult(`nonograma:${n}`, true, seconds);
    if (daily) recordDaily('nonograma', true, seconds);
  }, [loaded, solved, finished, n, seconds, daily]);

  function newGame(size: number) {
    setN(size);
    setPicture(generate(size));
    setMarks(Array(size * size).fill(0));
    setSeconds(0);
    setFinished(false);
  }

  function tap(i: number) {
    if (solved) return;
    const target: Mark = crossMode ? 2 : 1;
    setMarks((prev) => prev.map((m, j) => (j === i ? (m === target ? 0 : target) : m)));
  }

  if (!loaded) return null;

  // Thicker lines every 5 cells make 10×10 boards easier to count.
  const line = (k: number) => (k % 5 === 4 && k !== n - 1 ? 2 : 0.5);

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
        Los números indican los bloques de casillas pintadas seguidas en cada fila y columna, en orden.
      </Text>
      <Text style={styles.timer}>
        {formatTime(seconds)}
        {stats?.best !== undefined && ` · Récord ${formatTime(stats.best)}`}
      </Text>

      <View>
        <View style={{ flexDirection: 'row', marginLeft: clueSpace }}>
          {cols.map((clue, c) => (
            <View key={c} style={[styles.colClue, { width: cell, minHeight: clueSpace }]}>
              {clue.map((v, k) => (
                <Text key={k} style={[styles.clue, { fontSize: Math.min(cell * 0.45, 15) }]}>
                  {v}
                </Text>
              ))}
            </View>
          ))}
        </View>
        {rows.map((clue, r) => (
          <View key={r} style={{ flexDirection: 'row' }}>
            <View style={[styles.rowClue, { width: clueSpace, height: cell }]}>
              <Text style={[styles.clue, { fontSize: Math.min(cell * 0.45, 15) }]}>{clue.join(' ')}</Text>
            </View>
            {Array.from({ length: n }, (_, c) => {
              const i = r * n + c;
              return (
                <Pressable
                  key={c}
                  onPress={() => tap(i)}
                  style={[
                    styles.cell,
                    { width: cell, height: cell, borderRightWidth: line(c), borderBottomWidth: line(r) },
                    marks[i] === 1 && { backgroundColor: solved ? theme.main : colors.text },
                  ]}
                >
                  {marks[i] === 2 && <Text style={{ fontSize: cell * 0.45, color: colors.muted }}>✕</Text>}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={{ width: boardSize, gap: 10 }}>
        {solved && <Banner text={`¡Dibujo completo en ${formatTime(seconds)}!`} />}
        {solved ? (
          daily ? (
            <Button label="Jugar partida libre" onPress={() => router.replace('/nonograma')} />
          ) : (
            <Button label="Nuevo nonograma" onPress={() => newGame(n)} />
          )
        ) : (
          <View style={styles.row}>
            <Button
              label="⬛ Pintar"
              variant={crossMode ? 'secondary' : 'primary'}
              onPress={() => setCrossMode(false)}
              style={{ flex: 1 }}
            />
            <Button
              label="✕ Tachar"
              variant={crossMode ? 'primary' : 'secondary'}
              onPress={() => setCrossMode(true)}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 6, maxWidth: 460, width: '100%' },
  help: { fontSize: 14, color: colors.muted, textAlign: 'center', maxWidth: 460 },
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
  colClue: { justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 4 },
  rowClue: { justifyContent: 'center', alignItems: 'flex-end', paddingRight: 6 },
  clue: { fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderColor: colors.text,
    borderLeftWidth: 0.5,
    borderTopWidth: 0.5,
  },
});
