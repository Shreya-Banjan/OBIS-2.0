import type { SavedDashboard } from '../types';

export function DashboardStatusBadge({ status }: { status: SavedDashboard['status'] }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-md px-2 py-0.5 font-['Inter',sans-serif] text-xs font-medium ${
        status === 'published'
          ? 'bg-[rgba(0,107,235,0.1)] text-[#5360e1]'
          : 'bg-[rgba(226,0,116,0.1)] text-[#e20074]'
      }`}
    >
      {status === 'published' ? 'Published' : 'Draft'}
    </span>
  );
}
