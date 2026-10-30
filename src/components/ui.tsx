import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { dateLabel } from '@/daily';
import { colors, radius } from '@/theme';

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
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.primary : styles.secondary,
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      <Text style={[styles.label, { color: primary ? '#fff' : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Banner({ text, tone = 'success' }: { text: string; tone?: 'success' | 'danger' }) {
  return (
    <View style={[styles.banner, { backgroundColor: tone === 'success' ? colors.successSoft : colors.dangerSoft }]}>
      <Text style={[styles.bannerText, { color: tone === 'success' ? colors.success : colors.danger }]}>{text}</Text>
    </View>
  );
}

/** Shown instead of the difficulty buttons while playing the daily challenge. */
export function DailyHeader() {
  return (
    <View style={styles.daily}>
      <Text style={styles.dailyText}>📅 Reto del día · {dateLabel()}</Text>
    </View>
  );
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  button: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius, alignItems: 'center' },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 15, fontWeight: '600' },
  banner: { padding: 12, borderRadius: radius, alignItems: 'center' },
  bannerText: { fontSize: 16, fontWeight: '700' },
  daily: {
    backgroundColor: '#FFF3BF',
    borderRadius: radius,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'stretch',
    maxWidth: 460,
    width: '100%',
    alignItems: 'center',
  },
  dailyText: { fontSize: 15, fontWeight: '700', color: '#8F6400' },
});
