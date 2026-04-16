import { useLayoutEffect, useRef, useState } from 'react';

/** Reports toolbar “wide” layout; must match `@min-[640px]:` on `@container` toolbar classes. */
export const REPORTS_TOOLBAR_WIDE_MIN_PX = 640;

/**
 * True when the content column is narrower than the toolbar “wide” breakpoint
 * (filter + actions on one row). Uses ResizeObserver so preview widths and real viewports match.
 */
export function useContainerNarrowToolbar() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [narrowToolbar, setNarrowToolbar] = useState(true);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      setNarrowToolbar(el.getBoundingClientRect().width < REPORTS_TOOLBAR_WIDE_MIN_PX);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { containerRef, narrowToolbar };
}
