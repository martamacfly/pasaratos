import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { router } from 'expo-router';
import { BoardFrame } from '@/components/BoardFrame';
import { GameLayout, useGameSizes } from '@/components/GameLayout';
import { LevelBar } from '@/components/LevelBar';
import { Banner, Button, DailyHeader, formatTime, HintButton, TimerText } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { useGameTheme } from '@/gameTheme';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { generate, lineBetween } from '@/games/sopa';
import { completeLevel, LEVEL_COUNT, levelSeed } from '@/levels';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors, radius, tone } from '@/theme';

type Level = 'facil' | 'medio' | 'dificil' | 'experto';
const LEVELS: Record<Level, { size: number; words: number; backwards: boolean; label: string }> = {
  facil: { size: 10, words: 8, backwards: false, label: 'Fácil' },
  medio: { size: 11, words: 10, backwards: false, label: 'Medio' },
  dificil: { size: 12, words: 12, backwards: true, label: 'Difícil' },
  experto: { size: 14, words: 16, backwards: true, label: 'Experto' },
};
const FOUND_COLORS = [
  tone('#FFC9C9'),
  tone('#FFD8A8'),
  tone('#FFEC99'),
  tone('#C0EB75'),
  tone('#96F2D7'),
  tone('#A5D8FF'),
  tone('#D0BFFF'),
  tone('#FCC2D7'),
];

const create = (l: Level) => generate(LEVELS[l].size, LEVELS[l].words, LEVELS[l].backwards);

export default function SopaScreen() {
  const theme = useGameTheme();
  const { daily, date, seed, saveKey } = useDaily('sopa');
  const [stage, setStage] = useState(1);
  const [level, setLevel] = useState<Level>(daily ? 'dificil' : 'facil');
  const [sopa, setSopa] = useState(() =>
    daily ? withSeed(seed, () => create('dificil')) : withSeed(levelSeed('sopa', 'facil', 1), () => create('facil')),
  );
  const [found, setFound] = useState<string[]>([]);
  const [start, setStart] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const { size, letters, words } = sopa;
  const { board: boardSize, panel } = useGameSizes(460);
  const cell = boardSize / size;

  const solved = found.length === words.length;
  const [seconds, setSeconds] = useTimer(!solved);
  const stats = useStats(`sopa:${level}`, finished);

  const loaded = useAutosave(saveKey, { date, stage, level, sopa, found, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setStage(s.stage ?? 1);
    setLevel(s.level);
    setSopa(s.sopa);
    setFound(s.found);
    setSeconds(s.seconds);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !solved || finished) return;
    setFinished(true);
    recordResult(`sopa:${level}`, true, seconds);
    if (!daily) completeLevel('sopa', level, stage);
    if (daily) recordDaily('sopa', true, seconds);
  }, [loaded, solved, finished, level, seconds, daily, stage]);

  function newGame(l: Level, s = 1) {
    setLevel(l);
    setSopa(withSeed(levelSeed('sopa', l, s), () => create(l)));
    setStage(s);
    setFound([]);
    setStart(null);
    setSeconds(0);
    setFinished(false);
  }

  // Select a word by tapping its first letter and then its last one (either way round).
  function tap(i: number) {
    if (solved) return;
    if (start === null || start === i) {
      setStart(start === i ? null : i);
      return;
    }
    const cells = lineBetween(start, i, size);
    const key = cells?.join();
    const reversed = cells && [...cells].reverse().join();
    const match = words.find((w) => !found.includes(w.word) && (w.cells.join() === key || w.cells.join() === reversed));
    if (match) {
      setFound((f) => [...f, match.word]);
      setStart(null);
    } else {
      setStart(i);
    }
  }

  // Hint: marks one of the words still to find.
  function hint() {
    const word = words.find((w) => !found.includes(w.word));
    if (!word) return false;
    setFound((f) => [...f, word.word]);
    setStart(null);
    return true;
  }

  const nextStage = Math.min(stage + 1, LEVEL_COUNT);

  if (!loaded) return null;

  const colorOf = new Map<number, string>();
  words.forEach((w) => {
    const k = found.indexOf(w.word);
    if (k !== -1) w.cells.forEach((c) => colorOf.set(c, FOUND_COLORS[k % FOUND_COLORS.length]));
  });

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
            Toca la primera y la última letra de cada palabra.
            {LEVELS[level].backwards ? ' Pueden estar al revés.' : ''}
          </Text>
          <TimerText style={styles.timer} seconds={seconds} best={stats?.best}>
            {found.length}/{words.length}
          </TimerText>
          {!daily && <LevelBar game="sopa" variant={level} level={stage} onPick={(s) => newGame(level, s)} />}
        </>
      }
      board={
        <BoardFrame>
          <View style={[styles.grid, { width: boardSize, height: boardSize }]}>
            {letters.map((l, i) => (
              <Pressable
                key={i}
                onPress={() => tap(i)}
                style={[
                  styles.cell,
                  { width: cell, height: cell },
                  colorOf.has(i) && { backgroundColor: colorOf.get(i) },
                  start === i && { backgroundColor: theme.main },
                ]}
              >
                <Text style={{ fontSize: cell * 0.5, fontWeight: '700', color: start === i ? '#fff' : colors.text }}>
                  {l}
                </Text>
              </Pressable>
            ))}
          </View>
        </BoardFrame>
      }
      side={
        <View style={{ width: panel, gap: 10 }}>
          {solved && <Banner text={`¡Todas encontradas en ${formatTime(seconds)}!`} />}
          <View style={styles.words}>
            {words.map((w) => {
              const done = found.includes(w.word);
              return (
                <Text key={w.word} style={[styles.word, done && styles.wordDone]}>
                  {w.word}
                </Text>
              );
            })}
          </View>
          {!daily && !solved && <HintButton onHint={hint} />}
          {daily ? (
            solved && <Button label="Jugar partida libre" onPress={() => router.replace('/sopa')} />
          ) : (
            <Button
              label={solved ? 'Siguiente nivel' : 'Reiniciar nivel'}
              variant={solved ? 'primary' : 'secondary'}
              onPress={() => newGame(level, solved ? nextStage : stage)}
            />
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.card,
    borderRadius: radius,
    overflow: 'hidden',
  },
  cell: { alignItems: 'center', justifyContent: 'center' },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  word: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: colors.card,
    borderRadius: radius / 2,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  wordDone: { color: colors.muted, textDecorationLine: 'line-through', backgroundColor: 'transparent' },
});
