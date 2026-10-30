import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameLayout, useGameSizes } from '@/components/GameLayout';
import { LevelBar } from '@/components/LevelBar';
import { Banner, Button, DailyHeader, formatTime, NumberPad } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { useGameTheme } from '@/gameTheme';
import { cageConflicts, generate } from '@/games/calcudoku';
import { latinConflicts } from '@/games/latin';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { useUndo } from '@/hooks/useUndo';
import { completeLevel, LEVEL_COUNT, levelSeed } from '@/levels';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors } from '@/theme';

const SIZES = [4, 5, 6, 7];

export default function CalcudokuScreen() {
  const theme = useGameTheme();
  const { daily, date, seed, saveKey } = useDaily('calcudoku');
  const [stage, setStage] = useState(1);
  const [puzzle, setPuzzle] = useState(() =>
    daily ? withSeed(seed, () => generate(5)) : withSeed(levelSeed('calcudoku', 4, 1), () => generate(4)),
  );
  const { n, cages, solution } = puzzle;
  const [board, setBoard] = useState<number[]>(() => Array(n * n).fill(0));
  const { undo, canUndo } = useUndo(board, setBoard, puzzle);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const { board: boardSize, panel } = useGameSizes(420);
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
    recordResult(`calcudoku:${n}`, true, seconds);
    if (!daily) completeLevel('calcudoku', n, stage);
    if (daily) recordDaily('calcudoku', true, seconds);
  }, [loaded, solved, finished, n, seconds, daily, stage]);

  function newGame(size: number, s = 1) {
    setPuzzle(withSeed(levelSeed('calcudoku', size, s), () => generate(size)));
    setStage(s);
    setBoard(Array(size * size).fill(0));
    setSelected(null);
    setSeconds(0);
    setFinished(false);
  }

  function input(v: number) {
    if (selected === null || solved) return;
    setBoard((prev) => prev.map((x, i) => (i === selected ? v : x)));
  }

  const nextStage = Math.min(stage + 1, LEVEL_COUNT);

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
            Números del 1 al {n} sin repetir en filas ni columnas. Cada zona marcada debe dar su resultado con la
            operación indicada.
          </Text>
          <Text style={styles.timer}>
            {formatTime(seconds)}
            {stats?.best !== undefined && ` · Récord ${formatTime(stats.best)}`}
          </Text>
          {!daily && <LevelBar game="calcudoku" variant={n} level={stage} onPick={(s) => newGame(n, s)} />}
        </>
      }
      board={
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
                  i === selected && { backgroundColor: theme.main + '40' },
                ]}
              >
                {labelAt.has(i) && (
                  <Text style={[styles.label, { fontSize: Math.min(cell * 0.2, 15) }]}>{labelAt.get(i)}</Text>
                )}
                <Text
                  style={{ fontSize: cell * 0.45, fontWeight: '600', color: bad.has(i) ? colors.danger : theme.main }}
                >
                  {v || ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      }
      side={
        <View style={{ width: panel, gap: 10 }}>
          {solved && <Banner text={`¡Resuelto en ${formatTime(seconds)}!`} />}
          {solved ? (
            daily ? (
              <Button label="Jugar partida libre" onPress={() => router.replace('/calcudoku')} />
            ) : (
              <Button label="Siguiente nivel" onPress={() => newGame(n, nextStage)} />
            )
          ) : (
            <>
              <NumberPad max={n} onPress={input} width={panel} />
              <Button label="Deshacer" variant="secondary" onPress={undo} style={{ opacity: canUndo ? 1 : 0.5 }} />
            </>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
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
  cell: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  label: { position: 'absolute', top: 2, left: 4, fontWeight: '700', color: colors.text },
});
