import type { SavedDashboard } from '../types';
import { IconCheck, IconEdit } from './Icons';

export type ReportStatusBadgeProps = {
  status: SavedDashboard['status'];
  className?: string;
};

export function ReportStatusBadge({ status, className = '' }: ReportStatusBadgeProps) {
  if (status === 'published') {
    return (
      <span
        className={`inline-flex w-max shrink-0 items-center gap-1 rounded-md bg-[#e5ffe3] p-1 font-['Inter',sans-serif] text-[10px] font-medium leading-none text-[#138e3c] ${className}`.trim()}
      >
        <IconCheck className="size-3.5 shrink-0 text-[#138e3c]" aria-hidden />
        Published
      </span>
    );
  }

  return (
    <span
      className={`inline-flex w-max shrink-0 items-center gap-1 rounded-md bg-[rgba(245,158,11,0.1)] p-1 font-['Inter',sans-serif] text-[10px] font-medium leading-none text-[#db8900] ${className}`.trim()}
    >
      <IconEdit className="size-3.5 shrink-0 text-[#db8900]" aria-hidden />
      Draft
    </span>
  );
}
