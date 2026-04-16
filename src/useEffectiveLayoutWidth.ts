import { useEffect, useState } from 'react';

/**
 * Width used for responsive layout when preview presets simulate a viewport.
 * When `previewViewportWidth` is set, that value wins; otherwise `window.innerWidth`.
 */
export function useEffectiveLayoutWidth(previewViewportWidth: number | null): number {
  const [innerWidth, setInnerWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    if (previewViewportWidth != null) return;
    const onResize = () => setInnerWidth(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [previewViewportWidth]);

  return previewViewportWidth ?? innerWidth;
}
