import { type ComponentRef, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { ShareCard, type ShareCardData } from '@/components/ShareCard';
import { canShareNatively, copy, NETWORKS, share, shareTo } from '@/share';
import { canShareImage, shareCardImage } from '@/shareImage';
import { colors, radius } from '@/theme';

/**
 * Menu for sharing a result or an achievement. As text: straight to a social network, copied, or
 * through the system's own share sheet where there is one. With a `card`, also as a picture with the
 * logo, which goes through the system's share sheet (where Instagram, WhatsApp, X… are) or, on
 * computers, is downloaded to upload anywhere.
 */
export function ShareSheet({ text, card, onClose }: { text: string; card?: ShareCardData; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'text' | 'image'>(card ? 'image' : 'text');
  const [status, setStatus] = useState<string | null>(null);
  const cardView = useRef<ComponentRef<typeof View>>(null);
  const imageShares = canShareImage();

  async function sendImage() {
    if (!card) return;
    setStatus('Preparando la imagen…');
    const result = await shareCardImage(card, cardView);
    setStatus(
      result === 'downloaded'
        ? 'Imagen descargada: súbela a la red que quieras'
        : result === 'failed'
          ? 'No se pudo crear la imagen'
          : null,
    );
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Taps on the card itself don't close it. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <ScrollView contentContainerStyle={{ gap: 10 }}>
            <Text style={styles.title}>Compartir</Text>
            {card && (
              <View style={styles.tabs}>
                {(['text', 'image'] as const).map((m) => (
                  <Pressable
                    key={m}
                    accessibilityRole="button"
                    accessibilityState={{ selected: mode === m }}
                    onPress={() => setMode(m)}
                    style={[styles.tab, mode === m && styles.tabOn]}
                  >
                    <Text style={[styles.tabText, mode === m && styles.tabTextOn]}>
                      {m === 'text' ? 'Texto' : 'Imagen'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            {card && mode === 'image' ? (
              <>
                <View style={{ alignItems: 'center' }}>
                  <ShareCard ref={cardView} card={card} size={260} />
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={sendImage}
                  style={({ pressed }) => [styles.network, styles.primary, pressed && styles.pressed]}
                >
                  <Text style={styles.networkText}>
                    {imageShares ? 'Compartir imagen en redes' : 'Descargar imagen'}
                  </Text>
                </Pressable>
                <Text style={styles.status}>
                  {status ??
                    (imageShares
                      ? 'Elige Instagram, WhatsApp, X… en el menú que se abre.'
                      : 'Descárgala y súbela a la red social que quieras.')}
                </Text>
              </>
            ) : (
              <>
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
              </>
            )}
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </ScrollView>
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
    maxHeight: '92%',
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
  tabs: { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: 12, padding: 3, gap: 3 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  tabOn: { backgroundColor: colors.accent },
  tabText: { fontSize: 14, fontWeight: '800', color: colors.text },
  tabTextOn: { color: '#fff' },
  primary: { backgroundColor: colors.accent, flexGrow: 0, flexBasis: 'auto' },
  status: { fontSize: 13, color: colors.muted, textAlign: 'center', fontWeight: '600' },
  cancel: { alignItems: 'center', paddingVertical: 6 },
  cancelText: { color: colors.muted, fontSize: 15, fontWeight: '700' },
});
