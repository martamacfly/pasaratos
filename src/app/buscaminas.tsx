import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { router } from 'expo-router';
import { FlagGlyph, Glyph, MineGlyph } from '@/components/icons';
import { BoardFrame } from '@/components/BoardFrame';
import { GameLayout, useGameSizes } from '@/components/GameLayout';
import { LevelBar } from '@/components/LevelBar';
import { Banner, Button, DailyHeader, formatTime, HintButton, TimerText } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { countAround, dailyBoard, flood, type Level, LEVELS, neighbors, placeMines } from '@/games/buscaminas';
import { completeLevel, LEVEL_COUNT, levelSeed } from '@/levels';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors, tone } from '@/theme';

const NUMBER_COLORS = [
  '',
  tone('#1971C2'),
  tone('#2F9E44'),
  tone('#E03131'),
  tone('#5F3DC4'),
  tone('#C92A2A'),
  tone('#0C8599'),
  tone('#212529'),
  tone('#868E96'),
];

type State = {
  level: Level;
  mines: boolean[] | null; // null until the first tap, so it can never hit a mine
  revealed: boolean[];
  flags: boolean[];
  lost: boolean;
};

const fresh = (level: Level): State => {
  const cells = LEVELS[level].size ** 2;
  return { level, mines: null, revealed: Array(cells).fill(false), flags: Array(cells).fill(false), lost: false };
};

const dailyState = (level: Level): State => {
  const { size, mines: count } = LEVELS[level];
  const { mines, start } = dailyBoard(size, count);
  const s = fresh(level);
  flood(mines, s.revealed, s.flags, start, size).forEach((i) => (s.revealed[i] = true));
  return { ...s, mines };
};

export default function BuscaminasScreen() {
  const { daily, date, seed, saveKey } = useDaily('buscaminas');
  const [stage, setStage] = useState(1);
  const [state, setState] = useState<State>(() =>
    daily
      ? withSeed(seed, () => dailyState('medio'))
      : withSeed(levelSeed('buscaminas', 'facil', 1), () => dailyState('facil')),
  );
  const [flagMode, setFlagMode] = useState(false);
  const [finished, setFinished] = useState(false);
  const { level, mines, revealed, flags, lost } = state;
  const { size, mines: mineCount } = LEVELS[level];
  const { board: boardSize, panel } = useGameSizes(460);
  const cell = boardSize / size;

  const won = mines !== null && !lost && revealed.every((r, i) => r || mines[i]);
  const over = won || lost;
  const [seconds, setSeconds] = useTimer(mines !== null && !over);
  const stats = useStats(`buscaminas:${level}`, finished);

  const loaded = useAutosave(saveKey, { date, stage, state, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setStage(s.stage ?? 1);
    setState(s.state);
    setSeconds(s.seconds);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !over || finished) return;
    setFinished(true);
    recordResult(`buscaminas:${level}`, won, seconds);
    if (!daily) completeLevel('buscaminas', level, stage);
    if (daily) recordDaily('buscaminas', won, seconds);
  }, [loaded, over, finished, level, won, seconds, daily, stage]);

  function newGame(l: Level, s = 1) {
    setState(withSeed(levelSeed('buscaminas', l, s), () => dailyState(l)));
    setStage(s);
    setSeconds(0);
    setFinished(false);
  }

  function open(s: State, cells: number[]): State {
    const field = s.mines!;
    const revealed = [...s.revealed];
    let lost = s.lost;
    for (const i of cells) {
      if (revealed[i] || s.flags[i]) continue;
      if (field[i]) {
        lost = true;
        revealed[i] = true;
      } else {
        flood(field, revealed, s.flags, i, size).forEach((j) => (revealed[j] = true));
      }
    }
    return { ...s, revealed, lost };
  }

  function tap(i: number) {
    if (over) return;
    setState((s) => {
      if (flagMode) {
        if (s.revealed[i]) return s;
        return { ...s, flags: s.flags.map((f, j) => (j === i ? !f : f)) };
      }
      if (s.flags[i]) return s;
      const withMines = s.mines ? s : { ...s, mines: placeMines(size, mineCount, i) };
      // Tapping an opened number whose flags are all placed opens the rest of its neighbours.
      if (s.revealed[i] && s.mines) {
        const around = neighbors(i, size);
        const flagged = around.filter((j) => s.flags[j]).length;
        return flagged === countAround(s.mines, i, size) ? open(s, around) : s;
      }
      return open(withMines, [i]);
    });
  }

  // Hint: opens a safe cell, preferably one next to the area already open.
  function hint() {
    if (over || !mines) return false;
    const safe = revealed.map((_, i) => i).filter((i) => !revealed[i] && !mines[i] && !flags[i]);
    const i = safe.find((c) => neighbors(c, size).some((j) => revealed[j])) ?? safe[0];
    if (i === undefined) return false;
    setState((s) => open(s, [i]));
    return true;
  }

  const nextStage = Math.min(stage + 1, LEVEL_COUNT);

  if (!loaded) return null;

  const flagsLeft = mineCount - flags.filter(Boolean).length;

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
            Abre todas las casillas que no tienen mina. Cada número dice cuántas minas tocan esa casilla, también en
            diagonal. Activa el modo bandera para marcar dónde crees que hay una mina. La primera casilla que abras
            nunca tiene mina.
          </Text>
          <TimerText style={styles.timer} seconds={seconds} best={stats?.best}>
            Minas {flagsLeft}
          </TimerText>
          {!daily && <LevelBar game="buscaminas" variant={level} level={stage} onPick={(s) => newGame(level, s)} />}
        </>
      }
      board={
        <BoardFrame>
          <View style={{ width: boardSize, height: boardSize, flexDirection: 'row', flexWrap: 'wrap' }}>
            {revealed.map((open, i) => {
              const isMine = mines?.[i];
              const showMine = isMine && (open || lost);
              const n = mines && open && !isMine ? countAround(mines, i, size) : 0;
              return (
                <Pressable
                  key={i}
                  onPress={() => tap(i)}
                  style={[
                    styles.cell,
                    { width: cell, height: cell },
                    open ? styles.open : styles.closed,
                    open && isMine && { backgroundColor: colors.danger },
                  ]}
                >
                  {showMine ? (
                    <Glyph size={cell * 0.7}>
                      <MineGlyph ink="#212529" />
                    </Glyph>
                  ) : flags[i] ? (
                    <Glyph size={cell * 0.7}>
                      <FlagGlyph ink={colors.danger} />
                    </Glyph>
                  ) : (
                    <Text style={{ fontSize: cell * 0.55, fontWeight: '800', color: NUMBER_COLORS[n] }}>{n || ''}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </BoardFrame>
      }
      side={
        <View style={{ width: panel, gap: 10 }}>
          {won && <Banner text={`¡Campo despejado en ${formatTime(seconds)}!`} />}
          {lost && <Banner tone="danger" text="¡Boom! Has pisado una mina" />}
          {!daily && !over && <HintButton onHint={hint} />}
          {over ? (
            daily ? (
              <Button label="Jugar partida libre" onPress={() => router.replace('/buscaminas')} />
            ) : (
              <Button
                label={won ? 'Siguiente nivel' : 'Reintentar nivel'}
                onPress={() => newGame(level, won ? nextStage : stage)}
              />
            )
          ) : (
            <Button
              label={flagMode ? 'Modo bandera: sí' : 'Modo bandera: no'}
              variant={flagMode ? 'primary' : 'secondary'}
              onPress={() => setFlagMode((m) => !m)}
            />
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  help: { fontSize: 14, color: colors.muted, textAlign: 'center', maxWidth: 420 },
  row: { flexDirection: 'row', gap: 6, maxWidth: 460, width: '100%' },
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
  cell: { alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: tone('#B8B4AA') },
  closed: { backgroundColor: tone('#C9D3E6') },
  open: { backgroundColor: colors.card },
});
