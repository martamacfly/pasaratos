import { createContext, type ReactNode, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useWindowSize } from '@/hooks/useWindowSize';
import { Confetti } from '@/components/Confetti';

/**
 * Lets something inside the page (the level bar) lay a card over the board, e.g. to say that the
 * level on screen was already completed. Passing null removes it.
 */
export const BoardCoverContext = createContext<(cover: ReactNode | null) => void>(() => {});

/** Throws confetti over the page; the victory banner calls it when a game is won. */
export const CelebrateContext = createContext<() => void>(() => {});

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
  const { width, height } = useWindowSize();
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
  const [cover, setCover] = useState<ReactNode | null>(null);
  const [burst, setBurst] = useState(0);
  const openedAt = useRef(Date.now());
  // A game that was already won shows its banner as soon as it is reopened: no confetti for that.
  const celebrate = () => {
    if (Date.now() - openedAt.current > 1500) setBurst(Date.now());
  };
  const boardWithCover = (
    <View>
      {board}
      {cover && <View style={styles.cover}>{cover}</View>}
    </View>
  );
  const content = wide ? (
    <View style={styles.row}>
      <View style={styles.boardColumn}>{boardWithCover}</View>
      <View style={[styles.panel, { width: PANEL }]}>
        {top}
        {side}
      </View>
    </View>
  ) : (
    <>
      {top && <View style={styles.top}>{top}</View>}
      <View style={styles.column}>
        {boardWithCover}
        {side}
      </View>
    </>
  );
  const pageStyle = [styles.page, wide && styles.pageWide];
  const page = scroll ? (
    <ScrollView contentContainerStyle={pageStyle}>{content}</ScrollView>
  ) : (
    <View style={pageStyle}>{content}</View>
  );
  return (
    <BoardCoverContext.Provider value={setCover}>
      <CelebrateContext.Provider value={celebrate}>
        <View style={styles.screen}>
          {page}
          <Confetti burst={burst} />
        </View>
      </CelebrateContext.Provider>
    </BoardCoverContext.Provider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  page: { padding: 16, gap: 12, alignItems: 'center', flexGrow: 1 },
  pageWide: { padding: GAP, justifyContent: 'center' },
  top: { gap: 10, alignItems: 'center', width: '100%', maxWidth: 460 },
  column: { gap: 12, alignItems: 'center' },
  row: { flexDirection: 'row', gap: GAP, alignItems: 'flex-start', justifyContent: 'center' },
  boardColumn: { alignItems: 'center' },
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  panel: {
    gap: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
    padding: PANEL_PADDING,
  },
});
