import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

const WIDE = 900; // from this width the game is laid out like a web page, with a side panel
const PANEL = 380;
const GAP = 40;
const HEADER = 64; // navigation bar above the page
const PANEL_PADDING = 18;

/**
 * Sizes for a game screen. On phones the board fills the width (up to `max`) and the controls
 * below it match the board. On wide screens the board is as large as the window height allows
 * (up to 720 px) and everything else goes in a side panel of fixed width.
 */
export function useGameSizes(max = 460) {
  const { width, height } = useWindowDimensions();
  const wide = width >= WIDE;
  // The pre-rendered web page starts with a 0×0 window; keep sizes positive until it is measured.
  const screenW = Math.max(width, 320);
  const screenH = Math.max(height, 600);
  const board = wide
    ? Math.max(Math.min(screenW - 2 * GAP - PANEL - GAP, screenH - HEADER - 2 * GAP, 720), 360)
    : Math.min(screenW - 32, max);
  // `panel` is the width available inside the side panel, for the controls placed there.
  return { wide, board, panel: wide ? PANEL - 2 * PANEL_PADDING : board };
}

/**
 * Page structure shared by every game. Phones stack `top` (levels, help, timer), the board and
 * the controls in one column. Wide screens show the board on the left and a side panel on the
 * right with `top` and the controls, like a desktop web page.
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
  const { wide } = useGameSizes();
  const content = wide ? (
    <View style={styles.row}>
      <View style={styles.boardColumn}>{board}</View>
      <View style={[styles.panel, { width: PANEL }]}>
        {top}
        {side}
      </View>
    </View>
  ) : (
    <>
      {top && <View style={styles.top}>{top}</View>}
      <View style={styles.column}>
        {board}
        {side}
      </View>
    </>
  );
  const pageStyle = [styles.page, wide && styles.pageWide];
  if (!scroll) return <View style={pageStyle}>{content}</View>;
  return <ScrollView contentContainerStyle={pageStyle}>{content}</ScrollView>;
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12, alignItems: 'center', flexGrow: 1 },
  pageWide: { padding: GAP, justifyContent: 'center' },
  top: { gap: 10, alignItems: 'center', width: '100%', maxWidth: 460 },
  column: { gap: 12, alignItems: 'center' },
  row: { flexDirection: 'row', gap: GAP, alignItems: 'flex-start', justifyContent: 'center' },
  boardColumn: { alignItems: 'center' },
  panel: {
    gap: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
    padding: PANEL_PADDING,
  },
});
