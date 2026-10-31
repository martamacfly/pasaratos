import { type ComponentRef, forwardRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { FONTS, Text, TextScaleContext } from '@/components/AppText';
import { GameIconParts, Glyph, MedalGlyph } from '@/components/icons';
import { SITE_URL } from '@/games/catalog';
import type { Tier } from '@/achievements';

// The shareable picture of a result or an achievement: the logo, a big badge and three lines of text.
// Drawn at `size` px; phones take a 1080 px snapshot of it and the web redraws it on a canvas
// (see shareImage.ts), taking the badge from this view. Sizes below are for 1080 px and get scaled.

export type ShareBadge = { medal: Tier } | { game: string } | { count: string };
export type ShareCardData = { kicker: string; title: string; subtitle: string; badge: ShareBadge };

export const CARD_COLORS = { from: '#5C7CFA', to: '#364FC7' };
const TIER_INK = { bronce: '#E8954F', plata: '#C9D1DA', oro: '#FFC93C' } as const;
/** Id of the badge's view, so the web can find its drawing. */
export const BADGE_ID = 'share-card-badge';
export const BADGE_SIZE = 400;

function Badge({ badge, size }: { badge: ShareBadge; size: number }) {
  if ('medal' in badge) {
    return (
      <Glyph size={size}>
        <MedalGlyph ink={TIER_INK[badge.medal]} />
      </Glyph>
    );
  }
  if ('game' in badge) {
    // The icon's own tile, a bit smaller so it doesn't crowd the text.
    return (
      <Svg width={size} height={size} viewBox="-12 -12 124 124">
        <Rect x={-6} y={-6} width={112} height={112} rx={28} fill="rgba(255,255,255,0.25)" />
        <GameIconParts id={badge.game} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={42} fill="#FFC93C" />
      <Circle cx={50} cy={50} r={34} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={3} />
      <SvgText
        x={50}
        y={50}
        fill="#364FC7"
        fontSize={badge.count.length > 4 ? 20 : 26}
        fontWeight="900"
        fontFamily={FONTS.black}
        textAnchor="middle"
        alignmentBaseline="central"
      >
        {badge.count}
      </SvgText>
    </Svg>
  );
}

export const ShareCard = forwardRef<ComponentRef<typeof View>, { card: ShareCardData; size: number }>(
  function ShareCard({ card, size }, ref) {
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
            <LinearGradient id="share-card" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={CARD_COLORS.from} />
              <Stop offset="1" stopColor={CARD_COLORS.to} />
            </LinearGradient>
          </Defs>
          <Rect width="100" height="100" fill="url(#share-card)" />
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
            <View nativeID={BADGE_ID}>
              <Badge badge={card.badge} size={BADGE_SIZE * s} />
            </View>
            <Text style={[styles.soft, text(38, FONTS.black, { letterSpacing: 6 * s, marginTop: 10 * s })]}>
              {card.kicker}
            </Text>
            <Text
              style={[styles.white, text(80, FONTS.black, { textAlign: 'center', marginTop: 8 * s })]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {card.title}
            </Text>
            <Text
              style={[
                styles.soft,
                text(40, FONTS.semibold, { textAlign: 'center', marginTop: 6 * s, paddingHorizontal: 80 * s }),
              ]}
            >
              {card.subtitle}
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
