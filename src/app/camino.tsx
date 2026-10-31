import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { PathLines } from '@/components/PathLines';
import { GameLayout, useGameSizes } from '@/components/GameLayout';
import { LevelBar } from '@/components/LevelBar';
import { Banner, Button, DailyHeader, formatTime } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { useGameTheme } from '@/gameTheme';
import { adjacent, caminoSolved, generateCamino } from '@/games/caminos';
import { withSeed } from '@/games/random';
import { useGridDrag } from '@/hooks/useGridDrag';
import { useTimer } from '@/hooks/useTimer';
import { completeLevel, LEVEL_COUNT, levelSeed } from '@/levels';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors, radius } from '@/theme';

const SIZES = [5, 6, 7, 8];

export default function CaminoScreen() {
  const theme = useGameTheme();
  const { daily, date, seed, saveKey } = useDaily('camino');
  const [stage, setStage] = useState(1);
  const [puzzle, setPuzzle] = useState(() =>
    daily ? withSeed(seed, () => generateCamino(7)) : withSeed(levelSeed('camino', 6, 1), () => generateCamino(6)),
  );
  const [path, setPath] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const { n, clues } = puzzle;
  const { board: boardSize, panel } = useGameSizes(420);
  const cell = boardSize / n;
  const last = Object.keys(clues).length;

  const solved = caminoSolved(puzzle, path);
  const [seconds, setSeconds] = useTimer(!solved);
  const stats = useStats(`camino:${n}`, finished);

  const loaded = useAutosave(saveKey, { date, stage, puzzle, path, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setStage(s.stage ?? 1);
    setPuzzle(s.puzzle);
    setPath(s.path);
    setSeconds(s.seconds);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !solved || finished) return;
    setFinished(true);
    recordResult(`camino:${n}`, true, seconds);
    if (!daily) completeLevel('camino', n, stage);
    if (daily) recordDaily('camino', true, seconds);
  }, [loaded, solved, finished, n, seconds, daily, stage]);

  function newGame(size: number, s = 1) {
    setPuzzle(withSeed(levelSeed('camino', size, s), () => generateCamino(size)));
    setStage(s);
    setPath([]);
    setSeconds(0);
    setFinished(false);
  }

  /** Next number the path must reach, given the numbered cells it already passes. */
  const nextClue = (p: number[]) => 1 + p.filter((c) => clues[c] !== undefined).length;

  function extend(p: number[], cell: number): number[] {
    const end = p[p.length - 1];
    if (p.includes(cell) || !adjacent(end, cell, n) || clues[end] === last) return p;
    // Numbered cells can only be entered in order.
    if (clues[cell] !== undefined && clues[cell] !== nextClue(p)) return p;
    return [...p, cell];
  }

  const drag = useGridDrag(n, cell, {
    onStart: (c) =>
      setPath((p) => {
        if (solved) return p;
        const idx = p.indexOf(c);
        if (idx !== -1) return p.slice(0, idx + 1);
        if (p.length && adjacent(p[p.length - 1], c, n)) return extend(p, c);
        return clues[c] === 1 ? [c] : p;
      }),
    onEnter: (c) =>
      setPath((p) => {
        if (solved || !p.length) return p;
        if (c === p[p.length - 2]) return p.slice(0, -1);
        return extend(p, c);
      }),
  });

  const nextStage = Math.min(stage + 1, LEVEL_COUNT);

  if (!loaded) return null;

  const onPath = new Set(path);
  const head = path[path.length - 1];

  return (
    <GameLayout
      scroll={false}
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
            Arrastra desde el 1 una línea que pase por todas las casillas y por los números en orden hasta el {last}.
          </Text>
          <Text style={styles.timer}>
            {formatTime(seconds)} · {path.length}/{n * n}
            {stats?.best !== undefined && ` · Récord ${formatTime(stats.best)}`}
          </Text>
          {!daily && <LevelBar game="camino" variant={n} level={stage} onPick={(s) => newGame(n, s)} />}
        </>
      }
      board={
        <View {...drag} style={[styles.board, { width: boardSize, height: boardSize }]}>
          {Array.from({ length: n * n }, (_, i) => (
            <View
              key={i}
              pointerEvents="none"
              style={[
                styles.cell,
                { width: cell, height: cell, left: (i % n) * cell, top: Math.floor(i / n) * cell },
                onPath.has(i) && { backgroundColor: solved ? colors.successSoft : theme.soft },
              ]}
            />
          ))}
          <PathLines path={path} n={n} cell={cell} color={solved ? colors.success : theme.main} />
          {Object.entries(clues).map(([c, num]) => {
            const i = Number(c);
            const size = cell * 0.62;
            return (
              <View
                key={c}
                pointerEvents="none"
                style={[
                  styles.clue,
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    left: (i % n) * cell + (cell - size) / 2,
                    top: Math.floor(i / n) * cell + (cell - size) / 2,
                  },
                  i === head && { borderWidth: 3, borderColor: colors.warning },
                ]}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.48 }}>{num}</Text>
              </View>
            );
          })}
        </View>
      }
      side={
        <View style={{ width: panel, gap: 10 }}>
          {solved && <Banner text={`¡Camino completo en ${formatTime(seconds)}!`} />}
          {solved ? (
            daily ? (
              <Button label="Jugar partida libre" onPress={() => router.replace('/camino')} />
            ) : (
              <Button label="Siguiente nivel" onPress={() => newGame(n, nextStage)} />
            )
          ) : (
            <Button label="Borrar camino" variant="secondary" onPress={() => setPath([])} />
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
  board: { backgroundColor: colors.card, borderRadius: radius, overflow: 'hidden', userSelect: 'none' },
  cell: { position: 'absolute', borderWidth: 0.5, borderColor: colors.border },
  clue: { position: 'absolute', backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
});
