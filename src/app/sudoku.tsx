import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Banner, Button, DailyHeader, formatTime } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { type Board, conflicts, type Difficulty, generate, sameUnit } from '@/games/sudoku';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors, radius } from '@/theme';

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: 'facil', label: 'Fácil' },
  { key: 'medio', label: 'Medio' },
  { key: 'dificil', label: 'Difícil' },
];

export default function SudokuScreen() {
  const { width } = useWindowDimensions();
  const size = Math.min(width - 32, 460);
  const cell = size / 9;

  const { daily, date, seed, saveKey } = useDaily('sudoku');
  const [difficulty, setDifficulty] = useState<Difficulty>(daily ? 'medio' : 'facil');
  const [game, setGame] = useState(() => (daily ? withSeed(seed, () => generate('medio')) : generate('facil')));
  const [board, setBoard] = useState<Board>(game.puzzle);
  // Pencil marks per cell, as a bitmask of digits 1-9.
  const [notes, setNotes] = useState<number[]>(() => Array(81).fill(0));
  const [selected, setSelected] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState(false);

  const [finished, setFinished] = useState(false);

  const solved = board.every((n, i) => n === game.solution[i]);
  const [seconds, setSeconds] = useTimer(!solved);
  const bad = useMemo(() => conflicts(board), [board]);
  const stats = useStats(`sudoku:${difficulty}`, finished);

  const loaded = useAutosave(saveKey, { date, difficulty, game, board, notes, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setDifficulty(s.difficulty);
    setGame(s.game);
    setBoard(s.board);
    setNotes(s.notes);
    setSeconds(s.seconds);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !solved || finished) return;
    setFinished(true);
    recordResult(`sudoku:${difficulty}`, true, seconds);
    if (daily) recordDaily('sudoku', true, seconds);
  }, [loaded, solved, finished, difficulty, seconds, daily]);

  function newGame(d: Difficulty) {
    const g = generate(d);
    setDifficulty(d);
    setGame(g);
    setBoard(g.puzzle);
    setNotes(Array(81).fill(0));
    setSelected(null);
    setSeconds(0);
    setFinished(false);
  }

  if (!loaded) return null;

  function input(n: number) {
    if (selected === null || game.puzzle[selected] !== 0 || solved) return;
    if (notesMode && n !== 0) {
      setNotes((prev) => prev.map((m, i) => (i === selected ? m ^ (1 << n) : m)));
      return;
    }
    setBoard((prev) => prev.map((v, i) => (i === selected ? n : v)));
    if (n !== 0) {
      // Placing a digit clears it from the notes of every related cell.
      setNotes((prev) => prev.map((m, i) => (i === selected ? 0 : sameUnit(i, selected) ? m & ~(1 << n) : m)));
    }
  }

  const selectedValue = selected !== null ? board[selected] : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {daily ? (
        <DailyHeader />
      ) : (
        <View style={styles.row}>
          {DIFFICULTIES.map((d) => (
            <Button
              key={d.key}
              label={d.label}
              variant={d.key === difficulty ? 'primary' : 'secondary'}
              onPress={() => newGame(d.key)}
              style={{ flex: 1 }}
            />
          ))}
        </View>
      )}
      <Text style={styles.timer}>
        ⏱ {formatTime(seconds)}
        {stats?.best !== undefined && ` · 🏆 ${formatTime(stats.best)}`}
      </Text>

      <View style={[styles.grid, { width: size, height: size }]}>
        {board.map((n, i) => {
          const r = Math.floor(i / 9);
          const c = i % 9;
          const given = game.puzzle[i] !== 0;
          const isSelected = i === selected;
          const related = selected !== null && sameUnit(i, selected);
          const sameNumber = n !== 0 && n === selectedValue;
          return (
            <Pressable
              key={i}
              onPress={() => setSelected(i)}
              style={[
                styles.cell,
                {
                  width: cell,
                  height: cell,
                  borderRightWidth: c === 8 ? 0 : c % 3 === 2 ? 2 : 0.5,
                  borderBottomWidth: r === 8 ? 0 : r % 3 === 2 ? 2 : 0.5,
                },
                related && { backgroundColor: '#EEF2FF' },
                sameNumber && { backgroundColor: colors.accentSoft },
                isSelected && { backgroundColor: '#BAC8FF' },
              ]}
            >
              {n !== 0 ? (
                <Text
                  style={{
                    fontSize: cell * 0.55,
                    fontWeight: given ? '700' : '500',
                    color: bad.has(i) && !given ? colors.danger : given ? colors.text : colors.accent,
                  }}
                >
                  {n}
                </Text>
              ) : (
                <View style={styles.notes}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                    <Text key={d} style={[styles.note, { width: cell / 3 - 1, fontSize: cell * 0.22 }]}>
                      {notes[i] & (1 << d) ? d : ''}
                    </Text>
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {solved ? (
        <View style={{ width: size, gap: 10 }}>
          <Banner text={`¡Resuelto en ${formatTime(seconds)}! 🎉`} />
          {daily ? (
            <Button label="Jugar partida libre" onPress={() => router.replace('/sudoku')} />
          ) : (
            <Button label="Nueva partida" onPress={() => newGame(difficulty)} />
          )}
        </View>
      ) : (
        <View style={{ width: size, gap: 10 }}>
          <View style={styles.row}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
              const used = board.filter((v) => v === n).length >= 9;
              return (
                <Pressable
                  key={n}
                  onPress={() => input(n)}
                  style={[styles.key, { opacity: used ? 0.3 : 1 }]}
                >
                  <Text style={styles.keyText}>{n}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.row}>
            <Button label="Borrar" variant="secondary" onPress={() => input(0)} style={{ flex: 1 }} />
            <Button
              label={notesMode ? '✏️ Notas: sí' : '✏️ Notas: no'}
              variant={notesMode ? 'primary' : 'secondary'}
              onPress={() => setNotesMode((m) => !m)}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 6, alignSelf: 'stretch', maxWidth: 460, width: '100%' },
  timer: { fontSize: 16, color: colors.muted, fontVariant: ['tabular-nums'] },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.card,
    boxSizing: 'content-box',
  },
  cell: { alignItems: 'center', justifyContent: 'center', borderColor: colors.text },
  notes: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', height: '100%', padding: 1 },
  note: { textAlign: 'center', color: colors.muted },
  key: {
    flex: 1,
    aspectRatio: 0.8,
    backgroundColor: colors.card,
    borderRadius: radius / 2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 22, fontWeight: '600', color: colors.accent },
});
