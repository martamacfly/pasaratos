import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { FlagGlyph, Glyph, MineGlyph } from '@/components/icons';
import { Banner, Button, DailyHeader, formatTime } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { countAround, dailyBoard, flood, type Level, LEVELS, neighbors, placeMines } from '@/games/buscaminas';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors } from '@/theme';

const NUMBER_COLORS = ['', '#1971C2', '#2F9E44', '#E03131', '#5F3DC4', '#C92A2A', '#0C8599', '#212529', '#868E96'];

type State = {
  level: Level;
  mines: boolean[] | null; // null until the first tap, so it can never hit a mine
  revealed: boolean[];
  flags: boolean[];
  lost: boolean;
};

const fresh = (level: Level): State => {
  const cells = LEVELS[level].size ** 2;
  return { level, mines: null, revealed: Array(cells).fill(false), flags: Array(cells).fill(false), lost: false };
};

const dailyState = (level: Level): State => {
  const { size, mines: count } = LEVELS[level];
  const { mines, start } = dailyBoard(size, count);
  const s = fresh(level);
  flood(mines, s.revealed, s.flags, start, size).forEach((i) => (s.revealed[i] = true));
  return { ...s, mines };
};

export default function BuscaminasScreen() {
  const { width } = useWindowDimensions();
  const { daily, date, seed, saveKey } = useDaily('buscaminas');
  const [state, setState] = useState<State>(() => (daily ? withSeed(seed, () => dailyState('medio')) : fresh('facil')));
  const [flagMode, setFlagMode] = useState(false);
  const [finished, setFinished] = useState(false);
  const { level, mines, revealed, flags, lost } = state;
  const { size, mines: mineCount } = LEVELS[level];
  const boardSize = Math.min(width - 32, 460);
  const cell = boardSize / size;

  const won = mines !== null && !lost && revealed.every((r, i) => r || mines[i]);
  const over = won || lost;
  const [seconds, setSeconds] = useTimer(mines !== null && !over);
  const stats = useStats(`buscaminas:${level}`, finished);

  const loaded = useAutosave(saveKey, { date, state, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setState(s.state);
    setSeconds(s.seconds);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !over || finished) return;
    setFinished(true);
    recordResult(`buscaminas:${level}`, won, seconds);
    if (daily) recordDaily('buscaminas', won, seconds);
  }, [loaded, over, finished, level, won, seconds, daily]);

  function newGame(l: Level) {
    setState(fresh(l));
    setSeconds(0);
    setFinished(false);
  }

  function open(s: State, cells: number[]): State {
    const field = s.mines!;
    const revealed = [...s.revealed];
    let lost = s.lost;
    for (const i of cells) {
      if (revealed[i] || s.flags[i]) continue;
      if (field[i]) {
        lost = true;
        revealed[i] = true;
      } else {
        flood(field, revealed, s.flags, i, size).forEach((j) => (revealed[j] = true));
      }
    }
    return { ...s, revealed, lost };
  }

  function tap(i: number) {
    if (over) return;
    setState((s) => {
      if (flagMode) {
        if (s.revealed[i]) return s;
        return { ...s, flags: s.flags.map((f, j) => (j === i ? !f : f)) };
      }
      if (s.flags[i]) return s;
      const withMines = s.mines ? s : { ...s, mines: placeMines(size, mineCount, i) };
      // Tapping an opened number whose flags are all placed opens the rest of its neighbours.
      if (s.revealed[i] && s.mines) {
        const around = neighbors(i, size);
        const flagged = around.filter((j) => s.flags[j]).length;
        return flagged === countAround(s.mines, i, size) ? open(s, around) : s;
      }
      return open(withMines, [i]);
    });
  }

  if (!loaded) return null;

  const flagsLeft = mineCount - flags.filter(Boolean).length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
      <Text style={styles.timer}>
        {formatTime(seconds)} · Minas {flagsLeft}
        {stats?.best !== undefined && ` · Récord ${formatTime(stats.best)}`}
      </Text>

      <View style={{ width: boardSize, height: boardSize, flexDirection: 'row', flexWrap: 'wrap' }}>
        {revealed.map((open, i) => {
          const isMine = mines?.[i];
          const showMine = isMine && (open || lost);
          const n = mines && open && !isMine ? countAround(mines, i, size) : 0;
          return (
            <Pressable
              key={i}
              onPress={() => tap(i)}
              style={[
                styles.cell,
                { width: cell, height: cell },
                open ? styles.open : styles.closed,
                open && isMine && { backgroundColor: colors.danger },
              ]}
            >
              {showMine ? (
                <Glyph size={cell * 0.7}>
                  <MineGlyph ink="#212529" />
                </Glyph>
              ) : flags[i] ? (
                <Glyph size={cell * 0.7}>
                  <FlagGlyph ink={colors.danger} />
                </Glyph>
              ) : (
                <Text style={{ fontSize: cell * 0.55, fontWeight: '800', color: NUMBER_COLORS[n] }}>{n || ''}</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={{ width: boardSize, gap: 10 }}>
        {won && <Banner text={`¡Campo despejado en ${formatTime(seconds)}!`} />}
        {lost && <Banner tone="danger" text="¡Boom! Has pisado una mina" />}
        {over ? (
          daily ? (
            <Button label="Jugar partida libre" onPress={() => router.replace('/buscaminas')} />
          ) : (
            <Button label="Otra partida" onPress={() => newGame(level)} />
          )
        ) : (
          <Button
            label={flagMode ? 'Modo bandera: sí' : 'Modo bandera: no'}
            variant={flagMode ? 'primary' : 'secondary'}
            onPress={() => setFlagMode((m) => !m)}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 6, maxWidth: 460, width: '100%' },
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
  cell: { alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: '#B8B4AA' },
  closed: { backgroundColor: '#C9D3E6' },
  open: { backgroundColor: colors.card },
});
