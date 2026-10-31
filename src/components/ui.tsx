import { usePathname } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Text } from '@/components/AppText';
import { CelebrateContext } from '@/components/GameLayout';
import { dateKey, dateLabel, shareText, useDailyLog } from '@/daily';
import { useGameTheme } from '@/gameTheme';
import { spendHint, useHints } from '@/hints';
import { share } from '@/share';
import { colors } from '@/theme';

/** Buttons take the colour of the game on screen. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}) {
  const theme = useGameTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary
          ? [styles.primary, { backgroundColor: theme.main, shadowColor: theme.main }]
          : [styles.secondary, { borderColor: theme.soft }],
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
        style,
      ]}
    >
      <Text style={[styles.label, { color: primary ? '#fff' : theme.main }]}>{label}</Text>
    </Pressable>
  );
}

/** Result message under the board; a winning one also throws confetti. */
export function Banner({ text, tone = 'success' }: { text: string; tone?: 'success' | 'danger' }) {
  const celebrate = useContext(CelebrateContext);
  useEffect(() => {
    if (tone === 'success') celebrate();
    // Only when the banner first appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={[styles.banner, { backgroundColor: tone === 'success' ? colors.success : colors.danger }]}>
      <Text style={styles.bannerText}>{text}</Text>
    </View>
  );
}

/** Keys 1..max plus an erase key; `onPress(0)` erases. */
export function NumberPad({ max, onPress, width }: { max: number; onPress: (n: number) => void; width: number }) {
  const theme = useGameTheme();
  return (
    <View style={{ width, flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: max }, (_, k) => k + 1).map((n) => (
        <Pressable
          key={n}
          onPress={() => onPress(n)}
          style={({ pressed }) => [styles.key, { borderBottomColor: theme.soft }, pressed && styles.keyPressed]}
        >
          <Text style={[styles.keyText, { color: theme.main }]}>{n}</Text>
        </Pressable>
      ))}
      <Pressable onPress={() => onPress(0)} style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}>
        <Text style={[styles.keyText, { color: colors.text }]}>⌫</Text>
      </Pressable>
    </View>
  );
}

/**
 * Uses one of the hints of the game on screen. `onHint` applies it to the game and returns false
 * when there was nothing left to give away, so no hint is spent.
 */
export function HintButton({ onHint, style }: { onHint: () => boolean; style?: ViewStyle }) {
  const game = usePathname().split('/').filter(Boolean).pop() ?? '';
  const count = useHints(game);
  const [feedback, setFeedback] = useState<string | null>(null);
  function say(text: string) {
    setFeedback(text);
    setTimeout(() => setFeedback(null), 2500);
  }
  async function onPress() {
    if (count <= 0) return say('Gana el reto del día para otra pista');
    if (!onHint()) return say('No hace falta ninguna pista');
    await spendHint(game);
  }
  return <Button label={feedback ?? `Pista · ${count}`} variant="secondary" onPress={onPress} style={style} />;
}

/** Shares `text` and briefly says on the button whether it was shared or copied. */
export function ShareButton({
  text,
  label = 'Compartir resultado',
  style,
}: {
  text: string;
  label?: string;
  style?: ViewStyle;
}) {
  const [feedback, setFeedback] = useState<string | null>(null);
  async function onPress() {
    const result = await share(text);
    setFeedback(
      result === 'copied'
        ? '¡Copiado! Pégalo donde quieras'
        : result === 'shared'
          ? '¡Compartido!'
          : 'No se pudo compartir',
    );
    setTimeout(() => setFeedback(null), 2500);
  }
  return <Button label={feedback ?? label} onPress={onPress} style={style} />;
}

/**
 * Shown instead of the difficulty buttons while playing the daily challenge. Once today's
 * challenge of this game is done, it offers to share the result.
 */
export function DailyHeader() {
  const theme = useGameTheme();
  const game = usePathname().split('/').filter(Boolean).pop() ?? '';
  const log = useDailyLog();
  const done = log[dateKey()]?.[game];
  return (
    <View style={[styles.daily, { backgroundColor: theme.soft }]}>
      <Text style={[styles.dailyLabel, { color: theme.main }]}>RETO DEL DÍA</Text>
      <Text style={styles.dailyText}>{dateLabel()}</Text>
      {done && <ShareButton text={shareText(log, game)} style={{ alignSelf: 'stretch', marginTop: 6 }} />}
    </View>
  );
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  secondary: { backgroundColor: colors.card, borderWidth: 2 },
  label: { fontSize: 15, fontWeight: '800' },
  banner: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  bannerText: { fontSize: 17, fontWeight: '900', color: '#fff', textAlign: 'center' },
  daily: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'stretch',
    maxWidth: 460,
    width: '100%',
    alignItems: 'center',
    gap: 2,
  },
  dailyLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  dailyText: { fontSize: 15, fontWeight: '700', color: colors.text },
  key: {
    flex: 1,
    height: 56,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderBottomWidth: 3,
    borderBottomColor: '#DAD6CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: { transform: [{ translateY: 2 }], borderBottomWidth: 1 },
  keyText: { fontSize: 22, fontWeight: '800' },
});
