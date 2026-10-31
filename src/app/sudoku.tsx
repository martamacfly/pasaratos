import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { router } from 'expo-router';
import { BoardFrame } from '@/components/BoardFrame';
import { GameLayout, useGameSizes } from '@/components/GameLayout';
import { LevelBar } from '@/components/LevelBar';
import { Banner, Button, DailyHeader, formatTime, HintButton, TimerText } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { useUndo } from '@/hooks/useUndo';
import { withWrong } from '@/games/latin';
import { type Board, conflicts, type Difficulty, generate, sameUnit } from '@/games/sudoku';
import { completeLevel, LEVEL_COUNT, levelSeed } from '@/levels';
import { useSettings } from '@/settings';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors, radius, tone } from '@/theme';

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: 'facil', label: 'Fácil' },
  { key: 'medio', label: 'Medio' },
  { key: 'dificil', label: 'Difícil' },
  { key: 'experto', label: 'Experto' },
];

export default function SudokuScreen() {
  const { wide, board: size, panel } = useGameSizes();
  const cell = size / 9;

  const { daily, date, seed, saveKey } = useDaily('sudoku');
  const [stage, setStage] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>(daily ? 'medio' : 'facil');
  const [game, setGame] = useState(() =>
    daily
      ? withSeed(seed, () => generate('medio'))
      : withSeed(levelSeed('sudoku', 'facil', 1), () => generate('facil')),
  );
  const [board, setBoard] = useState<Board>(game.puzzle);
  // Pencil marks per cell, as a bitmask of digits 1-9.
  const [notes, setNotes] = useState<number[]>(() => Array(81).fill(0));
  // Undo covers both the digits and the pencil marks.
  const undoState = useMemo(() => ({ board, notes }), [board, notes]);
  const { undo, canUndo } = useUndo(
    undoState,
    (v) => {
      setBoard(v.board);
      setNotes(v.notes);
    },
    game,
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState(false);

  const [finished, setFinished] = useState(false);

  const solved = board.every((n, i) => n === game.solution[i]);
  const [seconds, setSeconds] = useTimer(!solved);
  const { showErrors, highlight } = useSettings();
  // With "show errors" on, any number that doesn't match the solution is shown as wrong too.
  const bad = useMemo(
    () => (showErrors ? withWrong(conflicts(board), board, game.solution) : conflicts(board)),
    [board, showErrors, game.solution],
  );
  const stats = useStats(`sudoku:${difficulty}`, finished);

  const loaded = useAutosave(saveKey, { date, stage, difficulty, game, board, notes, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setStage(s.stage ?? 1);
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
    if (!daily) completeLevel('sudoku', difficulty, stage);
    if (daily) recordDaily('sudoku', true, seconds);
  }, [loaded, solved, finished, difficulty, seconds, daily, stage]);

  function newGame(d: Difficulty, s = 1) {
    const g = withSeed(levelSeed('sudoku', d, s), () => generate(d));
    setStage(s);
    setDifficulty(d);
    setGame(g);
    setBoard(g.puzzle);
    setNotes(Array(81).fill(0));
    setSelected(null);
    setSeconds(0);
    setFinished(false);
  }

  // Hint: puts the right value in the selected cell if it needs one, otherwise in the first that does.
  function hint() {
    const needs = (i: number) => game.puzzle[i] === 0 && board[i] !== game.solution[i];
    const i = selected !== null && needs(selected) ? selected : board.findIndex((_, k) => needs(k));
    if (i === -1) return false;
    setBoard((prev) => prev.map((v, k) => (k === i ? game.solution[i] : v)));
    setSelected(i);
    return true;
  }

  const nextStage = Math.min(stage + 1, LEVEL_COUNT);

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
    <GameLayout
      top={
        <>
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
          <TimerText style={styles.timer} seconds={seconds} best={stats?.best} />
          {!daily && (
            <LevelBar game="sudoku" variant={difficulty} level={stage} onPick={(s) => newGame(difficulty, s)} />
          )}
        </>
      }
      board={
        <BoardFrame>
          <View style={[styles.grid, { width: size, height: size }]}>
            {board.map((n, i) => {
              const r = Math.floor(i / 9);
              const c = i % 9;
              const given = game.puzzle[i] !== 0;
              const isSelected = i === selected;
              const related = highlight && selected !== null && sameUnit(i, selected);
              const sameNumber = highlight && n !== 0 && n === selectedValue;
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
                    related && { backgroundColor: tone('#EEF2FF') },
                    sameNumber && { backgroundColor: colors.accentSoft },
                    isSelected && { backgroundColor: tone('#BAC8FF') },
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
        </BoardFrame>
      }
      side={
        solved ? (
          <View style={{ width: panel, gap: 10 }}>
            <Banner text={`¡Resuelto en ${formatTime(seconds)}!`} />
            {daily ? (
              <Button label="Jugar partida libre" onPress={() => router.replace('/sudoku')} />
            ) : (
              <Button label="Siguiente nivel" onPress={() => newGame(difficulty, nextStage)} />
            )}
          </View>
        ) : (
          <View style={{ width: panel, gap: 10 }}>
            <View style={[styles.row, wide && styles.padWide]}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                const used = board.filter((v) => v === n).length >= 9;
                return (
                  <Pressable
                    key={n}
                    onPress={() => input(n)}
                    style={[styles.key, wide && styles.keyWide, { opacity: used ? 0.3 : 1 }]}
                  >
                    <Text style={styles.keyText}>{n}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.row}>
              <Button label="Borrar" variant="secondary" onPress={() => input(0)} style={{ flex: 1 }} />
              <Button
                label="Deshacer"
                variant="secondary"
                onPress={undo}
                style={{ flex: 1, opacity: canUndo ? 1 : 0.5 }}
              />
              <Button
                label="Notas"
                variant={notesMode ? 'primary' : 'secondary'}
                onPress={() => setNotesMode((m) => !m)}
                style={{ flex: 1 }}
              />
            </View>
            {!daily && <HintButton onHint={hint} />}
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  padWide: { flexWrap: 'wrap' },
  keyWide: { flexBasis: '30%', aspectRatio: 1.6 },
  row: { flexDirection: 'row', gap: 6, alignSelf: 'stretch', maxWidth: 460, width: '100%' },
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
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.card,
    boxSizing: 'content-box',
    borderRadius: 20,
    overflow: 'hidden',
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
