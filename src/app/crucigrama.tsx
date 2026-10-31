import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { useWindowSize } from '@/hooks/useWindowSize';
import { router } from 'expo-router';
import { GameLayout, useGameSizes } from '@/components/GameLayout';
import { LevelBar } from '@/components/LevelBar';
import { Banner, Button, DailyHeader, formatTime } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { useGameTheme } from '@/gameTheme';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { cellsOf, type Dir, type Entry, generate } from '@/games/crucigrama';
import { completeLevel, LEVEL_COUNT, levelSeed } from '@/levels';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors, radius } from '@/theme';

const KEYBOARD = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM<'];

type Level = 'mini' | 'normal' | 'grande';
const LEVELS: Record<Level, { words: number; maxSize: number; label: string }> = {
  mini: { words: 6, maxSize: 8, label: 'Mini' },
  normal: { words: 10, maxSize: 11, label: 'Normal' },
  grande: { words: 16, maxSize: 13, label: 'Grande' },
};
const create = (l: Level) => generate(LEVELS[l].words, LEVELS[l].maxSize);

export default function CrucigramaScreen() {
  const { width } = useWindowSize();
  const theme = useGameTheme();
  const { daily, date, seed, saveKey } = useDaily('crucigrama');
  const [stage, setStage] = useState(1);
  const [level, setLevel] = useState<Level>('normal');
  const [puzzle, setPuzzle] = useState(() =>
    daily
      ? withSeed(seed, () => create('normal'))
      : withSeed(levelSeed('crucigrama', 'normal', 1), () => create('normal')),
  );
  const { cols, grid, entries } = puzzle;
  const [letters, setLetters] = useState<string[][]>(() => grid.map((r) => r.map(() => '')));
  const [pos, setPos] = useState<[number, number]>([entries[0].row, entries[0].col]);
  const [dir, setDir] = useState<Dir>(entries[0].dir);
  const [checked, setChecked] = useState(false);

  const { wide, board: gridWidth, panel } = useGameSizes(460);
  const cell = Math.min(gridWidth / cols, wide ? 56 : 44);

  const solved = grid.every((row, r) => row.every((l, c) => l === null || letters[r][c] === l));
  const [seconds, setSeconds] = useTimer(!solved);
  const [finished, setFinished] = useState(false);
  const stats = useStats(`crucigrama:${level}`, finished);

  const loaded = useAutosave(saveKey, { date, stage, level, puzzle, letters, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setStage(s.stage ?? 1);
    setLevel(s.level ?? 'normal');
    setPuzzle(s.puzzle);
    setLetters(s.letters);
    setPos([s.puzzle.entries[0].row, s.puzzle.entries[0].col]);
    setDir(s.puzzle.entries[0].dir);
    setSeconds(s.seconds);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !solved || finished) return;
    setFinished(true);
    recordResult(`crucigrama:${level}`, true, seconds);
    if (!daily) completeLevel('crucigrama', level, stage);
    if (daily) recordDaily('crucigrama', true, seconds);
  }, [loaded, solved, finished, level, seconds, daily, stage]);

  const entryAt = (r: number, c: number, d: Dir) =>
    entries.find((e) => e.dir === d && cellsOf(e).some(([er, ec]) => er === r && ec === c));
  const active = entryAt(pos[0], pos[1], dir) ?? entryAt(pos[0], pos[1], dir === 'across' ? 'down' : 'across')!;
  const activeCells = new Set(cellsOf(active).map(([r, c]) => `${r},${c}`));

  function newGame(l: Level = level, s = 1) {
    const p = withSeed(levelSeed('crucigrama', l, s), () => create(l));
    setStage(s);
    setLevel(l);
    setPuzzle(p);
    setLetters(p.grid.map((r) => r.map(() => '')));
    setPos([p.entries[0].row, p.entries[0].col]);
    setDir(p.entries[0].dir);
    setChecked(false);
    setSeconds(0);
    setFinished(false);
  }

  function selectCell(r: number, c: number) {
    if (grid[r][c] === null) return;
    const other = dir === 'across' ? 'down' : 'across';
    if (r === pos[0] && c === pos[1] && entryAt(r, c, other)) setDir(other);
    else if (!entryAt(r, c, dir)) setDir(other);
    setPos([r, c]);
  }

  function selectEntry(e: Entry) {
    setDir(e.dir);
    const empty = cellsOf(e).find(([r, c]) => !letters[r][c]);
    setPos(empty ?? [e.row, e.col]);
  }

  function setLetter(r: number, c: number, l: string) {
    setLetters((prev) => prev.map((row, i) => row.map((v, j) => (i === r && j === c ? l : v))));
    setChecked(false);
  }

  function press(key: string) {
    if (solved) return;
    const path = cellsOf(active);
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
    setLetter(pos[0], pos[1], grid[pos[0]][pos[1]]!);
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

  const numberAt = new Map(entries.map((e) => [`${e.row},${e.col}`, e.number]));
  const clues = (d: Dir) => entries.filter((e) => e.dir === d).sort((a, b) => a.number - b.number);

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
                  onPress={() => newGame(l)}
                  style={{ flex: 1 }}
                />
              ))}
            </View>
          )}
          <Text style={styles.timer}>
            {formatTime(seconds)}
            {stats?.best !== undefined && ` · Récord ${formatTime(stats.best)}`}
          </Text>
          {!daily && <LevelBar game="crucigrama" variant={level} level={stage} onPick={(s) => newGame(level, s)} />}
        </>
      }
      board={
        <View>
          {grid.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row' }}>
              {row.map((l, c) => {
                const key = `${r},${c}`;
                if (l === null) return <View key={key} style={{ width: cell, height: cell }} />;
                const isPos = r === pos[0] && c === pos[1];
                const wrong = checked && letters[r][c] && letters[r][c] !== l;
                return (
                  <Pressable
                    key={key}
                    onPress={() => selectCell(r, c)}
                    style={[
                      styles.cell,
                      { width: cell, height: cell },
                      activeCells.has(key) && { backgroundColor: theme.soft },
                      isPos && { backgroundColor: theme.main + '66' },
                      wrong && { backgroundColor: colors.dangerSoft },
                    ]}
                  >
                    {numberAt.has(key) && (
                      <Text style={[styles.number, { fontSize: cell * 0.26 }]}>{numberAt.get(key)}</Text>
                    )}
                    <Text
                      style={{ fontSize: cell * 0.55, fontWeight: '700', color: wrong ? colors.danger : colors.text }}
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
              <Banner text={`¡Crucigrama completo en ${formatTime(seconds)}!`} />
              {daily ? (
                <Button label="Jugar partida libre" onPress={() => router.replace('/crucigrama')} />
              ) : (
                <Button label="Siguiente nivel" onPress={() => newGame(level, nextStage)} />
              )}
            </View>
          ) : (
            <>
              <View style={[styles.clueBar, { width: panel, backgroundColor: theme.soft }]}>
                <Text style={styles.clueBarText}>
                  {active.number} {active.dir === 'across' ? 'Horizontal' : 'Vertical'} · {active.clue}
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
            </>
          )}

          <View style={{ width: panel, gap: 16 }}>
            {(['across', 'down'] as Dir[]).map((d) => (
              <View key={d} style={{ gap: 4 }}>
                <Text style={styles.heading}>{d === 'across' ? 'Horizontales' : 'Verticales'}</Text>
                {clues(d).map((e) => {
                  const done = cellsOf(e).every(([r, c]) => letters[r][c]);
                  return (
                    <Pressable key={`${d}${e.number}`} onPress={() => selectEntry(e)}>
                      <Text
                        style={[
                          styles.clue,
                          e === active && { backgroundColor: theme.soft },
                          done && { color: colors.muted, textDecorationLine: 'line-through' },
                        ]}
                      >
                        <Text style={{ fontWeight: '700' }}>{e.number}.</Text> {e.clue} ({e.word.length})
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
            {!solved && !daily && (
              <Button label="Reiniciar nivel" variant="secondary" onPress={() => newGame(level, stage)} />
            )}
          </View>
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  levels: { flexDirection: 'row', gap: 6, maxWidth: 460, width: '100%' },
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
  cell: {
    borderWidth: 0.5,
    borderColor: colors.text,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { position: 'absolute', top: 1, left: 2, color: colors.muted, fontWeight: '600' },
  clueBar: { borderRadius: radius, padding: 12 },
  clueBarText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  heading: { fontSize: 16, fontWeight: '700', color: colors.text },
  clue: { fontSize: 15, color: colors.text, padding: 4, borderRadius: 6 },
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
