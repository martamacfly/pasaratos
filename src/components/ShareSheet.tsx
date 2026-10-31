import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { canShareNatively, copy, NETWORKS, share, shareTo } from '@/share';
import { colors, radius } from '@/theme';

/**
 * Menu for sharing a text: straight to a social network, copied, or through the system's own
 * share sheet (for Instagram and any other app) where there is one.
 */
export function ShareSheet({ text, onClose }: { text: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Taps on the card itself don't close it. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Compartir</Text>
          <Text style={styles.preview} numberOfLines={4}>
            {text}
          </Text>
          <View style={styles.grid}>
            {NETWORKS.map((n) => (
              <Pressable
                key={n.id}
                accessibilityRole="button"
                onPress={() => {
                  shareTo(n, text);
                  onClose();
                }}
                style={({ pressed }) => [styles.network, { backgroundColor: n.color }, pressed && styles.pressed]}
              >
                <Text style={styles.networkText}>{n.name}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={async () => setCopied(await copy(text))}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          >
            <Text style={styles.optionText}>{copied ? '¡Copiado! Pégalo donde quieras' : 'Copiar texto'}</Text>
          </Pressable>
          {canShareNatively() && (
            <Pressable
              accessibilityRole="button"
              onPress={async () => {
                await share(text);
                onClose();
              }}
              style={({ pressed }) => [styles.option, pressed && styles.pressed]}
            >
              <Text style={styles.optionText}>Más opciones (Instagram, correo…)</Text>
            </Pressable>
          )}
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: radius * 1.75,
    padding: 18,
    gap: 10,
  },
  title: { fontSize: 20, fontWeight: '900', color: colors.text },
  preview: {
    fontSize: 13,
    color: colors.muted,
    backgroundColor: colors.bg,
    borderRadius: 10,
    padding: 10,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  // The border keeps the darkest one (X) visible on the dark design.
  network: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  networkText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  option: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionText: { color: colors.text, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  cancel: { alignItems: 'center', paddingVertical: 6 },
  cancelText: { color: colors.muted, fontSize: 15, fontWeight: '700' },
});
