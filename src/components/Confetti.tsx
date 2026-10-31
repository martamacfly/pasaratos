import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

const COLORS = ['#F03E3E', '#FCC419', '#40C057', '#339AF0', '#CC5DE8', '#FF922B', '#20C997'];
const PIECES = 80;

/**
 * A burst of confetti falling over the whole screen. Each new `burst` value (e.g. Date.now())
 * starts another one; it never blocks taps on what is underneath.
 */
export function Confetti({ burst }: { burst: number }) {
  const { width, height } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const progress = useRef<Animated.Value[]>([]);

  // New random pieces for every burst.
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, () => ({
        x: Math.random() * width,
        drift: (Math.random() - 0.5) * 160,
        spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 720),
        size: 7 + Math.random() * 7,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        round: Math.random() < 0.3,
        duration: 2200 + Math.random() * 1400,
        delay: Math.random() * 350,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [burst],
  );

  useEffect(() => {
    if (!burst) return;
    progress.current = pieces.map(() => new Animated.Value(0));
    setVisible(true);
    const animation = Animated.parallel(
      pieces.map((p, i) =>
        Animated.timing(progress.current[i], {
          toValue: 1,
          duration: p.duration,
          delay: p.delay,
          easing: Easing.in(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ),
    );
    animation.start(() => setVisible(false));
    return () => animation.stop();
  }, [burst, pieces]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.layer}>
      {pieces.map((p, i) => {
        const value = progress.current[i];
        if (!value) return null;
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: -20,
              width: p.size,
              height: p.round ? p.size : p.size * 0.5,
              borderRadius: p.round ? p.size / 2 : 2,
              backgroundColor: p.color,
              transform: [
                { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, height + 40] }) },
                { translateX: value.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
                { rotate: value.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
              ],
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 10 },
});
