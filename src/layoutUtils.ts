import type { DashboardSection, SectionLayoutPreset } from './types';

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
  if (layout === 'banner-top') return 0;
  if (layout === 'section-header') return 0;
  if (layout === 'three-column' || layout === 'three-column-right' || layout === 'three-column-middle') return 3;
  if (layout === 'four-small') return 4;
  return 2;
}

/**
 * At most one `banner-top` section (first in array order wins). That section is always index 0.
 * Call after loads and any section reorder so the dashboard banner stays the top row.
 */
export function normalizeDashboardBannerSections(sections: DashboardSection[]): DashboardSection[] {
  const bannerIndices = sections
    .map((s, i) => (s.layout === 'banner-top' ? i : -1))
    .filter((i) => i >= 0);
  let list = sections;
  if (bannerIndices.length > 1) {
    const keepIdx = bannerIndices[0]!;
    list = sections.filter((s, i) => s.layout !== 'banner-top' || i === keepIdx);
  }
  const bi = list.findIndex((s) => s.layout === 'banner-top');
  if (bi <= 0) return list;
  const banner = list[bi]!;
  return [banner, ...list.filter((_, i) => i !== bi)];
}

/** Drop `kpiExpandedInstanceId` when it does not match a non-placeholder widget, or on banner/header rows (no KPI slots). */
export function normalizeKpiExpandedInstanceIds(sections: DashboardSection[]): DashboardSection[] {
  return sections.map((s) => {
    const id = s.kpiExpandedInstanceId;
    if (id == null || id === '') return s;
    if (s.layout === 'banner-top' || s.layout === 'section-header') {
      const { kpiExpandedInstanceId, ...rest } = s;
      void kpiExpandedInstanceId;
      return rest as DashboardSection;
    }
    const ok = s.widgets.some((w) => !w.placeholder && w.instanceId === id);
    if (ok) return s;
    const { kpiExpandedInstanceId, ...rest } = s;
    void kpiExpandedInstanceId;
    return rest as DashboardSection;
  });
}

