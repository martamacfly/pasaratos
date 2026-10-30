import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { GameLayout, useGameSizes } from '@/components/GameLayout';
import { LevelBar } from '@/components/LevelBar';
import { Banner, Button, DailyHeader } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { keyMarks, type Mark, score } from '@/games/palabra';
import { pick, withSeed } from '@/games/random';
import { SOLUTIONS } from '@/games/words';
import { completeLevel, LEVEL_COUNT, levelSeed } from '@/levels';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors, radius } from '@/theme';

const LENGTH = 5;
type Level = 'facil' | 'normal' | 'dificil';
const LEVELS: Record<Level, { tries: number; label: string }> = {
  facil: { tries: 8, label: 'Fácil · 8' },
  normal: { tries: 6, label: 'Normal · 6' },
  dificil: { tries: 4, label: 'Difícil · 4' },
};
const KEYBOARD = ['QWERTYUIOP', 'ASDFGHJKLÑ', '<ZXCVBNM>'];

const MARK_COLORS: Record<Mark, string> = {
  correct: '#2F9E44',
  present: '#E8A400',
  absent: '#868E96',
};

export default function PalabraScreen() {
  const { width } = useWindowDimensions();
  const { wide, board, panel } = useGameSizes(340);
  // Five tiles look oversized beyond ~400 px on a phone, ~480 px on a desktop.
  const boardWidth = Math.min(board, wide ? 480 : 400);
  const tile = (boardWidth - (LENGTH - 1) * 6) / LENGTH;

  const { daily, date, seed, saveKey } = useDaily('palabra');
  const [stage, setStage] = useState(1);
  const [level, setLevel] = useState<Level>('normal');
  const [answer, setAnswer] = useState(() =>
    daily ? withSeed(seed, () => pick(SOLUTIONS)) : withSeed(levelSeed('palabra', 'normal', 1), () => pick(SOLUTIONS)),
  );
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [message, setMessage] = useState('');
  const tries = LEVELS[level].tries;

  const won = guesses.includes(answer);
  const over = won || guesses.length >= tries;
  const keys = keyMarks(guesses, answer);
  const [finished, setFinished] = useState(false);
  const stats = useStats('palabra', finished);

  const loaded = useAutosave(saveKey, { date, stage, level, answer, guesses, finished }, (s) => {
    if (daily && s.date !== date) return;
    setStage(s.stage ?? 1);
    setLevel(s.level ?? 'normal');
    setAnswer(s.answer);
    setGuesses(s.guesses);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !over || finished) return;
    setFinished(true);
    recordResult('palabra', won);
    if (!daily) completeLevel('palabra', level, stage);
    if (daily) {
      // Coloured squares of every guess, without the letters, for sharing.
      const squares: Record<Mark, string> = { correct: '🟩', present: '🟨', absent: '⬜' };
      const grid = guesses
        .map((g) =>
          score(g, answer)
            .map((m) => squares[m])
            .join(''),
        )
        .join('\n');
      recordDaily('palabra', won, undefined, grid);
    }
  }, [loaded, over, finished, won, daily, stage, guesses, answer]);

  function press(key: string) {
    if (over) return;
    setMessage('');
    if (key === '<') setCurrent((c) => c.slice(0, -1));
    else if (key === '>') submit();
    else if (current.length < LENGTH) setCurrent((c) => c + key);
  }

  function submit() {
    // Any 5 letters are accepted: the bundled word list is far too small to reject guesses fairly.
    if (current.length < LENGTH) return setMessage('Faltan letras');
    setGuesses((g) => [...g, current]);
    setCurrent('');
  }

  function restart(l: Level = level, s = 1) {
    setLevel(l);
    setAnswer(withSeed(levelSeed('palabra', l, s), () => pick(SOLUTIONS)));
    setStage(s);
    setGuesses([]);
    setCurrent('');
    setMessage('');
    setFinished(false);
  }

  // Physical keyboard support when running on web.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') press('>');
      else if (e.key === 'Backspace') press('<');
      else if (/^[a-zA-ZñÑ]$/.test(e.key)) press(e.key.toUpperCase());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const rows = Array.from({ length: tries }, (_, r) => {
    if (r < guesses.length) return { word: guesses[r], marks: score(guesses[r], answer) };
    if (r === guesses.length && !over) return { word: current, marks: null };
    return { word: '', marks: null };
  });

  const nextStage = Math.min(stage + 1, LEVEL_COUNT);

  if (!loaded) return null;

  return (
    <GameLayout
      top={
        <>
          {daily ? (
            <DailyHeader />
          ) : (
            <View style={styles.levels}>
              {(Object.keys(LEVELS) as Level[]).map((l) => (
                <Button
                  key={l}
                  label={LEVELS[l].label}
                  variant={l === level ? 'primary' : 'secondary'}
                  onPress={() => restart(l)}
                  style={{ flex: 1 }}
                />
              ))}
            </View>
          )}
          {stats && (
            <Text style={styles.stats}>
              Acertadas {stats.won} de {stats.played}
            </Text>
          )}
          {!daily && <LevelBar game="palabra" variant={level} level={stage} onPick={(s) => restart(level, s)} />}
        </>
      }
      board={
        <View style={{ gap: 6 }}>
          {rows.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row', gap: 6 }}>
              {Array.from({ length: LENGTH }, (_, i) => {
                const mark = row.marks?.[i];
                const letter = row.word[i] ?? '';
                return (
                  <View
                    key={i}
                    style={[
                      styles.tile,
                      { width: tile, height: tile },
                      letter && !mark && { borderColor: colors.text },
                      mark && { backgroundColor: MARK_COLORS[mark], borderColor: MARK_COLORS[mark] },
                    ]}
                  >
                    <Text style={[styles.tileText, { fontSize: tile * 0.5 }, mark && { color: '#fff' }]}>{letter}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      }
      side={
        <>
          <View style={{ minHeight: 48, justifyContent: 'center', width: wide ? panel : boardWidth }}>
            {won ? (
              <Banner text={`¡Acertaste en ${guesses.length}/${tries}!`} />
            ) : over ? (
              <Banner tone="danger" text={`La palabra era ${answer}`} />
            ) : message ? (
              <Text style={styles.message}>{message}</Text>
            ) : null}
          </View>

          {over ? (
            <Button
              label={daily ? 'Jugar partida libre' : won ? 'Siguiente nivel' : 'Reintentar nivel'}
              onPress={daily ? () => router.replace('/palabra') : () => restart(level, won ? nextStage : stage)}
              style={{ width: wide ? panel : boardWidth }}
            />
          ) : (
            <View style={{ gap: 6, width: wide ? panel : Math.min(width - 16, 500) }}>
              {KEYBOARD.map((line) => (
                <View key={line} style={{ flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
                  {[...line].map((k) => {
                    const mark = keys[k];
                    const wide = k === '<' || k === '>';
                    return (
                      <Pressable
                        key={k}
                        onPress={() => press(k)}
                        style={({ pressed }) => [
                          styles.key,
                          { flex: wide ? 1.5 : 1 },
                          mark && { backgroundColor: MARK_COLORS[mark] },
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Text style={[styles.keyText, mark && { color: '#fff' }]}>
                          {k === '<' ? '⌫' : k === '>' ? 'ENVIAR' : k}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  tile: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  tileText: { fontWeight: '800', color: colors.text },
  stats: { fontSize: 15, color: colors.muted },
  levels: { flexDirection: 'row', gap: 6, width: '100%', maxWidth: 460 },
  message: { textAlign: 'center', color: colors.danger, fontWeight: '600', fontSize: 15 },
  key: {
    height: 52,
    backgroundColor: colors.card,
    borderBottomWidth: 3,
    borderBottomColor: '#DAD6CC',
    borderRadius: radius / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 14, fontWeight: '700', color: colors.text },
});
