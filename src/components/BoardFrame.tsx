import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';

const RADIUS = 20;

/**
 * Rounded card with a soft drop shadow that game boards sit in. The shadow lives on an outer view
 * and the rounded clipping on an inner one, because a view that clips its content can't also cast
 * a shadow on iOS.
 */
export function BoardFrame({ children }: { children: ReactNode }) {
  return (
    <View style={styles.shadow}>
      <View style={styles.clip}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: RADIUS,
    backgroundColor: colors.card,
    shadowColor: '#1B2559',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  clip: { borderRadius: RADIUS, overflow: 'hidden' },
});
