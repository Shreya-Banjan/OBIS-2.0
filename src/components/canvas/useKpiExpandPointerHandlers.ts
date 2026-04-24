import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/** Squared distance (px) above which we treat the gesture as a drag, not a click. */
const MOVE_THRESH_SQ = 12 * 12;

/**
 * Primary-button pointer up with little movement calls `onToggle`.
 * Used so KPI body clicks do not fire after a real drag reorder.
 */
export function useKpiExpandPointerHandlers(
  onToggle: (() => void) | undefined,
  enabled: boolean,
  shouldIgnorePointerTarget?: (target: EventTarget | null) => boolean,
) {
  const down = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<Element>) => {
      if (!enabled || !onToggle || e.button !== 0) return;
      down.current = { x: e.clientX, y: e.clientY };
    },
    [enabled, onToggle],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<Element>) => {
      if (!enabled || !onToggle || !down.current) return;
      const d = down.current;
      down.current = null;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (dx * dx + dy * dy > MOVE_THRESH_SQ) return;
      if (shouldIgnorePointerTarget?.(e.target)) return;
      e.preventDefault();
      onToggle();
    },
    [enabled, onToggle, shouldIgnorePointerTarget],
  );

  const onPointerCancel = useCallback(() => {
    down.current = null;
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel };
}
