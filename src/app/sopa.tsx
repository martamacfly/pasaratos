import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Banner, Button, formatTime } from '@/components/ui';
import { useTimer } from '@/hooks/useTimer';
import { generate, lineBetween } from '@/games/sopa';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors, radius } from '@/theme';

type Level = 'facil' | 'dificil';
const LEVELS: Record<Level, { size: number; words: number; backwards: boolean; label: string }> = {
  facil: { size: 10, words: 8, backwards: false, label: 'Fácil' },
  dificil: { size: 12, words: 12, backwards: true, label: 'Difícil' },
};
const FOUND_COLORS = ['#FFC9C9', '#FFD8A8', '#FFEC99', '#C0EB75', '#96F2D7', '#A5D8FF', '#D0BFFF', '#FCC2D7'];

const create = (l: Level) => generate(LEVELS[l].size, LEVELS[l].words, LEVELS[l].backwards);

export default function SopaScreen() {
  const { width } = useWindowDimensions();
  const [level, setLevel] = useState<Level>('facil');
  const [sopa, setSopa] = useState(() => create('facil'));
  const [found, setFound] = useState<string[]>([]);
  const [start, setStart] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const { size, letters, words } = sopa;
  const boardSize = Math.min(width - 32, 460);
  const cell = boardSize / size;

  const solved = found.length === words.length;
  const [seconds, setSeconds] = useTimer(!solved);
  const stats = useStats(`sopa:${level}`, finished);

  const loaded = useAutosave('sopa', { level, sopa, found, seconds, finished }, (s) => {
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
  }, [loaded, solved, finished, level, seconds]);

  function newGame(l: Level) {
    setLevel(l);
    setSopa(create(l));
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

  if (!loaded) return null;

  const colorOf = new Map<number, string>();
  words.forEach((w) => {
    const k = found.indexOf(w.word);
    if (k !== -1) w.cells.forEach((c) => colorOf.set(c, FOUND_COLORS[k % FOUND_COLORS.length]));
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
      <Text style={styles.help}>
        Toca la primera y la última letra de cada palabra.
        {LEVELS[level].backwards ? ' Pueden estar al revés.' : ''}
      </Text>
      <Text style={styles.timer}>
        ⏱ {formatTime(seconds)} · {found.length}/{words.length}
        {stats?.best !== undefined && ` · 🏆 ${formatTime(stats.best)}`}
      </Text>

      <View style={[styles.grid, { width: boardSize, height: boardSize }]}>
        {letters.map((l, i) => (
          <Pressable
            key={i}
            onPress={() => tap(i)}
            style={[
              styles.cell,
              { width: cell, height: cell },
              colorOf.has(i) && { backgroundColor: colorOf.get(i) },
              start === i && { backgroundColor: colors.accent },
            ]}
          >
            <Text style={{ fontSize: cell * 0.5, fontWeight: '700', color: start === i ? '#fff' : colors.text }}>
              {l}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ width: boardSize, gap: 10 }}>
        {solved && <Banner text={`¡Todas encontradas en ${formatTime(seconds)}! 🎉`} />}
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
        <Button label="Nueva sopa" variant={solved ? 'primary' : 'secondary'} onPress={() => newGame(level)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 6, maxWidth: 460, width: '100%' },
  help: { fontSize: 14, color: colors.muted, textAlign: 'center', maxWidth: 460 },
  timer: { fontSize: 16, color: colors.muted, fontVariant: ['tabular-nums'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.card, borderRadius: radius, overflow: 'hidden' },
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
