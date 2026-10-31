import { createContext, useContext } from 'react';
import { Text as RNText, StyleSheet, type TextProps } from 'react-native';

// Nunito is loaded as one font family per weight (see the root layout).
export const FONTS = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
};

/** The Nunito family closest to a CSS-style font weight ('400', '700', 'bold'…). */
export function fontFor(weight?: string | number) {
  const w = weight === 'bold' ? 700 : Number(weight ?? 400) || 400;
  if (w >= 900) return FONTS.black;
  if (w >= 800) return FONTS.extrabold;
  if (w >= 700) return FONTS.bold;
  if (w >= 600) return FONTS.semibold;
  if (w >= 500) return FONTS.medium;
  return FONTS.regular;
}

/** How much bigger text is drawn ("large text" setting). Boards set it back to 1 so they keep their fit. */
export const TextScaleContext = createContext(1);

/**
 * Drop-in replacement for React Native's Text that writes in Nunito. The weight in the style
 * picks the matching Nunito family, and is then reset so the platform doesn't fake a bolder one.
 */
export function Text(props: TextProps) {
  const scale = useContext(TextScaleContext);
  const flat = StyleSheet.flatten(props.style) ?? {};
  const scaled =
    scale === 1
      ? {}
      : {
          fontSize: (flat.fontSize ?? 14) * scale,
          ...(typeof flat.lineHeight === 'number' && { lineHeight: flat.lineHeight * scale }),
        };
  return (
    <RNText
      {...props}
      style={[props.style, { fontFamily: flat.fontFamily ?? fontFor(flat.fontWeight), fontWeight: 'normal' }, scaled]}
    />
  );
}
