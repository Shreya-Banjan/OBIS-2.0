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
    sections: [],
    updatedAt: Date.now() - 86400000,
    status: 'draft',
  },
];
