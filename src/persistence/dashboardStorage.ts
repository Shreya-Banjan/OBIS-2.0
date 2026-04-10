import type { DashboardSection, PlacedWidget, SavedDashboard, SharedByInfo } from '../types';

const STORAGE_KEY = 'neuron-builder-dashboards-v1';

function isPlacedWidget(x: unknown): x is PlacedWidget {
  if (!x || typeof x !== 'object') return false;
  const w = x as Record<string, unknown>;
  return typeof w.instanceId === 'string' && typeof w.templateId === 'string' && typeof w.label === 'string';
}

const LAYOUTS = new Set(['full', 'sidebar-left', 'sidebar-right', 'three-column']);

function isDashboardSection(x: unknown): x is DashboardSection {
  if (!x || typeof x !== 'object') return false;
  const s = x as Record<string, unknown>;
  if (typeof s.id !== 'string' || !Array.isArray(s.widgets)) return false;
  if (!s.widgets.every(isPlacedWidget)) return false;
  if (s.layout !== undefined && (typeof s.layout !== 'string' || !LAYOUTS.has(s.layout))) return false;
  return true;
}

function isSharedBy(x: unknown): x is SharedByInfo {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  if (typeof o.displayName !== 'string' || o.displayName.trim() === '') return false;
  if (o.avatarUrl !== undefined && o.avatarUrl !== null && typeof o.avatarUrl !== 'string') return false;
  return true;
}

function isSavedDashboard(x: unknown): x is SavedDashboard {
  if (!x || typeof x !== 'object') return false;
  const d = x as Record<string, unknown>;
  if (typeof d.id !== 'string' || typeof d.title !== 'string') return false;
  if (typeof d.updatedAt !== 'number' || !Array.isArray(d.sections)) return false;
  if (d.status !== 'draft' && d.status !== 'published') return false;
  if (!d.sections.every(isDashboardSection)) return false;
  if (d.sharedBy !== undefined && !isSharedBy(d.sharedBy)) return false;
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
    return parsed as SavedDashboard[];
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
