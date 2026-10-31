import { type ComponentRef, forwardRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { Achievement } from '@/achievements';
import { FONTS, Text, TextScaleContext } from '@/components/AppText';
import { Glyph, MedalGlyph } from '@/components/icons';
import { SITE_URL } from '@/games/catalog';

// The shareable image of an achievement. Drawn at `size` px; the phone takes a 1080 px snapshot of
// it, and the web draws the same design on a canvas (see achievementImage.ts). All sizes below are
// for the 1080 px version and get scaled.

export const CARD_COLORS = { from: '#5C7CFA', to: '#364FC7' };
export const TIER_INK = { bronce: '#E8954F', plata: '#C9D1DA', oro: '#FFC93C' } as const;
export const TIER_LABEL = { bronce: 'BRONCE', plata: 'PLATA', oro: 'ORO' } as const;

export const AchievementCard = forwardRef<ComponentRef<typeof View>, { achievement: Achievement; size: number }>(
  function AchievementCard({ achievement: a, size }, ref) {
    const s = size / 1080;
    const text = (px: number, family: string, extra?: object) => ({ fontSize: px * s, fontFamily: family, ...extra });
    return (
      // collapsable={false} keeps the view on Android so it can be captured.
      <View
        ref={ref}
        collapsable={false}
        style={{ width: size, height: size, overflow: 'hidden', borderRadius: 24 * s }}
      >
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="card" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={CARD_COLORS.from} />
              <Stop offset="1" stopColor={CARD_COLORS.to} />
            </LinearGradient>
          </Defs>
          <Rect width="100" height="100" fill="url(#card)" />
        </Svg>
        {/* The card always keeps its own text sizes, whatever the "large text" setting. */}
        <TextScaleContext.Provider value={1}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 28 * s, margin: 80 * s }}>
            <Image
              source={require('../../assets/icon.png')}
              style={{ width: 130 * s, height: 130 * s, borderRadius: 30 * s }}
            />
            <View>
              <Text style={[styles.white, text(64, FONTS.black)]}>Pasaratos</Text>
              <Text style={[styles.soft, text(34, FONTS.semibold)]}>Pasatiempos para cada rato</Text>
            </View>
          </View>
          <View style={{ alignItems: 'center', marginTop: -10 * s }}>
            <Glyph size={400 * s}>
              <MedalGlyph ink={TIER_INK[a.tier]} />
            </Glyph>
            <Text style={[styles.soft, text(38, FONTS.black, { letterSpacing: 6 * s, marginTop: 10 * s })]}>
              ¡LOGRO DESBLOQUEADO!
            </Text>
            <Text style={[styles.white, text(88, FONTS.black, { textAlign: 'center', marginTop: 8 * s })]}>
              {a.title}
            </Text>
            <Text style={[styles.soft, text(40, FONTS.semibold, { textAlign: 'center', marginTop: 6 * s })]}>
              {a.desc} · {TIER_LABEL[a.tier]}
            </Text>
          </View>
          <Text
            style={[styles.soft, text(30, FONTS.bold, { position: 'absolute', bottom: 56 * s, alignSelf: 'center' })]}
          >
            {SITE_URL.replace('https://', '')}
          </Text>
        </TextScaleContext.Provider>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  white: { color: '#fff' },
  soft: { color: 'rgba(255,255,255,0.85)' },
});
