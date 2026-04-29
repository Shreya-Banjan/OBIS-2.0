import type { ReportDomain } from './data/reportDomains';

export type { ReportDomain };

/** Editor-global filters: partners, timeline string, NSQIP specialty ids, location labels. */
export type DashboardGlobalState = {
  partners: readonly string[];
  timeline: string;
  specialtyIds: readonly string[];
  locationLabels: readonly string[];
};

export type PlacedWidget = {
  instanceId: string;
  templateId: string;
  label: string;
  /** Empty slot; opens widget library to fill. */
  placeholder?: boolean;
};

/** Section column layout from Add section → Select Layout (Figma Actions). */
export type SectionLayoutPreset =
  | 'full'
  | 'sidebar-left'
  | 'sidebar-right'
  | 'three-column'
  | 'three-column-right'
  | 'three-column-middle'
  /** Two equal wide slots (same proportion as the large center column in `three-column-middle`). */
  | 'two-large'
  | 'four-small'
  /** Standalone full-width rich banner (text + optional background image; not a widget slot). */
  | 'banner-top'
  /** Standalone full-width section title strip (headline only; same `bannerText` field as dashboard banner). */
  | 'section-header';

export type DashboardSection = {
  id: string;
  widgets: PlacedWidget[];
  layout?: SectionLayoutPreset;
  /** Wide canvas: KPI instance forced to L2 chrome; siblings demote to L1; fr grid templates trade width per layout (see `kpiExpandLayoutSpans`). */
  kpiExpandedInstanceId?: string | null;
  /** When `layout === 'banner-top'` or `section-header`: headline (same editor field as dashboard banner). */
  bannerText?: string;
  /** When `layout === 'banner-top'` or `section-header`: optional background image (typically a data URL from upload). */
  bannerBackgroundDataUrl?: string | null;
};

/**
 * Canvas KPI widget slot tier per OBIS layout: **L1** = narrow / equal columns, **L2** = wide row or emphasis column.
 * Routed to `CanvasWidgetKpiTileL1` vs `CanvasWidgetKpiTileL2` in the editor.
 */
export type CanvasKpiWidgetTier = 'l1' | 'l2';

/** Present when this report was shared with you by someone else (demo / future API). */
export type SharedByInfo = {
  displayName: string;
  /** Optional profile image; if missing, initials are shown. */
  avatarUrl?: string | null;
};

/** Reports home: tile grid vs list row layout (nav drawer). */
export type DashboardListLayoutMode = 'tile' | 'list';

export type SavedDashboard = {
  id: string;
  title: string;
  sections: DashboardSection[];
  updatedAt: number;
  status: 'draft' | 'published';
  /** Set from the New Report flow. */
  domain?: ReportDomain;
  /** When set, the home list shows “Shared by …” with a profile avatar. */
  sharedBy?: SharedByInfo;
  /** Collaborators; tile shows avatar stack when there are three or more (overflow “+N” when more than three). */
  sharedWith?: SharedByInfo[];
  /** From new-report / publish flow */
  scope?: string;
  month?: string;
  shareEmails?: string[];
  /** Optional note from publish modal */
  publishComment?: string;
  /** Optional cover image (data URL) from new-report upload */
  coverImageDataUrl?: string | null;
  /** Persisted editor header filters (partners, timeline, specialties, locations). */
  dashboardScope?: DashboardGlobalState;
};
