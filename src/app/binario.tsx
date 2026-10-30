import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Glyph, MoonGlyph, SunGlyph } from '@/components/icons';
import { GameLayout, useGameSizes } from '@/components/GameLayout';
import { Banner, Button, DailyHeader, formatTime } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { conflicts, generate, type Grid } from '@/games/binario';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors } from '@/theme';

type Level = 'facil' | 'medio' | 'dificil' | 'experto';
// Easier levels hand back some solved cells on top of the minimal puzzle.
const LEVELS: Record<Level, { n: number; extra: number; label: string }> = {
  facil: { n: 6, extra: 6, label: 'Fácil' },
  medio: { n: 6, extra: 0, label: 'Medio' },
  dificil: { n: 8, extra: 8, label: 'Difícil' },
  experto: { n: 8, extra: 0, label: 'Experto' },
};

export default function BinarioScreen() {
  const [level, setLevel] = useState<Level>('medio');
  const [n, setN] = useState(6);
  const { daily, date, seed, saveKey } = useDaily('binario');
  const [game, setGame] = useState(() => (daily ? withSeed(seed, () => generate(6)) : generate(6)));
  const [board, setBoard] = useState<Grid>(game.puzzle);
  const [finished, setFinished] = useState(false);
  const { board: size, panel } = useGameSizes(420);
  const cell = size / n;

  const bad = useMemo(() => conflicts(board, n), [board, n]);
  const solved = board.every((v, i) => v === game.solution[i]);
  const [seconds, setSeconds] = useTimer(!solved);
  const stats = useStats(`binario:${level}`, finished);

  const loaded = useAutosave(saveKey, { date, level, n, game, board, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setLevel(s.level ?? (s.n === 8 ? 'experto' : 'medio'));
    setN(s.n);
    setGame(s.game);
    setBoard(s.board);
    setSeconds(s.seconds);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !solved || finished) return;
    setFinished(true);
    recordResult(`binario:${level}`, true, seconds);
    if (daily) recordDaily('binario', true, seconds);
  }, [loaded, solved, finished, level, seconds, daily]);

  function newGame(l: Level) {
    const g = generate(LEVELS[l].n, LEVELS[l].extra);
    setLevel(l);
    setN(LEVELS[l].n);
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
    <GameLayout
      top={
        <>
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
            Rellena con soles y lunas: la misma cantidad de cada uno por fila y columna, nunca tres iguales seguidos y
            sin filas ni columnas repetidas. Toca una casilla para cambiarla.
          </Text>
          <Text style={styles.timer}>
            {formatTime(seconds)}
            {stats?.best !== undefined && ` · Récord ${formatTime(stats.best)}`}
          </Text>
        </>
      }
      board={
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
              {v !== 0 && (
                <Glyph size={cell * 0.62}>{v === 1 ? <SunGlyph ink="#F08C00" /> : <MoonGlyph ink="#5F3DC4" />}</Glyph>
              )}
            </Pressable>
          ))}
        </View>
      }
      side={
        <View style={{ width: panel, gap: 10 }}>
          {solved && <Banner text={`¡Resuelto en ${formatTime(seconds)}!`} />}
          {solved ? (
            daily ? (
              <Button label="Jugar partida libre" onPress={() => router.replace('/binario')} />
            ) : (
              <Button label="Nuevo tablero" onPress={() => newGame(level)} />
            )
          ) : (
            <Button label="Vaciar tablero" variant="secondary" onPress={() => setBoard(game.puzzle)} />
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.card },
  cell: { alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: colors.border },
});
