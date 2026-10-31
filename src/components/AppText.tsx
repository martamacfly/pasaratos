import { Text as RNText, StyleSheet, type TextProps } from 'react-native';

// Fredoka is loaded as one font family per weight (see the root layout).
export const FONTS = {
  regular: 'Fredoka_400Regular',
  medium: 'Fredoka_500Medium',
  semibold: 'Fredoka_600SemiBold',
  bold: 'Fredoka_700Bold',
};

/** The Fredoka family closest to a CSS-style font weight ('400', '700', 'bold'…). */
export function fontFor(weight?: string | number) {
  const w = weight === 'bold' ? 700 : Number(weight ?? 400) || 400;
  if (w >= 700) return FONTS.bold;
  if (w >= 600) return FONTS.semibold;
  if (w >= 500) return FONTS.medium;
  return FONTS.regular;
}

/**
 * Drop-in replacement for React Native's Text that writes in Fredoka. The weight in the style
 * picks the matching Fredoka family, and is then reset so the platform doesn't fake a bolder one.
 */
export function Text(props: TextProps) {
  const flat = StyleSheet.flatten(props.style) ?? {};
  return (
    <RNText
      {...props}
      style={[props.style, { fontFamily: flat.fontFamily ?? fontFor(flat.fontWeight), fontWeight: 'normal' }]}
    />
  );
}
