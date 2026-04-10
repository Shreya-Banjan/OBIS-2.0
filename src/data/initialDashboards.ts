import type { SavedDashboard } from '../types';

/** Demo seed data — matches sample names from product nav. */
export const INITIAL_DASHBOARDS: SavedDashboard[] = [
  {
    id: 'seed-np',
    title: 'Network Performance',
    sections: [],
    updatedAt: Date.now() - 86400000 * 2,
    status: 'published',
    sharedBy: { displayName: 'Jordan Lee' },
  },
  {
    id: 'seed-nh',
    title: 'Network Health Summary',
    sections: [],
    updatedAt: Date.now() - 86400000 * 5,
    status: 'published',
    sharedBy: { displayName: 'Alex Morgan' },
  },
  {
    id: 'seed-facts',
    title: 'Network Facts',
    sections: [],
    updatedAt: Date.now() - 3600000,
    status: 'draft',
  },
  {
    id: 'seed-d2',
    title: 'Dashboard 2',
    sections: [],
    updatedAt: Date.now() - 86400000,
    status: 'draft',
  },
];
