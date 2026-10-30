import { useMemo, useRef } from 'react';
import { PanResponder } from 'react-native';

type Handlers = {
  /** Finger down (or click) on a cell. */
  onStart: (cell: number) => void;
  /** Finger moved into a neighbouring cell; fast moves are split into single steps. */
  onEnter: (cell: number) => void;
};

/**
 * Touch/mouse dragging over an n×n grid of `cellSize` px. Spread the returned handlers on the
 * grid container and give its children `pointerEvents="none"`, so positions are measured
 * against the container itself. The container also needs `userSelect: 'none'`: on the web a
 * text selection starting mid-drag would otherwise cancel the gesture.
 */
export function useGridDrag(n: number, cellSize: number, handlers: Handlers) {
  const latest = useRef({ n, cellSize, handlers });
  latest.current = { n, cellSize, handlers };
  const origin = useRef({ x: 0, y: 0 });
  const last = useRef<number | null>(null);

  return useMemo(() => {
    const cellAt = (pageX: number, pageY: number) => {
      const { n, cellSize } = latest.current;
      const c = Math.floor((pageX - origin.current.x) / cellSize);
      const r = Math.floor((pageY - origin.current.y) / cellSize);
      return r < 0 || c < 0 || r >= n || c >= n ? null : r * n + c;
    };

    const moveTo = (pageX: number, pageY: number) => {
      const target = cellAt(pageX, pageY);
      if (target === null || last.current === null) return;
      const { n, handlers } = latest.current;
      let cur = last.current;
      while (cur !== target) {
        const dr = Math.floor(target / n) - Math.floor(cur / n);
        const dc = (target % n) - (cur % n);
        cur += Math.abs(dr) >= Math.abs(dc) ? Math.sign(dr) * n : Math.sign(dc);
        handlers.onEnter(cur);
      }
      last.current = target;
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const { pageX, pageY, locationX, locationY } = e.nativeEvent;
        // The grant event lands on the container, so this gives its position on the page.
        origin.current = { x: pageX - locationX, y: pageY - locationY };
        last.current = cellAt(pageX, pageY);
        if (last.current !== null) latest.current.handlers.onStart(last.current);
      },
      onPanResponderMove: (e) => moveTo(e.nativeEvent.pageX, e.nativeEvent.pageY),
      // The final position can arrive only with the release, so it counts as a last move.
      onPanResponderRelease: (e) => {
        moveTo(e.nativeEvent.pageX, e.nativeEvent.pageY);
        last.current = null;
      },
      onPanResponderTerminate: () => {
        last.current = null;
      },
    }).panHandlers;
  }, []);
}
