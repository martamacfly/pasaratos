import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

/**
 * "‹ Inicio" in the header of every screen. Goes back when there is a previous screen; when a
 * game was opened directly (a shared link, a reload, a bookmark) there is none, so it opens the menu.
 */
export function HomeButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver al inicio"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.chevron}>‹</Text>
      <Text style={styles.label}>Inicio</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingLeft: 10,
    paddingRight: 14,
    marginLeft: 8,
    marginRight: 12,
  },
  chevron: { color: '#fff', fontSize: 24, fontWeight: '800', lineHeight: 26, marginTop: -2 },
  label: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
