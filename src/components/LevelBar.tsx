import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Glyph, LockGlyph } from '@/components/icons';
import { useGameTheme } from '@/gameTheme';
import { isUnlocked, LEVEL_COUNT, useLevelProgress } from '@/levels';
import { colors } from '@/theme';

/**
 * "Nivel N" with arrows to move between open levels, and a grid of all levels of the
 * current difficulty showing which are completed, open or still locked.
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

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <Pressable disabled={!canPrev} onPress={() => onPick(level - 1)} style={[styles.arrow, !canPrev && styles.off]}>
          <Text style={[styles.arrowText, { color: theme.main }]}>‹</Text>
        </Pressable>
        <Pressable onPress={() => setOpen((o) => !o)} style={[styles.current, { backgroundColor: theme.soft }]}>
          <Text style={[styles.currentText, { color: theme.main }]}>
            Nivel {level} de {count}
          </Text>
          <Text style={styles.progressText}>
            {done.length} completados · {open ? 'ocultar' : 'ver todos'}
          </Text>
        </Pressable>
        <Pressable disabled={!canNext} onPress={() => onPick(level + 1)} style={[styles.arrow, !canNext && styles.off]}>
          <Text style={[styles.arrowText, { color: theme.main }]}>›</Text>
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
