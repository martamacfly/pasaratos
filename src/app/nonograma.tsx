import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { router } from 'expo-router';
import { BoardFrame } from '@/components/BoardFrame';
import { GameLayout, useGameSizes } from '@/components/GameLayout';
import { LevelBar } from '@/components/LevelBar';
import { Banner, Button, DailyHeader, formatTime, HintButton } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { useGameTheme } from '@/gameTheme';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { useUndo } from '@/hooks/useUndo';
import { clues, generate, runs } from '@/games/nonograma';
import { completeLevel, LEVEL_COUNT, levelSeed } from '@/levels';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors } from '@/theme';

const SIZES = [5, 8, 10, 12];
type Mark = 0 | 1 | 2; // empty, filled, crossed

export default function NonogramaScreen() {
  const theme = useGameTheme();
  const { daily, date, seed, saveKey } = useDaily('nonograma');
  const [stage, setStage] = useState(1);
  const [n, setN] = useState(daily ? 10 : 5);
  const [picture, setPicture] = useState(() =>
    daily ? withSeed(seed, () => generate(10)) : withSeed(levelSeed('nonograma', 5, 1), () => generate(5)),
  );
  const [marks, setMarks] = useState<Mark[]>(() => Array(daily ? 100 : 25).fill(0));
  const { undo, canUndo } = useUndo(marks, setMarks, picture);
  const [crossMode, setCrossMode] = useState(false);
  const [finished, setFinished] = useState(false);

  const { rows, cols } = useMemo(() => clues(picture, n), [picture, n]);
  // Clue strips get room for the longest clue; cells share the remaining width.
  const clueSpace = n === 5 ? 56 : 84;
  const { board: boardSize, panel } = useGameSizes(460);
  const cell = (boardSize - clueSpace) / n;

  const solved =
    rows.every((clue, r) => runs(marks.slice(r * n, r * n + n).map((m) => m === 1)).join() === clue.join()) &&
    cols.every((clue, c) => runs(Array.from({ length: n }, (_, r) => marks[r * n + c] === 1)).join() === clue.join());
  const [seconds, setSeconds] = useTimer(!solved);
  const stats = useStats(`nonograma:${n}`, finished);

  const loaded = useAutosave(saveKey, { date, stage, n, picture, marks, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setStage(s.stage ?? 1);
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
    if (!daily) completeLevel('nonograma', n, stage);
    if (daily) recordDaily('nonograma', true, seconds);
  }, [loaded, solved, finished, n, seconds, daily, stage]);

  function newGame(size: number, s = 1) {
    setN(size);
    setPicture(withSeed(levelSeed('nonograma', size, s), () => generate(size)));
    setStage(s);
    setMarks(Array(size * size).fill(0));
    setSeconds(0);
    setFinished(false);
  }

  function tap(i: number) {
    if (solved) return;
    const target: Mark = crossMode ? 2 : 1;
    setMarks((prev) => prev.map((m, j) => (j === i ? (m === target ? 0 : target) : m)));
  }

  // Hint: paints (or crosses out) the first cell that doesn't match the picture.
  function hint() {
    const i = marks.findIndex((m, k) => (m === 1) !== picture[k]);
    if (i === -1) return false;
    setMarks((prev) => prev.map((m, k) => (k === i ? (picture[i] ? 1 : 2) : m)));
    return true;
  }

  const nextStage = Math.min(stage + 1, LEVEL_COUNT);

  if (!loaded) return null;

  // Thicker lines every 5 cells make 10×10 boards easier to count.
  const line = (k: number) => (k % 5 === 4 && k !== n - 1 ? 2 : 0.5);

  return (
    <GameLayout
      top={
        <>
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
          {!daily && <LevelBar game="nonograma" variant={n} level={stage} onPick={(s) => newGame(n, s)} />}
        </>
      }
      board={
        <BoardFrame>
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
        </BoardFrame>
      }
      side={
        <View style={{ width: panel, gap: 10 }}>
          {solved && <Banner text={`¡Dibujo completo en ${formatTime(seconds)}!`} />}
          {solved ? (
            daily ? (
              <Button label="Jugar partida libre" onPress={() => router.replace('/nonograma')} />
            ) : (
              <Button label="Siguiente nivel" onPress={() => newGame(n, nextStage)} />
            )
          ) : (
            <>
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
                <Button
                  label="Deshacer"
                  variant="secondary"
                  onPress={undo}
                  style={{ flex: 1, opacity: canUndo ? 1 : 0.5 }}
                />
              </View>
              {!daily && <HintButton onHint={hint} />}
            </>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
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
