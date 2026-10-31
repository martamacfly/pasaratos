import { useContext, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { BoardCoverContext } from '@/components/GameLayout';
import { CheckGlyph, Glyph, LockGlyph } from '@/components/icons';
import { Button } from '@/components/ui';
import { useGameTheme } from '@/gameTheme';
import { isUnlocked, LEVEL_COUNT, useLevelProgress } from '@/levels';
import { colors } from '@/theme';

/**
 * "Nivel N" with arrows to move between open levels, a button to restart the current one from
 * scratch, and a grid of all levels of the current difficulty showing which are completed, open
 * or still locked. Opening a game or changing difficulty jumps to the first level not yet completed.
 * A level already completed is marked as such whenever it is on screen, and when it is opened again
 * its board is covered by a card offering to replay it or go on to the next one.
 */
export function LevelBar({
  game,
  variant,
  level,
  count = LEVEL_COUNT,
  onPick,
}: {
  game: string;
  variant: string | number;
  level: number;
  /** How many levels there are, when a game has its own number. */
  count?: number;
  onPick: (level: number) => void;
}) {
  const theme = useGameTheme();
  const [done, loaded] = useLevelProgress(game, variant);
  const setCover = useContext(BoardCoverContext);
  // The level the cover was last decided for, so finishing a level doesn't hide the solved board.
  const checked = useRef<string | null>(null);
  // The variant last seen: a new one (opening the game, changing difficulty) means a fresh start.
  const lastVariant = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const canPrev = level > 1;
  const canNext = level < count && isUnlocked(done, level + 1);
  const completed = done.includes(level);

  useEffect(() => {
    const key = `${variant}:${level}`;
    if (!loaded || checked.current === key) return;
    checked.current = key;
    const freshStart = lastVariant.current !== String(variant);
    lastVariant.current = String(variant);
    if (!done.includes(level)) {
      setCover(null);
      return;
    }
    const firstOpen = Array.from({ length: count }, (_, k) => k + 1).find((n) => !done.includes(n));
    if (freshStart && firstOpen !== undefined) {
      setCover(null);
      onPick(firstOpen);
      return;
    }
    setCover(
      <View style={styles.card}>
        <View style={styles.badge}>
          <Glyph size={30}>
            <CheckGlyph ink="#fff" />
          </Glyph>
        </View>
        <Text style={styles.cardTitle}>¡Nivel {level} completado!</Text>
        <Text style={styles.cardText}>Ya superaste este nivel. Puedes jugarlo otra vez o seguir con el siguiente.</Text>
        <Button
          label="Volver a jugarlo"
          variant="secondary"
          onPress={() => {
            setCover(null);
            onPick(level);
          }}
          style={{ alignSelf: 'stretch' }}
        />
        {level < count && (
          <Button label="Siguiente nivel" onPress={() => onPick(level + 1)} style={{ alignSelf: 'stretch' }} />
        )}
      </View>,
    );
  }, [loaded, done, level, variant, count, onPick, setCover]);

  // Leaving the screen (or changing game) removes the card.
  useEffect(() => () => setCover(null), [setCover]);

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <Pressable disabled={!canPrev} onPress={() => onPick(level - 1)} style={[styles.arrow, !canPrev && styles.off]}>
          <Text style={[styles.arrowText, { color: theme.main }]}>‹</Text>
        </Pressable>
        <Pressable
          onPress={() => setOpen((o) => !o)}
          style={[styles.current, { backgroundColor: completed ? colors.successSoft : theme.soft }]}
        >
          <Text style={[styles.currentText, { color: completed ? colors.success : theme.main }]}>
            Nivel {level} de {count}
          </Text>
          <Text style={[styles.progressText, completed && { color: colors.success }]}>
            {completed ? '✓ Completado' : `${done.length} completados`} · {open ? 'ocultar' : 'ver todos'}
          </Text>
        </Pressable>
        <Pressable disabled={!canNext} onPress={() => onPick(level + 1)} style={[styles.arrow, !canNext && styles.off]}>
          <Text style={[styles.arrowText, { color: theme.main }]}>›</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reiniciar nivel"
          onPress={() => onPick(level)}
          style={({ pressed }) => [styles.arrow, styles.restart, pressed && { opacity: 0.7 }]}
        >
          <Text style={[styles.restartIcon, { color: theme.main }]}>↺</Text>
          <Text style={[styles.restartText, { color: theme.main }]}>Reiniciar</Text>
        </Pressable>
      </View>

      {open && (
        <View style={styles.grid}>
          {Array.from({ length: count }, (_, k) => k + 1).map((n) => {
            const completed = done.includes(n);
            const unlocked = isUnlocked(done, n);
            return (
              <Pressable
                key={n}
                disabled={!unlocked}
                onPress={() => {
                  onPick(n);
                  setOpen(false);
                }}
                style={[
                  styles.dot,
                  completed && { backgroundColor: theme.main, borderColor: theme.main },
                  !unlocked && styles.locked,
                  n === level && { borderColor: colors.text, borderWidth: 3 },
                ]}
              >
                {unlocked ? (
                  <Text style={[styles.dotText, completed && { color: '#fff' }]}>{n}</Text>
                ) : (
                  <Glyph size={18}>
                    <LockGlyph ink="#ADB5BD" />
                  </Glyph>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: 460, gap: 10 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: {
    width: 44,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { fontSize: 30, fontWeight: '800', lineHeight: 34 },
  off: { opacity: 0.35 },
  restart: { width: 64 },
  restartIcon: { fontSize: 20, fontWeight: '900', lineHeight: 22 },
  restartText: { fontSize: 10, fontWeight: '800' },
  current: { flex: 1, borderRadius: 14, paddingVertical: 6, alignItems: 'center' },
  currentText: { fontSize: 16, fontWeight: '900' },
  progressText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 22,
    gap: 12,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 20, fontWeight: '900', color: colors.text, textAlign: 'center' },
  cardText: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 4 },
  dot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: '#DEE2E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locked: { backgroundColor: '#F1F3F5' },
  dotText: { fontSize: 15, fontWeight: '800', color: colors.text },
});
