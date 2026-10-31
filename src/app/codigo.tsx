import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { BoardFrame } from '@/components/BoardFrame';
import { GameLayout, useGameSizes } from '@/components/GameLayout';
import { LevelBar } from '@/components/LevelBar';
import { Banner, Button, DailyHeader, formatTime, HintButton } from '@/components/ui';
import { recordDaily, useDaily } from '@/daily';
import { feedback, generate, type Level, LEVELS, PEG_COLORS, TRIES } from '@/games/codigo';
import { withSeed } from '@/games/random';
import { useTimer } from '@/hooks/useTimer';
import { completeLevel, LEVEL_COUNT, levelSeed } from '@/levels';
import { recordResult, useAutosave, useStats } from '@/storage';
import { colors } from '@/theme';

export default function CodigoScreen() {
  const { board: size, panel } = useGameSizes(400);
  const { daily, date, seed, saveKey } = useDaily('codigo');
  const [stage, setStage] = useState(1);
  const [level, setLevel] = useState<Level>('medio');
  const [secret, setSecret] = useState(() =>
    daily
      ? withSeed(seed, () => generate('medio'))
      : withSeed(levelSeed('codigo', 'medio', 1), () => generate('medio')),
  );
  const [guesses, setGuesses] = useState<number[][]>([]);
  const [shown, setShown] = useState<number[]>([]); // positions revealed by hints
  const [current, setCurrent] = useState<(number | null)[]>(() => Array(secret.length).fill(null));
  const [finished, setFinished] = useState(false);
  const { length, colors: colorCount } = LEVELS[level];
  // Ten rows have to fit with the colour palette below them on a phone.
  const peg = Math.min((size - 16) / (length + 2.2), 32);

  const won = guesses.some((g) => g.join() === secret.join());
  const lost = !won && guesses.length >= TRIES;
  const over = won || lost;
  const [seconds, setSeconds] = useTimer(!over);
  const stats = useStats(`codigo:${level}`, finished);

  const loaded = useAutosave(saveKey, { date, stage, level, secret, guesses, shown, seconds, finished }, (s) => {
    if (daily && s.date !== date) return;
    setStage(s.stage ?? 1);
    setLevel(s.level);
    setSecret(s.secret);
    setGuesses(s.guesses);
    setShown(s.shown ?? []);
    setCurrent(Array(s.secret.length).fill(null));
    setSeconds(s.seconds);
    setFinished(s.finished);
  });

  useEffect(() => {
    if (!loaded || !over || finished) return;
    setFinished(true);
    recordResult(`codigo:${level}`, won, seconds);
    if (!daily && won) completeLevel('codigo', level, stage);
    if (daily) recordDaily('codigo', won, seconds);
  }, [loaded, over, finished, level, won, seconds, daily, stage]);

  function newGame(l: Level, s = 1) {
    const code = withSeed(levelSeed('codigo', l, s), () => generate(l));
    setStage(s);
    setLevel(l);
    setSecret(code);
    setGuesses([]);
    setCurrent(Array(code.length).fill(null));
    setSeconds(0);
    setFinished(false);
    setShown([]);
  }

  function addColor(c: number) {
    if (over) return;
    setCurrent((cur) => {
      const i = cur.indexOf(null);
      return i === -1 ? cur : cur.map((v, k) => (k === i ? c : v));
    });
  }

  function submit() {
    if (over || current.includes(null)) return;
    setGuesses((g) => [...g, current as number[]]);
    setCurrent(Array(secret.length).fill(null));
  }

  // Hint: shows the colour of one position of the secret code.
  function hint() {
    const k = secret.findIndex((_, i) => !shown.includes(i));
    if (over || k === -1) return false;
    setShown((s) => [...s, k]);
    return true;
  }

  const nextStage = Math.min(stage + 1, LEVEL_COUNT);

  if (!loaded) return null;

  const Pegs = ({ guess }: { guess: number[] }) => {
    const { exact, near } = feedback(guess, secret);
    const dots = [
      ...Array(exact).fill('exact'),
      ...Array(near).fill('near'),
      ...Array(length - exact - near).fill('none'),
    ];
    return (
      <View style={[styles.pegs, { width: peg * 1.1 }]}>
        {dots.map((d, k) => (
          <View key={k} style={[styles.dot, d === 'exact' && styles.dotExact, d === 'near' && styles.dotNear]} />
        ))}
      </View>
    );
  };

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
            Adivina el código secreto de {length} colores
            {LEVELS[level].repeat ? ' (pueden repetirse)' : ' (sin repetir)'}. Tras cada intento: punto negro, color en
            su sitio; punto blanco, color que está pero en otro sitio.
          </Text>
          <Text style={styles.timer}>
            {formatTime(seconds)} · Intento {over ? guesses.length : guesses.length + 1}/{TRIES}
            {stats?.best !== undefined && ` · Récord ${formatTime(stats.best)}`}
          </Text>
          {!daily && <LevelBar game="codigo" variant={level} level={stage} onPick={(s) => newGame(level, s)} />}
        </>
      }
      board={
        <BoardFrame>
          <View style={[styles.board, { width: size }]}>
            {Array.from({ length: TRIES }, (_, r) => {
              const guess = guesses[r];
              const isCurrent = r === guesses.length && !over;
              const row = guess ?? (isCurrent ? current : Array(length).fill(null));
              return (
                <View key={r} style={[styles.boardRow, isCurrent && styles.currentRow]}>
                  {row.map((c, k) => (
                    <Pressable
                      key={k}
                      disabled={!isCurrent || c === null}
                      onPress={() => setCurrent((cur) => cur.map((v, i) => (i === k ? null : v)))}
                      style={[
                        styles.peg,
                        { width: peg, height: peg, borderRadius: peg / 2 },
                        c !== null && { backgroundColor: PEG_COLORS[c], borderColor: PEG_COLORS[c] },
                      ]}
                    />
                  ))}
                  {guess ? <Pegs guess={guess} /> : <View style={{ width: peg * 1.1 }} />}
                </View>
              );
            })}
            {over && (
              <View style={[styles.boardRow, styles.secretRow]}>
                {secret.map((c, k) => (
                  <View
                    key={k}
                    style={[
                      styles.peg,
                      {
                        width: peg,
                        height: peg,
                        borderRadius: peg / 2,
                        backgroundColor: PEG_COLORS[c],
                        borderColor: '#fff',
                      },
                    ]}
                  />
                ))}
                <Text style={styles.secretLabel}>código</Text>
              </View>
            )}
          </View>
        </BoardFrame>
      }
      side={
        <View style={{ width: panel, gap: 10 }}>
          {won && <Banner text={`¡Código descifrado en ${guesses.length} intentos!`} />}
          {lost && <Banner tone="danger" text="Se acabaron los intentos" />}
          {!daily && !over && shown.length > 0 && (
            <View style={styles.hintRow}>
              <Text style={styles.hintLabel}>Pista</Text>
              {secret.map((c, k) => (
                <View
                  key={k}
                  style={[
                    styles.hintPeg,
                    shown.includes(k) && { backgroundColor: PEG_COLORS[c], borderColor: PEG_COLORS[c] },
                  ]}
                />
              ))}
            </View>
          )}
          {!daily && !over && <HintButton onHint={hint} />}
          {over ? (
            daily ? (
              <Button label="Jugar partida libre" onPress={() => router.replace('/codigo')} />
            ) : (
              <Button
                label={won ? 'Siguiente nivel' : 'Reintentar nivel'}
                onPress={() => newGame(level, won ? nextStage : stage)}
              />
            )
          ) : (
            <>
              <View style={styles.palette}>
                {PEG_COLORS.slice(0, colorCount).map((c, k) => (
                  <Pressable
                    key={c}
                    onPress={() => addColor(k)}
                    style={({ pressed }) => [
                      styles.swatch,
                      { backgroundColor: c },
                      pressed && { transform: [{ scale: 0.92 }] },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.row}>
                <Button
                  label="Borrar"
                  variant="secondary"
                  onPress={() =>
                    setCurrent((cur) => {
                      const last = cur.map((v) => v !== null).lastIndexOf(true);
                      return last === -1 ? cur : cur.map((v, k) => (k === last ? null : v));
                    })
                  }
                  style={{ flex: 1 }}
                />
                <Button
                  label="Comprobar"
                  onPress={submit}
                  style={{ flex: 1, opacity: current.includes(null) ? 0.5 : 1 }}
                />
              </View>
            </>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  hintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  hintLabel: { fontSize: 14, fontWeight: '700', color: colors.muted },
  hintPeg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#DEE2E6',
    backgroundColor: '#F8F9FA',
  },
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
  board: { backgroundColor: colors.card, borderRadius: 16, padding: 8, gap: 6 },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 4,
    borderRadius: 12,
  },
  currentRow: { backgroundColor: '#F1F3F5' },
  secretRow: { backgroundColor: '#343A40' },
  secretLabel: { color: '#fff', fontWeight: '800', fontSize: 12 },
  peg: { borderWidth: 2, borderColor: '#DEE2E6', backgroundColor: '#F8F9FA' },
  pegs: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E9ECEF' },
  dotExact: { backgroundColor: '#212529' },
  dotNear: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#212529' },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  swatch: { width: 46, height: 46, borderRadius: 23, borderWidth: 3, borderColor: '#fff' },
});
