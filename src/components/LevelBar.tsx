import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Glyph, LockGlyph } from '@/components/icons';
import { useGameTheme } from '@/gameTheme';
import { isUnlocked, LEVEL_COUNT, useLevelProgress } from '@/levels';
import { colors } from '@/theme';

/**
 * "Nivel N" with arrows to move between open levels, a button to restart the current one from
 * scratch, and a grid of all levels of the current difficulty showing which are completed, open
 * or still locked. A level already completed is marked as such whenever it is on screen.
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
  const done = useLevelProgress(game, variant);
  const [open, setOpen] = useState(false);
  const canPrev = level > 1;
  const canNext = level < count && isUnlocked(done, level + 1);
  const completed = done.includes(level);

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
