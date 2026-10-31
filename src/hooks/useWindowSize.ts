import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';

/**
 * Like `useWindowDimensions`, but safe for the pre-rendered web pages. Those are built without a
 * window (size 0×0), and when the browser takes over the page React keeps the sizes written into
 * that HTML. So the first render always reports 0×0, matching the pre-rendered page, and the real
 * size arrives right after, as a normal update that the browser does apply.
 */
export function useWindowSize() {
  const size = useWindowDimensions();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? size : { ...size, width: 0, height: 0 };
}
