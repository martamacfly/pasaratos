import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { PathLines } from '@/components/PathLines';
import { Banner, Button, DailyHeader, formatTime } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { adjacent, type Colores, coloresSolved, generateColores } from '@/games/caminos';
import { withSeed } from '@/games/random';
import { useGridDrag } from '@/hooks/useGridDrag';
import { useTimer } from '@/hooks/useTimer';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors, radius } from '@/theme';

const SIZES = [5, 6, 7, 8, 9];
const PALETTE = ['#E03131', '#1971C2', '#2F9E44', '#F08C00', '#9C36B5', '#0C8599', '#D6336C', '#5C940D'];

type Drawing = { lines: number[][]; active: number | null };
const emptyDrawing = (p: Colores): Drawing => ({ lines: p.pairs.map(() => []), active: null });

export default function ColoresScreen() {
  const { width } = useWindowDimensions();
  const { daily, date, seed, saveKey } = useDaily('colores');
  const [puzzle, setPuzzle] = useState(() => (daily ? withSeed(seed, () => generateColores(6)) : generateColores(5)));
  const [drawing, setDrawing] = useState<Drawing>(() => emptyDrawing(puzzle));
  const [finished, setFinished] = useState(false);
  const { n, pairs } = puzzle;
  const { lines } = drawing;
  const boardSize = Math.min(width - 32, 420);
  const cell = boardSize / n;

  const dotColor = new Map<number, number>();
  pairs.forEach(([a, b], k) => {
    dotColor.set(a, k);
    dotColor.set(b, k);
  });

  const solved = coloresSolved(puzzle, lines);
  const [seconds, setSeconds] = useTimer(!solved);
  const stats = useStats(`colores:${n}`, finished);

  const loaded = useAutosave(saveKey, { date, puzzle, lines, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setPuzzle(s.puzzle);
    setDrawing({ lines: s.lines, active: null });
    setSeconds(s.seconds);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !solved || finished) return;
    setFinished(true);
    recordResult(`colores:${n}`, true, seconds);
    if (daily) recordDaily('colores', true, seconds);
  }, [loaded, solved, finished, n, seconds, daily]);

  function newGame(size: number) {
    const p = generateColores(size);
    setPuzzle(p);
    setDrawing(emptyDrawing(p));
    setSeconds(0);
    setFinished(false);
  }

  const isComplete = (line: number[], k: number) =>
    line.length > 1 && dotColor.get(line[line.length - 1]) === k && line[line.length - 1] !== line[0];

  const drag = useGridDrag(n, cell, {
    onStart: (c) =>
      setDrawing((d) => {
        if (solved) return d;
        const dot = dotColor.get(c);
        // Starting on a dot redraws that colour from scratch.
        if (dot !== undefined) return { lines: d.lines.map((l, k) => (k === dot ? [c] : l)), active: dot };
        const k = d.lines.findIndex((l) => l.includes(c));
        if (k === -1) return { ...d, active: null };
        return { lines: d.lines.map((l, j) => (j === k ? l.slice(0, l.indexOf(c) + 1) : l)), active: k };
      }),
    onEnter: (c) =>
      setDrawing((d) => {
        const k = d.active;
        if (k === null || solved) return d;
        const line = d.lines[k];
        const end = line[line.length - 1];
        if (c === line[line.length - 2]) return { ...d, lines: d.lines.map((l, j) => (j === k ? l.slice(0, -1) : l)) };
        if (line.includes(c)) return { ...d, lines: d.lines.map((l, j) => (j === k ? l.slice(0, l.indexOf(c) + 1) : l)) };
        if (isComplete(line, k) || !adjacent(end, c, n)) return d;
        const dot = dotColor.get(c);
        if (dot !== undefined && dot !== k) return d;
        // Crossing another colour's line cuts it at that point.
        const lines = d.lines.map((l, j) => {
          if (j === k) return [...l, c];
          const idx = l.indexOf(c);
          return idx === -1 ? l : l.slice(0, idx);
        });
        return { ...d, lines };
      }),
  });

  if (!loaded) return null;

  const owner = new Map<number, number>();
  lines.forEach((l, k) => l.forEach((c) => owner.set(c, k)));
  const joined = lines.filter((l, k) => isComplete(l, k)).length;

  return (
    <View style={styles.container}>
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
        Une cada pareja de puntos del mismo color arrastrando el dedo. Las líneas no se cruzan y deben llenar todo
        el tablero.
      </Text>
      <Text style={styles.timer}>
        ⏱ {formatTime(seconds)} · 🔗 {joined}/{pairs.length}
        {stats?.best !== undefined && ` · 🏆 ${formatTime(stats.best)}`}
      </Text>

      <View {...drag} style={[styles.board, { width: boardSize, height: boardSize }]}>
        {Array.from({ length: n * n }, (_, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={[
              styles.cell,
              { width: cell, height: cell, left: (i % n) * cell, top: Math.floor(i / n) * cell },
              owner.has(i) && { backgroundColor: PALETTE[owner.get(i)!] + '2E' },
            ]}
          />
        ))}
        {lines.map((l, k) => (
          <PathLines key={k} path={l} n={n} cell={cell} color={PALETTE[k]} />
        ))}
        {[...dotColor].map(([c, k]) => {
          const size = cell * 0.66;
          return (
            <View
              key={c}
              pointerEvents="none"
              style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: PALETTE[k],
                left: (c % n) * cell + (cell - size) / 2,
                top: Math.floor(c / n) * cell + (cell - size) / 2,
              }}
            />
          );
        })}
      </View>

      <View style={{ width: boardSize, gap: 10 }}>
        {solved && <Banner text={`¡Todo conectado en ${formatTime(seconds)}! 🎉`} />}
        {solved ? (
          daily ? (
            <Button label="Jugar partida libre" onPress={() => router.replace('/colores')} />
          ) : (
            <Button label="Nuevo tablero" onPress={() => newGame(n)} />
          )
        ) : (
          <Button label="Borrar líneas" variant="secondary" onPress={() => setDrawing(emptyDrawing(puzzle))} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 6, maxWidth: 420, width: '100%' },
  help: { fontSize: 14, color: colors.muted, textAlign: 'center', maxWidth: 420 },
  timer: { fontSize: 16, color: colors.muted, fontVariant: ['tabular-nums'] },
  board: { backgroundColor: colors.card, borderRadius: radius, overflow: 'hidden', userSelect: 'none' },
  cell: { position: 'absolute', borderWidth: 0.5, borderColor: colors.border },
});
