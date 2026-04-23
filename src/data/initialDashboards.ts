import { normalizeDashboardBannerSections } from '../layoutUtils';
import type { SavedDashboard } from '../types';

function cloneDashboard(d: SavedDashboard): SavedDashboard {
  return {
    ...d,
    sections: normalizeDashboardBannerSections(
      d.sections.map((s) => ({ ...s, widgets: [...s.widgets] }))
    ),
  };
}

/**
 * Builds the dashboard list for app boot:
 * - No / empty storage → full demo seed.
 * - Existing storage → keep user data and append any new seed IDs (so demo rows appear after we add seeds).
 */
export function mergeInitialDashboards(stored: SavedDashboard[] | null): SavedDashboard[] {
  if (stored == null || stored.length === 0) {
    return INITIAL_DASHBOARDS.map(cloneDashboard);
  }
  const seedById = new Map(INITIAL_DASHBOARDS.map((s) => [s.id, s]));
  const ids = new Set(stored.map((d) => d.id));
  /** Keep demo seed `domain` in sync with code (localStorage would otherwise freeze old chip labels). */
  const merged: SavedDashboard[] = stored.map((d) => {
    const cloned = cloneDashboard(d);
    const seed = seedById.get(d.id);
    if (seed?.domain !== undefined) {
      return { ...cloned, domain: seed.domain };
    }
    return cloned;
  });
  for (const seed of INITIAL_DASHBOARDS) {
    if (!ids.has(seed.id)) merged.push(cloneDashboard(seed));
  }
  return merged;
}

/** Demo seed data — domains are mostly Quality with a few alternates for visual variety. */
export const INITIAL_DASHBOARDS: SavedDashboard[] = [
  {
    id: 'seed-np',
    title: 'Network Performance',
    domain: 'Quality',
    sections: [],
    updatedAt: Date.now() - 86400000 * 2,
    status: 'published',
    sharedBy: { displayName: 'Jordan Lee' },
    sharedWith: [
      { displayName: 'Sasha Kim' },
      { displayName: 'Alex Rivera' },
      { displayName: 'Morgan Lee' },
      { displayName: 'Casey Wu' },
      { displayName: 'Drew Patel' },
    ],
  },
  {
    id: 'seed-nh',
    title: 'Network Health Summary',
    domain: 'Research',
    sections: [],
    updatedAt: Date.now() - 86400000 * 5,
    status: 'published',
    sharedBy: { displayName: 'Alex Morgan' },
    sharedWith: [
      { displayName: 'Alex Morgan' },
      { displayName: 'Riley Chen' },
      { displayName: 'Sam Ortiz' },
      { displayName: 'Taylor Brooks' },
    ],
  },
  {
    id: 'seed-facts',
    title: 'Network Facts',
    domain: 'Quality',
    sections: [],
    updatedAt: Date.now() - 3600000,
    status: 'draft',
    sharedWith: [
      { displayName: 'Jamie Fox' },
      { displayName: 'Chris Park' },
      { displayName: 'Pat Ng' },
    ],
  },
  {
    id: 'seed-d2',
    title: 'Dashboard 2',
    domain: 'Quality',
    sections: [],
    updatedAt: Date.now() - 86400000,
    status: 'draft',
  },
  {
    id: 'seed-capacity',
    title: 'Capacity Planning',
    domain: 'Capacity',
    sections: [],
    updatedAt: Date.now() - 86400000 * 3,
    status: 'published',
    sharedBy: { displayName: 'Riley Chen' },
  },
  {
    id: 'seed-qoe',
    title: 'QoE Scorecard',
    domain: 'Quality',
    sections: [],
    updatedAt: Date.now() - 7200000,
    status: 'draft',
  },
  {
    id: 'seed-sla',
    title: 'SLA Compliance',
    domain: 'Timeliness',
    sections: [],
    updatedAt: Date.now() - 86400000 * 7,
    status: 'published',
    sharedBy: { displayName: 'Taylor Brooks' },
    sharedWith: [{ displayName: 'Jordan Lee' }, { displayName: 'Alex Rivera' }],
  },
  {
    id: 'seed-ran',
    title: 'RAN Diagnostics',
    domain: 'Research',
    sections: [],
    updatedAt: Date.now() - 1800000,
    status: 'draft',
  },
  {
    id: 'seed-backhaul',
    title: 'Backhaul Utilization',
    domain: 'Utilization',
    sections: [],
    updatedAt: Date.now() - 86400000 * 4,
    status: 'published',
  },
  {
    id: 'seed-voice',
    title: 'Voice Quality Trends',
    domain: 'Quality',
    sections: [],
    updatedAt: Date.now() - 43200000,
    status: 'draft',
    sharedWith: [{ displayName: 'Morgan Lee' }],
  },
  {
    id: 'seed-incidents',
    title: 'Incident Summary',
    domain: 'Quality',
    sections: [],
    updatedAt: Date.now() - 86400000 * 10,
    status: 'published',
    sharedBy: { displayName: 'Sam Ortiz' },
  },
  {
    id: 'seed-spectrum',
    title: 'Spectrum Overview',
    domain: 'Quality',
    sections: [],
    updatedAt: Date.now() - 5400000,
    status: 'draft',
  },
  {
    id: 'seed-mobility',
    title: 'Mobility Handover KPIs',
    domain: 'Quality',
    sections: [],
    updatedAt: Date.now() - 86400000 * 6,
    status: 'published',
    sharedWith: [
      { displayName: 'Sasha Kim' },
      { displayName: 'Chris Park' },
      { displayName: 'Pat Ng' },
    ],
  },
  {
    id: 'seed-energy',
    title: 'Energy & Power',
    domain: 'Quality',
    sections: [],
    updatedAt: Date.now() - 86400000 * 14,
    status: 'draft',
  },
  {
    id: 'seed-security',
    title: 'Security Posture',
    domain: 'Research',
    sections: [],
    updatedAt: Date.now() - 900000,
    status: 'published',
    sharedBy: { displayName: 'Casey Wu' },
  },
  {
    id: 'seed-5g',
    title: '5G Rollout Status',
    domain: 'Quality',
    sections: [],
    updatedAt: Date.now() - 86400000 * 8,
    status: 'draft',
  },
];
