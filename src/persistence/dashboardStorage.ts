import { REPORT_DOMAIN_OPTIONS } from '../data/reportDomains';
import { normalizeDashboardBannerSections, normalizeKpiExpandedInstanceIds } from '../layoutUtils';
import type { DashboardSection, PlacedWidget, SavedDashboard, SharedByInfo } from '../types';

const STORAGE_KEY = 'neuron-builder-dashboards-v1';

const REPORT_DOMAIN_SET = new Set<string>(REPORT_DOMAIN_OPTIONS);

function isPlacedWidget(x: unknown): x is PlacedWidget {
  if (!x || typeof x !== 'object') return false;
  const w = x as Record<string, unknown>;
  return typeof w.instanceId === 'string' && typeof w.templateId === 'string' && typeof w.label === 'string';
}

const LAYOUTS = new Set([
  'full',
  'sidebar-left',
  'sidebar-right',
  'three-column',
  'three-column-right',
  'three-column-middle',
  'two-large',
  'four-small',
  'banner-top',
  'section-header',
]);

function isDashboardSection(x: unknown): x is DashboardSection {
  if (!x || typeof x !== 'object') return false;
  const s = x as Record<string, unknown>;
  if (typeof s.id !== 'string' || !Array.isArray(s.widgets)) return false;
  if (!s.widgets.every(isPlacedWidget)) return false;
  if (s.layout !== undefined && (typeof s.layout !== 'string' || !LAYOUTS.has(s.layout))) return false;
  if (s.bannerText !== undefined && typeof s.bannerText !== 'string') return false;
  if (
    s.bannerBackgroundDataUrl !== undefined &&
    s.bannerBackgroundDataUrl !== null &&
    typeof s.bannerBackgroundDataUrl !== 'string'
  ) {
    return false;
  }
  if (
    s.kpiExpandedInstanceId !== undefined &&
    s.kpiExpandedInstanceId !== null &&
    typeof s.kpiExpandedInstanceId !== 'string'
  ) {
    return false;
  }
  return true;
}

function isSharedBy(x: unknown): x is SharedByInfo {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  if (typeof o.displayName !== 'string' || o.displayName.trim() === '') return false;
  if (o.avatarUrl !== undefined && o.avatarUrl !== null && typeof o.avatarUrl !== 'string') return false;
  return true;
}

/** Strip layouts: `banner-top` (hero + image); `section-header` (title row, headline in `bannerText`, no widgets). */
function normalizeStandaloneStripSections(sections: DashboardSection[]): DashboardSection[] {
  return sections.map((s) => {
    if (s.layout === 'banner-top') {
      return {
        ...s,
        widgets: [],
        bannerText: typeof s.bannerText === 'string' ? s.bannerText : '',
        bannerBackgroundDataUrl:
          s.bannerBackgroundDataUrl === undefined ? null : (s.bannerBackgroundDataUrl as string | null),
      };
    }
    if (s.layout === 'section-header') {
      return {
        ...s,
        widgets: [],
        bannerText: typeof s.bannerText === 'string' ? s.bannerText : '',
      };
    }
    return s;
  });
}

function normalizeLoadedDashboard(d: SavedDashboard): SavedDashboard {
  return {
    ...d,
    sections: normalizeKpiExpandedInstanceIds(
      normalizeDashboardBannerSections(normalizeStandaloneStripSections(d.sections)),
    ),
  };
}

function isSavedDashboard(x: unknown): x is SavedDashboard {
  if (!x || typeof x !== 'object') return false;
  const d = x as Record<string, unknown>;
  if (typeof d.id !== 'string' || typeof d.title !== 'string') return false;
  if (typeof d.updatedAt !== 'number' || !Array.isArray(d.sections)) return false;
  if (d.status !== 'draft' && d.status !== 'published') return false;
  if (!d.sections.every(isDashboardSection)) return false;
  if (d.sharedBy !== undefined && !isSharedBy(d.sharedBy)) return false;
  if (
    d.domain !== undefined &&
    (typeof d.domain !== 'string' || !REPORT_DOMAIN_SET.has(d.domain))
  ) {
    return false;
  }
  return true;
}

/** `null` = no stored data (use app seed). Empty array is valid. */
export function loadDashboardsFromStorage(): SavedDashboard[] | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    if (parsed.length === 0) return [];
    if (!parsed.every(isSavedDashboard)) return null;
    return (parsed as SavedDashboard[]).map(normalizeLoadedDashboard);
  } catch {
    return null;
  }
}

export function saveDashboardsToStorage(dashboards: SavedDashboard[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards));
  } catch (e) {
    console.warn('[neuron-builder] Failed to save dashboards to localStorage', e);
  }
}
