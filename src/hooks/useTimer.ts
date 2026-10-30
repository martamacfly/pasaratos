import { useEffect, useState } from 'react';

/** Counts seconds while `running` is true. Callers reset or restore it with `setSeconds`. */
export function useTimer(running: boolean) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  return [seconds, setSeconds] as const;
}
