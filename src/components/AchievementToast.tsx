import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Achievement } from '@/achievements';
import { Text } from '@/components/AppText';
import { Glyph, MedalGlyph } from '@/components/icons';
import { ShareButton } from '@/components/ui';
import { achievementShareText } from '@/social';
import { colors, radius, tone } from '@/theme';

const TIER_COLORS = { bronce: tone('#C8793C'), plata: tone('#9AA5B1'), oro: tone('#F2B705') };

/** Card at the bottom of the game announcing achievements just unlocked, with a button to share them. */
export function AchievementToast({ list, onClose }: { list: Achievement[]; onClose: () => void }) {
  // Goes away on its own after a while (counted from when these achievements arrived).
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const timer = setTimeout(() => close.current(), 12000);
    return () => clearTimeout(timer);
  }, [list]);

  const first = list[0];
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.card}>
        <Glyph size={46}>
          <MedalGlyph ink={TIER_COLORS[first.tier]} />
        </Glyph>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.kicker}>{list.length > 1 ? `¡${list.length} LOGROS NUEVOS!` : '¡LOGRO NUEVO!'}</Text>
          <Text style={styles.title}>{list.map((a) => a.title).join(' · ')}</Text>
          <Text style={styles.desc}>{first.desc}</Text>
          <ShareButton text={achievementShareText(first)} label="Compartir logro" style={{ marginTop: 6 }} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} hitSlop={10}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 16, alignItems: 'center', paddingHorizontal: 16 },
  card: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius * 1.5,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  kicker: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2, color: colors.warning },
  title: { fontSize: 17, fontWeight: '900', color: colors.text },
  desc: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  close: { fontSize: 18, fontWeight: '800', color: colors.muted, padding: 2 },
});
