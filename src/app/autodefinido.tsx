import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useWindowSize } from '@/hooks/useWindowSize';
import { GameLayout, useGameSizes } from '@/components/GameLayout';
import { LevelBar } from '@/components/LevelBar';
import { Banner, Button, DailyHeader, formatTime } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { useGameTheme } from '@/gameTheme';
import { type Autodefinido, cellsOf, generate } from '@/games/autodefinido';
import type { Dir, Entry } from '@/games/crucigrama';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { completeLevel, LEVEL_COUNT, levelSeed } from '@/levels';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors, radius } from '@/theme';

const KEYBOARD = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM<'];
const emptyLetters = (p: Autodefinido) => p.cells.map((row) => row.map(() => ''));

export default function AutodefinidoScreen() {
  const { width } = useWindowSize();
  const theme = useGameTheme();
  const { daily, date, seed, saveKey } = useDaily('autodefinido');
  const [stage, setStage] = useState(1);
  const [puzzle, setPuzzle] = useState(() =>
    daily ? withSeed(seed, () => generate()) : withSeed(levelSeed('autodefinido', 'normal', 1), () => generate()),
  );
  const { cols, cells, entries } = puzzle;
  const [letters, setLetters] = useState<string[][]>(() => emptyLetters(puzzle));
  const [active, setActive] = useState(0); // index into entries
  const [pos, setPos] = useState<[number, number]>([entries[0].row, entries[0].col]);
  const [checked, setChecked] = useState(false);
  const [finished, setFinished] = useState(false);

  // Clue cells need room for text, so cells are as large as the screen allows.
  const { wide, board: gridWidth, panel } = useGameSizes(460);
  const cell = Math.min(gridWidth / cols, 64);

  const solved = cells.every((row, r) => row.every((c, k) => c.kind !== 'letter' || letters[r][k] === c.letter));
  const [seconds, setSeconds] = useTimer(!solved);
  const stats = useStats('autodefinido', finished);

  const loaded = useAutosave(saveKey, { date, stage, puzzle, letters, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setStage(s.stage ?? 1);
    setPuzzle(s.puzzle);
    setLetters(s.letters);
    setActive(0);
    setPos([s.puzzle.entries[0].row, s.puzzle.entries[0].col]);
    setSeconds(s.seconds);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !solved || finished) return;
    setFinished(true);
    recordResult('autodefinido', true, seconds);
    if (!daily) completeLevel('autodefinido', 'normal', stage);
    if (daily) recordDaily('autodefinido', true, seconds);
  }, [loaded, solved, finished, seconds, daily, stage]);

  function newGame(s = 1) {
    const p = withSeed(levelSeed('autodefinido', 'normal', s), () => generate());
    setStage(s);
    setPuzzle(p);
    setLetters(emptyLetters(p));
    setActive(0);
    setPos([p.entries[0].row, p.entries[0].col]);
    setChecked(false);
    setSeconds(0);
    setFinished(false);
  }

  const entry = entries[active];
  const activeCells = new Set(cellsOf(entry).map(([r, c]) => `${r},${c}`));
  const entryAt = (r: number, c: number, d: Dir) =>
    entries.findIndex((e) => e.dir === d && cellsOf(e).some(([er, ec]) => er === r && ec === c));

  function selectEntry(k: number) {
    setActive(k);
    const e: Entry = entries[k];
    const empty = cellsOf(e).find(([r, c]) => !letters[r][c]);
    setPos(empty ?? [e.row, e.col]);
  }

  function tapCell(r: number, c: number) {
    const target = cells[r][c];
    if (target.kind === 'clue') {
      // A cell with two clues alternates between them.
      const refs = target.clues.map((x) => x.entry);
      const i = refs.indexOf(active);
      selectEntry(refs[i === -1 ? 0 : (i + 1) % refs.length]);
      return;
    }
    if (target.kind !== 'letter') return;
    const same = entryAt(r, c, entry.dir);
    const other = entryAt(r, c, entry.dir === 'across' ? 'down' : 'across');
    // Tapping the selected cell again switches direction, like in the crossword.
    const next = r === pos[0] && c === pos[1] && other !== -1 ? other : same !== -1 ? same : other;
    setActive(next);
    setPos([r, c]);
  }

  function setLetter(r: number, c: number, l: string) {
    setLetters((prev) => prev.map((row, i) => row.map((v, j) => (i === r && j === c ? l : v))));
    setChecked(false);
  }

  function press(key: string) {
    if (solved) return;
    const path = cellsOf(entry);
    const idx = path.findIndex(([r, c]) => r === pos[0] && c === pos[1]);
    if (key === '<') {
      if (letters[pos[0]][pos[1]]) setLetter(pos[0], pos[1], '');
      else if (idx > 0) {
        const [r, c] = path[idx - 1];
        setLetter(r, c, '');
        setPos([r, c]);
      }
      return;
    }
    setLetter(pos[0], pos[1], key);
    if (idx < path.length - 1) setPos(path[idx + 1]);
  }

  function reveal() {
    const target = cells[pos[0]][pos[1]];
    if (target.kind === 'letter') setLetter(pos[0], pos[1], target.letter);
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

  const nextStage = Math.min(stage + 1, LEVEL_COUNT);

  if (!loaded) return null;

  return (
    <GameLayout
      top={
        <>
          {daily && <DailyHeader />}
          <Text style={styles.timer}>
            {formatTime(seconds)}
            {stats?.best !== undefined && ` · Récord ${formatTime(stats.best)}`}
          </Text>
          {!daily && <LevelBar game="autodefinido" variant={'normal'} level={stage} onPick={(s) => newGame(s)} />}
        </>
      }
      board={
        <View style={styles.board}>
          {cells.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row' }}>
              {row.map((target, c) => {
                const key = `${r},${c}`;
                if (target.kind === 'block')
                  return <View key={key} style={[styles.block, { width: cell, height: cell }]} />;
                if (target.kind === 'clue') {
                  const selected = target.clues.some((x) => x.entry === active);
                  return (
                    <Pressable
                      key={key}
                      onPress={() => tapCell(r, c)}
                      style={[
                        styles.clueCell,
                        { width: cell, height: cell },
                        selected && { backgroundColor: '#FFD43B' },
                      ]}
                    >
                      {target.clues.map((x, k) => (
                        <View
                          key={k}
                          style={[styles.clueHalf, k > 0 && { borderTopWidth: 1, borderTopColor: '#E0C55C' }]}
                        >
                          <Text
                            style={[
                              styles.clueText,
                              { fontSize: Math.max(7, cell * (target.clues.length > 1 ? 0.15 : 0.18)) },
                            ]}
                            numberOfLines={target.clues.length > 1 ? 2 : 3}
                            adjustsFontSizeToFit
                          >
                            {x.short}
                          </Text>
                          <Text style={[styles.arrow, { fontSize: Math.max(8, cell * 0.17) }]}>
                            {x.dir === 'across' ? '▶' : '▼'}
                          </Text>
                        </View>
                      ))}
                    </Pressable>
                  );
                }
                const isPos = r === pos[0] && c === pos[1];
                const wrong = checked && letters[r][c] && letters[r][c] !== target.letter;
                return (
                  <Pressable
                    key={key}
                    onPress={() => tapCell(r, c)}
                    style={[
                      styles.letterCell,
                      { width: cell, height: cell },
                      activeCells.has(key) && { backgroundColor: theme.soft },
                      isPos && { backgroundColor: theme.main + '66' },
                      wrong && { backgroundColor: colors.dangerSoft },
                    ]}
                  >
                    <Text
                      style={{ fontSize: cell * 0.5, fontWeight: '700', color: wrong ? colors.danger : colors.text }}
                    >
                      {letters[r][c]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      }
      side={
        <>
          {solved ? (
            <View style={{ width: panel, gap: 10 }}>
              <Banner text={`¡Autodefinido completo en ${formatTime(seconds)}!`} />
              {daily ? (
                <Button label="Jugar partida libre" onPress={() => router.replace('/autodefinido')} />
              ) : (
                <Button label="Siguiente nivel" onPress={() => newGame(nextStage)} />
              )}
            </View>
          ) : (
            <>
              <View style={[styles.clueBar, { width: panel, backgroundColor: theme.soft }]}>
                <Text style={styles.clueBarText}>
                  {entry.dir === 'across' ? '▶' : '▼'} {entry.clue} ({entry.word.length})
                </Text>
              </View>
              <View style={{ gap: 6, width: wide ? panel : Math.min(width - 16, 500) }}>
                {KEYBOARD.map((line) => (
                  <View key={line} style={{ flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
                    {[...line].map((k) => (
                      <Pressable
                        key={k}
                        onPress={() => press(k)}
                        style={({ pressed }) => [
                          styles.key,
                          { flex: k === '<' ? 1.5 : 1 },
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Text style={styles.keyText}>{k === '<' ? '⌫' : k}</Text>
                      </Pressable>
                    ))}
                  </View>
                ))}
              </View>
              <View style={[styles.actions, { width: panel }]}>
                <Button label="Comprobar" variant="secondary" onPress={() => setChecked(true)} style={{ flex: 1 }} />
                <Button label="Revelar letra" variant="secondary" onPress={reveal} style={{ flex: 1 }} />
              </View>
              {!daily && (
                <Button
                  label="Reiniciar nivel"
                  variant="secondary"
                  onPress={() => newGame(stage)}
                  style={{ width: panel }}
                />
              )}
            </>
          )}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
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
  board: { borderWidth: 1.5, borderColor: colors.text },
  block: { backgroundColor: '#343A40', borderWidth: 0.5, borderColor: '#212529' },
  clueCell: { backgroundColor: '#FFF3BF', borderWidth: 0.5, borderColor: '#BFA13A' },
  clueHalf: { flex: 1, paddingHorizontal: 2, paddingTop: 1, justifyContent: 'space-between' },
  clueText: { color: '#5C4813', fontWeight: '600', lineHeight: undefined },
  arrow: { color: '#E8590C', alignSelf: 'flex-end', lineHeight: undefined },
  letterCell: {
    backgroundColor: colors.card,
    borderWidth: 0.5,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clueBar: { borderRadius: radius, padding: 12 },
  clueBarText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  key: {
    height: 46,
    backgroundColor: colors.card,
    borderBottomWidth: 3,
    borderBottomColor: '#DAD6CC',
    borderRadius: radius / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 14, fontWeight: '700', color: colors.text },
});
