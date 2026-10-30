import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Banner, Button, DailyHeader } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { keyMarks, type Mark, score } from '@/games/palabra';
import { pick, withSeed } from '@/games/random';
import { SOLUTIONS, VALID } from '@/games/words';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors, radius } from '@/theme';

const LENGTH = 5;
const TRIES = 6;
const KEYBOARD = ['QWERTYUIOP', 'ASDFGHJKLÑ', '<ZXCVBNM>'];

const MARK_COLORS: Record<Mark, string> = {
  correct: '#2F9E44',
  present: '#E8A400',
  absent: '#868E96',
};

export default function PalabraScreen() {
  const { width } = useWindowDimensions();
  const boardWidth = Math.min(width - 32, 340);
  const tile = (boardWidth - (LENGTH - 1) * 6) / LENGTH;

  const { daily, date, seed, saveKey } = useDaily('palabra');
  const [answer, setAnswer] = useState(() => (daily ? withSeed(seed, () => pick(SOLUTIONS)) : pick(SOLUTIONS)));
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [message, setMessage] = useState('');

  const won = guesses.includes(answer);
  const over = won || guesses.length >= TRIES;
  const keys = keyMarks(guesses, answer);
  const [finished, setFinished] = useState(false);
  const stats = useStats('palabra', finished);

  const loaded = useAutosave(saveKey, { date, answer, guesses, finished }, (s) => {
    if (daily && s.date !== date) return;
    setAnswer(s.answer);
    setGuesses(s.guesses);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !over || finished) return;
    setFinished(true);
    recordResult('palabra', won);
    if (daily) recordDaily('palabra', won);
  }, [loaded, over, finished, won, daily]);

  function press(key: string) {
    if (over) return;
    setMessage('');
    if (key === '<') setCurrent((c) => c.slice(0, -1));
    else if (key === '>') submit();
    else if (current.length < LENGTH) setCurrent((c) => c + key);
  }

  function submit() {
    if (current.length < LENGTH) return setMessage('Faltan letras');
    if (!VALID.has(current)) return setMessage('No está en la lista de palabras');
    setGuesses((g) => [...g, current]);
    setCurrent('');
  }

  function restart() {
    setAnswer(pick(SOLUTIONS));
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

  const rows = Array.from({ length: TRIES }, (_, r) => {
    if (r < guesses.length) return { word: guesses[r], marks: score(guesses[r], answer) };
    if (r === guesses.length && !over) return { word: current, marks: null };
    return { word: '', marks: null };
  });

  if (!loaded) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {daily && <DailyHeader />}
      {stats && (
        <Text style={styles.stats}>
          Acertadas {stats.won} de {stats.played}
        </Text>
      )}
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

      <View style={{ minHeight: 48, justifyContent: 'center', width: boardWidth }}>
        {won ? (
          <Banner text={`¡Acertaste en ${guesses.length}/${TRIES}! 🎉`} />
        ) : over ? (
          <Banner tone="danger" text={`La palabra era ${answer}`} />
        ) : message ? (
          <Text style={styles.message}>{message}</Text>
        ) : null}
      </View>

      {over ? (
        <Button
          label={daily ? 'Jugar partida libre' : 'Otra palabra'}
          onPress={daily ? () => router.replace('/palabra') : restart}
          style={{ width: boardWidth }}
        />
      ) : (
        <View style={{ gap: 6, width: Math.min(width - 16, 500) }}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, alignItems: 'center' },
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
  message: { textAlign: 'center', color: colors.danger, fontWeight: '600', fontSize: 15 },
  key: {
    height: 52,
    backgroundColor: '#E2E0DA',
    borderRadius: radius / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 14, fontWeight: '700', color: colors.text },
});
