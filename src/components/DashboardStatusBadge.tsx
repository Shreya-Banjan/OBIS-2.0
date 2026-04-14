import type { SavedDashboard } from '../types';
import { ReportStatusBadge } from './ReportStatusBadge';

export function DashboardStatusBadge({ status }: { status: SavedDashboard['status'] }) {
  return <ReportStatusBadge status={status} />;
}
