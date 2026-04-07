import type { SectionLayoutPreset } from './types';

export function layoutColumnCount(layout: SectionLayoutPreset): number {
  if (layout === 'full') return 1;
  if (layout === 'three-column') return 3;
  return 2;
}

/** Tailwind classes for widget slots inside a section (matches layout column count). */
export function sectionWidgetsGridClass(layout: SectionLayoutPreset | undefined): string {
  if (!layout || layout === 'full') {
    return 'grid grid-cols-1 gap-2';
  }
  if (layout === 'three-column') {
    return 'grid grid-cols-1 gap-2 sm:grid-cols-3';
  }
  return 'grid grid-cols-1 gap-2 sm:grid-cols-2';
}

/** Compact grid for thumbnail previews (same column logic, tighter gaps). */
export function sectionWidgetsThumbnailGridClass(layout: SectionLayoutPreset | undefined): string {
  if (!layout || layout === 'full') {
    return 'grid grid-cols-1 gap-0.5';
  }
  if (layout === 'three-column') {
    return 'grid grid-cols-1 gap-0.5 sm:grid-cols-3';
  }
  return 'grid grid-cols-1 gap-0.5 sm:grid-cols-2';
}
