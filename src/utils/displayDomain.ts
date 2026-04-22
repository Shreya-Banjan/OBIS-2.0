import type { ReportDomain } from '../data/reportDomains';
import type { SavedDashboard } from '../types';

/** Label shown on report cards; uses saved `domain` or defaults to Quality. */
export function displayDomainForDashboard(d: Pick<SavedDashboard, 'domain'>): ReportDomain {
  return d.domain ?? 'Quality';
}
