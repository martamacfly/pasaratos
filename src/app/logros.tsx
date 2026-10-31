import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useWindowSize } from '@/hooks/useWindowSize';
import { type Achievement, loadAchievements, type Tier } from '@/achievements';
import { Glyph, MedalGlyph } from '@/components/icons';
import { colors, radius } from '@/theme';

const TIER_COLORS: Record<Tier, string> = { bronce: '#C8793C', plata: '#9AA5B1', oro: '#F2B705' };
const LOCKED = '#CED4DA';

export default function LogrosScreen() {
  const { width } = useWindowSize();
  const [list, setList] = useState<Achievement[]>([]);
  useEffect(() => {
    loadAchievements().then(setList);
  }, []);

  const unlocked = list.filter((a) => a.unlocked).length;
  const content = Math.max(Math.min(width, 900) - 32, 280);
  const columns = content < 560 ? 1 : 2;
  const cardWidth = (content - (columns - 1) * 12) / columns;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.summary, { width: content }]}>
        <Text style={styles.summaryNumber}>
          {unlocked} <Text style={styles.summaryOf}>de {list.length}</Text>
        </Text>
        <Text style={styles.summaryText}>logros conseguidos</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${list.length ? (unlocked / list.length) * 100 : 0}%` }]} />
        </View>
      </View>

      <View style={[styles.grid, { width: content }]}>
        {/* Unlocked first, then the closest to being unlocked. */}
        {[...list]
          .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || b.progress / b.goal - a.progress / a.goal)
          .map((a) => (
            <View key={a.id} style={[styles.card, { width: cardWidth }, !a.unlocked && styles.cardLocked]}>
              <Glyph size={52}>
                <MedalGlyph ink={a.unlocked ? TIER_COLORS[a.tier] : LOCKED} />
              </Glyph>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.title}>{a.title}</Text>
                <Text style={styles.desc}>{a.desc}</Text>
                {!a.unlocked && a.goal > 1 && (
                  <View style={{ gap: 3 }}>
                    <View style={styles.smallTrack}>
                      <View style={[styles.smallFill, { width: `${(a.progress / a.goal) * 100}%` }]} />
                    </View>
                    <Text style={styles.count}>
                      {a.progress} / {a.goal}
                    </Text>
                  </View>
                )}
                {a.unlocked && (
                  <Text style={[styles.tier, { color: TIER_COLORS[a.tier] }]}>{a.tier.toUpperCase()}</Text>
                )}
              </View>
            </View>
          ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, alignItems: 'center' },
  summary: { backgroundColor: colors.card, borderRadius: radius * 1.5, padding: 18, alignItems: 'center', gap: 4 },
  summaryNumber: { fontSize: 40, fontWeight: '900', color: '#E67700' },
  summaryOf: { fontSize: 20, color: colors.muted, fontWeight: '700' },
  summaryText: { fontSize: 15, color: colors.muted, fontWeight: '600' },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFF3BF',
    alignSelf: 'stretch',
    marginTop: 8,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: '#F59F00', borderRadius: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius * 1.25,
    padding: 14,
  },
  cardLocked: { opacity: 0.75 },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  desc: { fontSize: 13, color: colors.muted },
  smallTrack: { height: 6, borderRadius: 3, backgroundColor: '#F1F3F5', overflow: 'hidden' },
  smallFill: { height: '100%', backgroundColor: '#F59F00' },
  count: { fontSize: 12, color: colors.muted, fontWeight: '700' },
  tier: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
});
