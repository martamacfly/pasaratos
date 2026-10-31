import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { BoardFrame } from '@/components/BoardFrame';
import { GameLayout, useGameSizes } from '@/components/GameLayout';
import { LevelBar } from '@/components/LevelBar';
import { Banner, Button, DailyHeader, formatTime } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { useGameTheme } from '@/gameTheme';
import { type Board, generate, isSolved, slide } from '@/games/deslizante';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { completeLevel, LEVEL_COUNT, levelSeed } from '@/levels';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors } from '@/theme';

const SIZES = [3, 4, 5];

export default function DeslizanteScreen() {
  const theme = useGameTheme();
  const { board: size, panel } = useGameSizes(420);
  const { daily, date, seed, saveKey } = useDaily('deslizante');
  const [stage, setStage] = useState(1);
  const [board, setBoard] = useState<Board>(() =>
    daily ? withSeed(seed, () => generate(4)) : withSeed(levelSeed('deslizante', 3, 1), () => generate(3)),
  );
  const [moves, setMoves] = useState(0);
  const [finished, setFinished] = useState(false);
  const n = Math.round(Math.sqrt(board.length));
  const cell = size / n;

  const solved = isSolved(board);
  const [seconds, setSeconds] = useTimer(!solved);
  const stats = useStats(`deslizante:${n}`, finished);

  const loaded = useAutosave(saveKey, { date, stage, board, moves, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setStage(s.stage ?? 1);
    setBoard(s.board);
    setMoves(s.moves);
    setSeconds(s.seconds);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !solved || finished) return;
    setFinished(true);
    recordResult(`deslizante:${n}`, true, seconds);
    if (!daily) completeLevel('deslizante', n, stage);
    if (daily) recordDaily('deslizante', true, seconds);
  }, [loaded, solved, finished, n, seconds, daily, stage]);

  function newGame(size: number, s = 1) {
    setBoard(withSeed(levelSeed('deslizante', size, s), () => generate(size)));
    setStage(s);
    setMoves(0);
    setSeconds(0);
    setFinished(false);
  }

  function tap(i: number) {
    if (solved) return;
    const next = slide(board, n, i);
    if (!next) return;
    setBoard(next);
    setMoves((m) => m + 1);
  }

  const nextStage = Math.min(stage + 1, LEVEL_COUNT);

  if (!loaded) return null;

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
            Ordena los números del 1 al {n * n - 1}. Toca una ficha de la fila o columna del hueco para deslizarla.
          </Text>
          <Text style={styles.timer}>
            {formatTime(seconds)} · Movimientos {moves}
            {stats?.best !== undefined && ` · Récord ${formatTime(stats.best)}`}
          </Text>
          {!daily && <LevelBar game="deslizante" variant={n} level={stage} onPick={(s) => newGame(n, s)} />}
        </>
      }
      board={
        <BoardFrame>
          <View style={[styles.board, { width: size, height: size }]}>
            {board.map((v, i) =>
              v === 0 ? (
                <View key="gap" style={{ width: cell, height: cell }} />
              ) : (
                <View key={v} style={{ width: cell, height: cell, padding: 3 }}>
                  <Pressable
                    onPress={() => tap(i)}
                    style={({ pressed }) => [
                      styles.tile,
                      { backgroundColor: v === i + 1 ? theme.main : theme.soft },
                      pressed && { transform: [{ scale: 0.95 }] },
                    ]}
                  >
                    <Text style={[styles.number, { fontSize: cell * 0.4, color: v === i + 1 ? '#fff' : theme.main }]}>
                      {v}
                    </Text>
                  </Pressable>
                </View>
              ),
            )}
          </View>
        </BoardFrame>
      }
      side={
        <View style={{ width: panel, gap: 10 }}>
          {solved && <Banner text={`¡Ordenado en ${moves} movimientos y ${formatTime(seconds)}!`} />}
          {solved ? (
            daily ? (
              <Button label="Jugar partida libre" onPress={() => router.replace('/deslizante')} />
            ) : (
              <Button label="Siguiente nivel" onPress={() => newGame(n, nextStage)} />
            )
          ) : (
            <Button label="Reiniciar nivel" variant="secondary" onPress={() => newGame(n, stage)} />
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
  board: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.card, borderRadius: 16, padding: 0 },
  tile: { flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  number: { fontWeight: '900' },
});
