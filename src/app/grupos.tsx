import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameLayout, useGameSizes } from '@/components/GameLayout';
import { Banner, Button, DailyHeader } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { useGameTheme } from '@/gameTheme';
import { groupOf, PUZZLES } from '@/games/grupos';
import { random, shuffle, withSeed } from '@/games/random';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors, radius } from '@/theme';

const MISTAKES = 4;
// Easiest to hardest group.
const GROUP_COLORS = ['#FFE066', '#8CE99A', '#74C0FC', '#D0BFFF'];

/** A puzzle index plus its 16 words in a random order. */
function deal(index: number) {
  return { index, order: shuffle(PUZZLES[index].flatMap((g) => g.words)) };
}

export default function GruposScreen() {
  const theme = useGameTheme();
  const { daily, date, seed, saveKey } = useDaily('grupos');
  const [game, setGame] = useState(() =>
    daily
      ? withSeed(seed, () => deal(Math.floor(random() * PUZZLES.length)))
      : deal(Math.floor(Math.random() * PUZZLES.length)),
  );
  const [found, setFound] = useState<number[]>([]); // group indices, in the order they were solved
  const [mistakes, setMistakes] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [finished, setFinished] = useState(false);
  const puzzle = PUZZLES[game.index];
  const { board, panel } = useGameSizes(460);
  const boardWidth = Math.min(board, 520);
  const tile = (boardWidth - 3 * 8) / 4;

  const won = found.length === 4;
  const lost = mistakes >= MISTAKES;
  const over = won || lost;
  const stats = useStats('grupos', finished);

  const loaded = useAutosave(saveKey, { date, game, found, mistakes, finished }, (s) => {
    if (daily && s.date !== date) return;
    setGame(s.game);
    setFound(s.found);
    setMistakes(s.mistakes);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !over || finished) return;
    setFinished(true);
    recordResult('grupos', won);
    if (daily) recordDaily('grupos', won);
  }, [loaded, over, finished, won, daily]);

  function newGame() {
    let next = game.index;
    while (PUZZLES.length > 1 && next === game.index) next = Math.floor(Math.random() * PUZZLES.length);
    setGame(deal(next));
    setFound([]);
    setMistakes(0);
    setSelected([]);
    setMessage('');
    setFinished(false);
  }

  function toggle(word: string) {
    if (over) return;
    setMessage('');
    setSelected((s) => (s.includes(word) ? s.filter((w) => w !== word) : s.length < 4 ? [...s, word] : s));
  }

  function submit() {
    if (selected.length !== 4) return;
    const groups = selected.map((w) => groupOf(puzzle, w));
    if (groups.every((g) => g === groups[0])) {
      setFound((f) => [...f, groups[0]]);
      setSelected([]);
      return;
    }
    const most = Math.max(...groups.map((g) => groups.filter((x) => x === g).length));
    setMistakes((m) => m + 1);
    setMessage(most === 3 ? '¡Casi! Te falta una' : 'No es un grupo');
  }

  if (!loaded) return null;

  // When the game is lost, the missing groups are revealed too.
  const shown = lost ? [...found, ...[0, 1, 2, 3].filter((g) => !found.includes(g))] : found;
  const remaining = game.order.filter((w) => !shown.includes(groupOf(puzzle, w)));

  return (
    <GameLayout
      top={
        <>
          {daily && <DailyHeader />}
          <Text style={styles.help}>Forma cuatro grupos de cuatro palabras que tengan algo en común.</Text>
          {stats && (
            <Text style={styles.stats}>
              Ganadas {stats.won} de {stats.played}
            </Text>
          )}
        </>
      }
      board={
        <View style={{ width: boardWidth, gap: 8 }}>
          {shown.map((g) => (
            <View key={g} style={[styles.solved, { backgroundColor: GROUP_COLORS[g] }]}>
              <Text style={styles.solvedTitle}>{puzzle[g].title}</Text>
              <Text style={styles.solvedWords}>{puzzle[g].words.join(' · ')}</Text>
            </View>
          ))}
          <View style={styles.grid}>
            {remaining.map((w) => {
              const on = selected.includes(w);
              return (
                <Pressable
                  key={w}
                  onPress={() => toggle(w)}
                  style={({ pressed }) => [
                    styles.tile,
                    { width: tile, height: tile * 0.75 },
                    on && { backgroundColor: theme.main, borderBottomColor: theme.main },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text
                    style={[
                      styles.word,
                      { fontSize: Math.min(15, (tile - 12) / (w.length * 0.82)) },
                      on && { color: '#fff' },
                    ]}
                    numberOfLines={1}
                  >
                    {w}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      }
      side={
        <>
          <View style={styles.mistakes}>
            <Text style={styles.mistakesLabel}>Fallos disponibles:</Text>
            {Array.from({ length: MISTAKES }, (_, k) => (
              <View key={k} style={[styles.dot, k < MISTAKES - mistakes ? styles.dotOn : styles.dotOff]} />
            ))}
          </View>
          <View style={{ minHeight: 22 }}>{message ? <Text style={styles.message}>{message}</Text> : null}</View>

          <View style={{ width: panel, gap: 10 }}>
            {won && <Banner text="¡Todos los grupos encontrados!" />}
            {lost && <Banner tone="danger" text="Se acabaron los fallos. Estas eran las soluciones." />}
            {over ? (
              daily ? (
                <Button label="Jugar partida libre" onPress={() => router.replace('/grupos')} />
              ) : (
                <Button label="Otra partida" onPress={newGame} />
              )
            ) : (
              <View style={styles.row}>
                <Button
                  label="Mezclar"
                  variant="secondary"
                  onPress={() => setGame((g) => ({ ...g, order: shuffle(g.order) }))}
                  style={{ flex: 1 }}
                />
                <Button label="Quitar" variant="secondary" onPress={() => setSelected([])} style={{ flex: 1 }} />
                <Button label="Enviar" onPress={submit} style={{ flex: 1, opacity: selected.length === 4 ? 1 : 0.5 }} />
              </View>
            )}
          </View>
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  help: { fontSize: 14, color: colors.muted, textAlign: 'center', maxWidth: 460 },
  stats: { fontSize: 15, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    backgroundColor: colors.card,
    borderBottomWidth: 3,
    borderBottomColor: '#DAD6CC',
    borderRadius: radius / 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  word: { fontWeight: '800', color: colors.text, textAlign: 'center' },
  solved: { borderRadius: radius / 1.5, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center', gap: 2 },
  solvedTitle: { fontSize: 15, fontWeight: '900', color: colors.text, textTransform: 'uppercase' },
  solvedWords: { fontSize: 13, color: colors.text, textAlign: 'center' },
  mistakes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mistakesLabel: { fontSize: 14, color: colors.muted },
  dot: { width: 14, height: 14, borderRadius: 7 },
  dotOn: { backgroundColor: '#495057' },
  dotOff: { backgroundColor: '#DEE2E6' },
  message: { fontSize: 15, fontWeight: '700', color: colors.danger },
  row: { flexDirection: 'row', gap: 8 },
});
