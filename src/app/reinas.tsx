import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CrownGlyph, Glyph } from '@/components/icons';
import { GameLayout, useGameSizes } from '@/components/GameLayout';
import { LevelBar } from '@/components/LevelBar';
import { Banner, Button, DailyHeader, formatTime } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { useUndo } from '@/hooks/useUndo';
import { type CellState, conflicts, generate } from '@/games/reinas';
import { completeLevel, LEVEL_COUNT, levelSeed } from '@/levels';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors } from '@/theme';

const SIZES = [5, 6, 7, 8];
const REGION_COLORS = [
  '#FFC9C9',
  '#FFD8A8',
  '#FFEC99',
  '#C0EB75',
  '#96F2D7',
  '#A5D8FF',
  '#D0BFFF',
  '#FCC2D7',
  '#CED4DA',
];

const emptyBoard = (n: number): CellState[][] => Array.from({ length: n }, () => Array(n).fill(0));

export default function ReinasScreen() {
  const { daily, date, seed, saveKey } = useDaily('reinas');
  const [stage, setStage] = useState(1);
  const [puzzle, setPuzzle] = useState(() =>
    daily ? withSeed(seed, () => generate(7)) : withSeed(levelSeed('reinas', 7, 1), () => generate(7)),
  );
  const [board, setBoard] = useState(() => emptyBoard(7));
  const { undo, canUndo } = useUndo(board, setBoard, puzzle);
  const { n, regions } = puzzle;
  const { board: size, panel } = useGameSizes(460);
  const cell = size / n;

  const bad = useMemo(() => conflicts(board, regions), [board, regions]);
  const queens = board.flat().filter((s) => s === 2).length;
  const solved = queens === n && bad.size === 0;
  const [seconds, setSeconds] = useTimer(!solved);
  const [finished, setFinished] = useState(false);
  const stats = useStats(`reinas:${n}`, finished);

  const loaded = useAutosave(saveKey, { date, stage, puzzle, board, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setStage(s.stage ?? 1);
    setPuzzle(s.puzzle);
    setBoard(s.board);
    setSeconds(s.seconds);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !solved || finished) return;
    setFinished(true);
    recordResult(`reinas:${n}`, true, seconds);
    if (!daily) completeLevel('reinas', n, stage);
    if (daily) recordDaily('reinas', true, seconds);
  }, [loaded, solved, finished, n, seconds, daily, stage]);

  function newGame(size: number, s = 1) {
    setPuzzle(withSeed(levelSeed('reinas', size, s), () => generate(size)));
    setStage(s);
    setBoard(emptyBoard(size));
    setSeconds(0);
    setFinished(false);
  }

  const nextStage = Math.min(stage + 1, LEVEL_COUNT);

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
            Coloca {n} reinas: una por fila, columna y color. Dos reinas no pueden tocarse, ni en diagonal. Toca una vez
            para marcar ✕ y otra para poner la reina.
          </Text>
          <Text style={styles.timer}>
            {formatTime(seconds)} · Reinas {queens}/{n}
            {stats?.best !== undefined && ` · Récord ${formatTime(stats.best)}`}
          </Text>
          {!daily && <LevelBar game="reinas" variant={n} level={stage} onPick={(s) => newGame(n, s)} />}
        </>
      }
      board={
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
                {s === 2 && (
                  <Glyph size={cell * 0.62}>
                    <CrownGlyph ink={bad.has(`${r},${c}`) ? '#fff' : '#212529'} />
                  </Glyph>
                )}
              </Pressable>
            )),
          )}
        </View>
      }
      side={
        <View style={{ width: panel, gap: 10 }}>
          {solved && <Banner text={`¡Resuelto en ${formatTime(seconds)}!`} />}
          {solved ? (
            daily ? (
              <Button label="Jugar partida libre" onPress={() => router.replace('/reinas')} />
            ) : (
              <Button label="Siguiente nivel" onPress={() => newGame(n, nextStage)} />
            )
          ) : (
            <View style={styles.row}>
              <Button
                label="Deshacer"
                variant="secondary"
                onPress={undo}
                style={{ flex: 1, opacity: canUndo ? 1 : 0.5 }}
              />
              <Button label="Vaciar" variant="secondary" onPress={() => setBoard(emptyBoard(n))} style={{ flex: 1 }} />
            </View>
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
  cell: { alignItems: 'center', justifyContent: 'center', borderColor: '#212529' },
});
