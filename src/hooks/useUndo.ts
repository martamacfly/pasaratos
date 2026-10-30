import { useEffect, useRef, useState } from 'react';

/**
 * Undo for a piece of game state. Every change of `value` is remembered (except the ones made by
 * `undo` itself), and the history is cleared whenever `resetKey` changes, e.g. on a new board.
 */
export function useUndo<T>(value: T, setValue: (v: T) => void, resetKey: unknown) {
  const stack = useRef<T[]>([]);
  const previous = useRef(value);
  const undoing = useRef(false);
  const [size, setSize] = useState(0);

  // Declared first so a new board clears the history before its value is compared below.
  useEffect(() => {
    stack.current = [];
    previous.current = value;
    setSize(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    if (undoing.current) undoing.current = false;
    else if (previous.current !== value) {
      stack.current.push(previous.current);
      setSize(stack.current.length);
    }
    previous.current = value;
  }, [value]);

  function undo() {
    const last = stack.current.pop();
    if (last === undefined) return;
    undoing.current = true;
    setSize(stack.current.length);
    setValue(last);
  }

  return { undo, canUndo: size > 0 };
}
