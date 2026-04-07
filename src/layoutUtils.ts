import type { SectionLayoutPreset } from './types';

export function layoutColumnCount(layout: SectionLayoutPreset): number {
  if (layout === 'full') return 1;
  if (layout === 'three-column') return 3;
  return 2;
}

