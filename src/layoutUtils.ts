import type { SectionLayoutPreset } from './types';

/** Show nav burger only when effective layout width (window or preview preset) ≥ this — matches Tailwind `sm`. */
export const NAV_BURGER_MIN_LAYOUT_WIDTH_PX = 640;

/** List/editor content rail: wider cap when layout width is at least this (px). */
export const REPORTS_LAYOUT_WIDE_MIN_PX = 3200;
export const REPORTS_CONTENT_MAX_NARROW_PX = 1460;
export const REPORTS_CONTENT_MAX_WIDE_PX = 1843;

/** Max content width for reports list + editor; uses effective width (preview or window). */
export function reportsContentMaxWidthPx(effectiveLayoutWidthPx: number): number {
  return effectiveLayoutWidthPx >= REPORTS_LAYOUT_WIDE_MIN_PX
    ? REPORTS_CONTENT_MAX_WIDE_PX
    : REPORTS_CONTENT_MAX_NARROW_PX;
}

export function layoutColumnCount(layout: SectionLayoutPreset): number {
  if (layout === 'full') return 1;
  if (layout === 'three-column') return 3;
  return 2;
}

