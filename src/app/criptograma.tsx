import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { useWindowSize } from '@/hooks/useWindowSize';
import { BoardFrame } from '@/components/BoardFrame';
import { GameLayout, useGameSizes } from '@/components/GameLayout';
import { LevelBar } from '@/components/LevelBar';
import { Banner, Button, DailyHeader, formatTime, HintButton, TimerText } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { useGameTheme } from '@/gameTheme';
import { generate, isLetter, type Level, LEVELS } from '@/games/criptograma';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { completeLevel, LEVEL_COUNT, levelSeed } from '@/levels';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors, radius, tone } from '@/theme';

const KEYBOARD = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM<'];

export default function CriptogramaScreen() {
  const theme = useGameTheme();
  const { width } = useWindowSize();
  const { wide, board: size, panel } = useGameSizes(460);
  const { daily, date, seed, saveKey } = useDaily('criptograma');
  const [stage, setStage] = useState(1);
  const [level, setLevel] = useState<Level>('medio');
  const [puzzle, setPuzzle] = useState(() =>
    daily
      ? withSeed(seed, () => generate('medio'))
      : withSeed(levelSeed('criptograma', 'medio', 1), () => generate('medio')),
  );
  // The player's letter for each real letter of the saying (keyed by the real one, shown by its number).
  const [guesses, setGuesses] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const { text, code, given } = puzzle;
  const letters = [...new Set([...text].filter(isLetter))];
  const open = letters.filter((l) => !given.includes(l));
  const cell = Math.min(Math.max((size - 16) / 11, 26), 38);

  const valueOf = (l: string) => (given.includes(l) ? l : (guesses[l] ?? ''));
  const solved = open.every((l) => guesses[l] === l);
  const [seconds, setSeconds] = useTimer(!solved);
  const stats = useStats(`criptograma:${level}`, finished);

  // The same guessed letter used for two different numbers is marked in red.
  const used: Record<string, number> = {};
  letters.forEach((l) => {
    const v = valueOf(l);
    if (v) used[v] = (used[v] ?? 0) + 1;
  });

  const loaded = useAutosave(saveKey, { date, stage, level, puzzle, guesses, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setStage(s.stage ?? 1);
    setLevel(s.level);
    setPuzzle(s.puzzle);
    setGuesses(s.guesses);
    setSeconds(s.seconds);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !solved || finished) return;
    setFinished(true);
    recordResult(`criptograma:${level}`, true, seconds);
    if (!daily) completeLevel('criptograma', level, stage);
    if (daily) recordDaily('criptograma', true, seconds);
  }, [loaded, solved, finished, level, seconds, daily, stage]);

  function newGame(l: Level, s = 1) {
    setPuzzle(withSeed(levelSeed('criptograma', l, s), () => generate(l)));
    setLevel(l);
    setStage(s);
    setGuesses({});
    setSelected(null);
    setSeconds(0);
    setFinished(false);
  }

  function press(key: string) {
    if (solved || !selected) return;
    if (key === '<') {
      setGuesses((g) => ({ ...g, [selected]: '' }));
      return;
    }
    setGuesses((g) => ({ ...g, [selected]: key }));
    // Move on to the next number still empty, in reading order.
    const order = [...text].filter((c) => isLetter(c) && !given.includes(c));
    const start = order.indexOf(selected);
    const next = [...order.slice(start + 1), ...order.slice(0, start)].find((l) => l !== selected && !guesses[l]);
    if (next) setSelected(next);
  }

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Backspace') press('<');
      else if (/^[a-zA-ZñÑ]$/.test(e.key)) press(e.key.toUpperCase());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Hint: writes the right letter for the first number still wrong or empty.
  function hint() {
    const l = [...text].find((c) => isLetter(c) && !given.includes(c) && guesses[c] !== c);
    if (!l) return false;
    setGuesses((g) => ({ ...g, [l]: l }));
    setSelected(null);
    return true;
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
            Descifra el refrán. Cada número es siempre la misma letra: toca una casilla y escribe la letra que crees.
          </Text>
          <TimerText style={styles.timer} seconds={seconds} best={stats?.best} />
          {!daily && <LevelBar game="criptograma" variant={level} level={stage} onPick={(s) => newGame(level, s)} />}
        </>
      }
      board={
        <BoardFrame>
          <View style={[styles.board, { width: size }]}>
            {text.split(' ').map((word, w) => (
              <View key={w} style={styles.word}>
                {[...word].map((c, k) => {
                  const isGiven = given.includes(c);
                  const value = valueOf(c);
                  const clash = value && used[value] > 1 && !isGiven;
                  return (
                    <Pressable
                      key={k}
                      disabled={isGiven || solved}
                      onPress={() => setSelected(c)}
                      style={[
                        styles.cell,
                        { width: cell },
                        selected === c && { backgroundColor: theme.soft, borderColor: theme.main },
                      ]}
                    >
                      <Text
                        style={[
                          styles.letter,
                          { fontSize: cell * 0.6 },
                          isGiven && { color: colors.text },
                          !isGiven && { color: clash ? colors.danger : theme.main },
                        ]}
                      >
                        {value || ' '}
                      </Text>
                      <View style={[styles.line, { backgroundColor: isGiven ? colors.border : theme.main }]} />
                      <Text style={[styles.code, { fontSize: cell * 0.36 }]}>{code[c]}</Text>
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
          {solved && <Banner text={`¡Descifrado en ${formatTime(seconds)}!`} />}
          {!daily && !solved && <HintButton onHint={hint} />}
          {solved ? (
            daily ? (
              <Button label="Jugar partida libre" onPress={() => router.replace('/criptograma')} />
            ) : (
              <Button label="Siguiente nivel" onPress={() => newGame(level, nextStage)} />
            )
          ) : (
            <View style={{ gap: 6, width: wide ? panel : Math.min(width - 16, 500), alignSelf: 'center' }}>
              {KEYBOARD.map((line) => (
                <View key={line} style={{ flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
                  {[...line].map((k) => (
                    <Pressable
                      key={k}
                      onPress={() => press(k)}
                      style={({ pressed }) => [styles.key, { flex: k === '<' ? 1.5 : 1 }, pressed && { opacity: 0.7 }]}
                    >
                      <Text style={styles.keyText}>{k === '<' ? '⌫' : k}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
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
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: 14,
    columnGap: 18,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
  },
  word: { flexDirection: 'row', gap: 3 },
  cell: { alignItems: 'center', borderRadius: 6, borderWidth: 2, borderColor: 'transparent', paddingVertical: 2 },
  letter: { fontWeight: '900', minHeight: 24 },
  line: { height: 2, alignSelf: 'stretch', marginHorizontal: 2 },
  code: { color: colors.muted, fontWeight: '700' },
  key: {
    height: 46,
    backgroundColor: colors.card,
    borderBottomWidth: 3,
    borderBottomColor: tone('#DAD6CC'),
    borderRadius: radius / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 14, fontWeight: '700', color: colors.text },
});
