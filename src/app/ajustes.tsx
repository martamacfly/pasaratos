import Constants from 'expo-constants';
import { type ReactNode, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { FONTS, Text } from '@/components/AppText';
import { Button } from '@/components/ui';
import { eraseProgress, exportBackup, importBackup, restartApp } from '@/backup';
import { confirm } from '@/confirm';
import { useGameTheme } from '@/gameTheme';
import { useWindowSize } from '@/hooks/useWindowSize';
import { REMINDERS_AVAILABLE, scheduleReminder } from '@/reminder';
import { type Settings, updateSettings, useSettings } from '@/settings';
import { share } from '@/share';
import { colors, radius } from '@/theme';

const CREATORS_URL = 'https://martamacfly.github.io/piconeratech';

const THEMES: { value: Settings['theme']; label: string }[] = [
  { value: 'auto', label: 'Automático' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

export default function AjustesScreen() {
  const { width } = useWindowSize();
  const settings = useSettings();
  const theme = useGameTheme();
  const [message, setMessage] = useState<{ key: string; text: string } | null>(null);
  const [code, setCode] = useState('');
  const content = Math.max(Math.min(width, 680) - 32, 280);

  function say(key: string, text: string) {
    setMessage({ key, text });
    setTimeout(() => setMessage((m) => (m?.text === text ? null : m)), 3500);
  }

  // Colours are chosen when the app starts, so these two restart it.
  function changeLook(change: Partial<Settings>) {
    updateSettings(change);
    restartApp();
  }

  async function setReminder(hour: number | null) {
    const ok = await scheduleReminder(hour);
    if (ok) updateSettings({ reminder: hour });
    else {
      updateSettings({ reminder: null });
      say('reminder', 'Permite las notificaciones de Pasaratos en los ajustes del móvil');
    }
  }

  async function copyBackup() {
    const result = await share(await exportBackup());
    say(
      'backup',
      result === 'copied'
        ? 'Código copiado. Guárdalo en un lugar seguro'
        : result === 'shared'
          ? 'Código compartido'
          : 'No se pudo copiar el código',
    );
  }

  function restore() {
    if (!code.trim()) return say('restore', 'Pega primero el código de tu copia');
    confirm('¿Restaurar la copia?', 'Se sustituirá todo tu progreso actual por el de la copia.', async () => {
      if (await importBackup(code)) restartApp();
      else say('restore', 'Ese código no es una copia válida');
    });
  }

  function erase() {
    confirm(
      '¿Borrar todo el progreso?',
      'Se borrarán las partidas, niveles, estadísticas, retos, logros y pistas. Los ajustes se mantienen.',
      async () => {
        await eraseProgress();
        restartApp();
      },
      'Borrar',
    );
  }

  const toggle = (key: keyof Settings) => (
    <Toggle value={settings[key] as boolean} onChange={(value) => updateSettings({ [key]: value })} />
  );
  const note = (key: string) =>
    message?.key === key && <Text style={[styles.note, { color: theme.main }]}>{message.text}</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{ width: content, gap: 22 }}>
        <Section title="Aspecto">
          <Row label="Tema" desc="Automático sigue el modo claro u oscuro del dispositivo." stacked>
            <View style={styles.segments}>
              {THEMES.map((t) => {
                const on = settings.theme === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => !on && changeLook({ theme: t.value })}
                    style={[styles.segment, on && { backgroundColor: theme.main }]}
                  >
                    <Text style={[styles.segmentText, on && { color: '#fff' }]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Row>
          <Row label="Texto grande" desc="Letra más grande en menús, botones y textos.">
            {toggle('bigText')}
          </Row>
          <Row
            label="Modo para daltónicos"
            desc="Naranja y azul en Palabra oculta, y colores fáciles de distinguir en Descifrar el código y Conectar colores."
          >
            <Toggle value={settings.colorblind} onChange={(value) => changeLook({ colorblind: value })} />
          </Row>
        </Section>

        <Section title="Al jugar">
          <Row label="Mostrar cronómetro" desc="El tiempo y el récord de cada partida.">
            {toggle('showTimer')}
          </Row>
          <Row
            label="Marcar errores al momento"
            desc="En Sudoku, Futoshiki, Calcudoku y Binario, un número equivocado se pone en rojo."
          >
            {toggle('showErrors')}
          </Row>
          <Row
            label="Resaltar en Sudoku"
            desc="La fila, columna y cuadro de la casilla elegida, y los números iguales."
          >
            {toggle('highlight')}
          </Row>
          <Row label="Confirmar antes de reiniciar" desc="Pregunta antes de borrar la partida con «Reiniciar».">
            {toggle('confirmRestart')}
          </Row>
        </Section>

        <Section title="Efectos">
          <Row
            label="Vibración"
            desc="Al tocar botones y al ganar o perder. En la web, solo si el navegador puede vibrar."
          >
            {toggle('haptics')}
          </Row>
          <Row label="Confeti" desc="Al completar un nivel.">
            {toggle('confetti')}
          </Row>
        </Section>

        <Section title="Recordatorio del reto del día">
          {REMINDERS_AVAILABLE ? (
            <>
              <Row label="Recordarme cada día" desc="Una notificación para no perder la racha.">
                <Toggle value={settings.reminder !== null} onChange={(on) => setReminder(on ? 20 : null)} />
              </Row>
              {settings.reminder !== null && (
                <Row label="Hora">
                  <View style={styles.stepper}>
                    <Stepper label="−" onPress={() => setReminder((settings.reminder! + 23) % 24)} />
                    <Text style={styles.hour}>{String(settings.reminder).padStart(2, '0')}:00</Text>
                    <Stepper label="+" onPress={() => setReminder((settings.reminder! + 1) % 24)} />
                  </View>
                </Row>
              )}
              {note('reminder')}
            </>
          ) : (
            <Text style={styles.desc}>Disponible en la app para móvil: la web no puede enviar avisos diarios.</Text>
          )}
        </Section>

        <Section title="Tus datos">
          <Text style={styles.desc}>
            Tu progreso se guarda solo en este dispositivo. Copia el código para llevarlo a otro o no perderlo.
          </Text>
          <Button label="Copiar código de copia de seguridad" onPress={copyBackup} />
          {note('backup')}
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Pega aquí un código para restaurarlo"
            placeholderTextColor={colors.muted}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          <Button label="Restaurar copia" variant="secondary" onPress={restore} />
          {note('restore')}
          <View style={styles.divider} />
          <Pressable onPress={erase} style={({ pressed }) => [styles.danger, pressed && { opacity: 0.85 }]}>
            <Text style={styles.dangerText}>Borrar todo el progreso</Text>
          </Pressable>
          <Text style={styles.desc}>
            Los logros se calculan a partir de tu progreso, así que también vuelven a cero.
          </Text>
        </Section>

        <Section title="Acerca de">
          <Row label="Versión">
            <Text style={styles.value}>{Constants.expoConfig?.version ?? '—'}</Text>
          </Row>
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL(CREATORS_URL).catch(() => {})}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.desc}>Creado por</Text>
              <Text style={[styles.label, { color: theme.main }]}>Piconera Tech</Text>
            </View>
            <Text style={[styles.label, { color: theme.main }]}>›</Text>
          </Pressable>
        </Section>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

/** A setting: its name and description, with the control on the right (or below, when `stacked`). */
function Row({
  label,
  desc,
  stacked,
  children,
}: {
  label: string;
  desc?: string;
  stacked?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={stacked ? styles.stacked : styles.row}>
      <View style={{ flex: stacked ? undefined : 1, gap: 2 }}>
        <Text style={styles.label}>{label}</Text>
        {desc && <Text style={styles.desc}>{desc}</Text>}
      </View>
      {children}
    </View>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  const theme = useGameTheme();
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ true: theme.main, false: colors.border }}
      thumbColor="#fff"
      // On the web the thumb takes this colour when on (teal by default).
      {...({ activeThumbColor: '#fff' } as object)}
    />
  );
}

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useGameTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.step, { borderColor: theme.soft }, pressed && { opacity: 0.7 }]}
    >
      <Text style={[styles.stepText, { color: theme.main }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, alignItems: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.muted, letterSpacing: 1.2, marginLeft: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius * 1.5,
    padding: 16,
    gap: 14,
    shadowColor: '#1B2559',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stacked: { gap: 10 },
  label: { fontSize: 16, fontWeight: '800', color: colors.text },
  desc: { fontSize: 13, color: colors.muted, fontWeight: '500' },
  value: { fontSize: 16, fontWeight: '800', color: colors.muted },
  note: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  segments: { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: 12, padding: 3, gap: 3 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  segmentText: { fontSize: 14, fontWeight: '800', color: colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  step: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  stepText: { fontSize: 22, fontWeight: '800' },
  hour: { fontSize: 18, fontWeight: '800', color: colors.text, minWidth: 56, textAlign: 'center' },
  input: {
    minHeight: 70,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
  danger: { backgroundColor: colors.danger, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  dangerText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
