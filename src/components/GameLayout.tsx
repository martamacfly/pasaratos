import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

const WIDE = 900; // from this width the game is laid out like a web page, with a side panel
const PANEL = 360;
const GAP = 32;

/**
 * Sizes for a game screen. On phones the board fills the width (up to `max`) and the
 * controls below it match the board. On wide screens the board grows (up to 600 px) and
 * the controls go in a side panel of fixed width.
 */
export function useGameSizes(max = 460) {
  const { width } = useWindowDimensions();
  const wide = width >= WIDE;
  // The pre-rendered web page starts with width 0; keep sizes positive until it is measured.
  const screen = Math.max(width, 320);
  const board = wide ? Math.min(screen - 64 - PANEL - GAP, 600) : Math.min(screen - 32, max);
  return { wide, board, panel: wide ? PANEL : board };
}

/**
 * Page structure shared by every game: `top` (levels, help, timer) above, then the board and
 * the controls. Phones stack them in one column; wide screens put the controls beside the board.
 * `scroll` is off for games played by dragging, where a scrolling page would steal the gesture.
 */
export function GameLayout({
  top,
  board,
  side,
  scroll = true,
}: {
  top?: ReactNode;
  board: ReactNode;
  side?: ReactNode;
  scroll?: boolean;
}) {
  const { wide, board: boardSize, panel } = useGameSizes();
  const content = (
    <>
      {top && (
        <View
          style={[styles.top, { width: wide ? boardSize + GAP + panel : '100%', maxWidth: wide ? undefined : 460 }]}
        >
          {top}
        </View>
      )}
      <View style={wide ? styles.row : styles.column}>
        <View style={styles.column}>{board}</View>
        {side && <View style={[styles.column, wide && { width: panel }]}>{side}</View>}
      </View>
    </>
  );
  if (!scroll) return <View style={[styles.page, wide && styles.pageWide]}>{content}</View>;
  return <ScrollView contentContainerStyle={[styles.page, wide && styles.pageWide]}>{content}</ScrollView>;
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12, alignItems: 'center', flexGrow: 1 },
  pageWide: { paddingVertical: 28, gap: 20 },
  top: { gap: 10, alignItems: 'center' },
  row: { flexDirection: 'row', gap: GAP, alignItems: 'flex-start', justifyContent: 'center' },
  column: { gap: 12, alignItems: 'center' },
});
