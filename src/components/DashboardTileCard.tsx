import type { ReactNode } from 'react';
import type { SavedDashboard, SharedByInfo } from '../types';
import { ReportStatusBadge } from './ReportStatusBadge';
import { SharedWithAvatarStack } from './SharedWithAvatarStack';

export type DashboardTileCardProps = {
  title: string;
  status: SavedDashboard['status'];
  /** e.g. `Last Updated Apr 9, 2026, 10:23 PM` */
  lastUpdatedLabel: string;
  coverImageDataUrl?: string | null;
  /** Primary “shared by” line elsewhere; used for avatar stack when `sharedWith` is absent. */
  sharedBy?: SharedByInfo;
  /** Multiple collaborators; when length > 3, tile shows two faces + “+N” ([Figma 6098:35039](https://www.figma.com/design/aeQeZHeULUG3dyZQaU1S9y/Neuron-2.0?node-id=6098-35039)). */
  sharedWith?: SharedByInfo[];
  onClick: () => void;
  /** Absolutely positioned controls (e.g. overflow menu). Parent must be `relative`. */
  overlay?: ReactNode;
};

function resolveSharedPeople(sharedBy?: SharedByInfo, sharedWith?: SharedByInfo[]): SharedByInfo[] {
  if (sharedWith && sharedWith.length > 0) return sharedWith;
  if (sharedBy) return [sharedBy];
  return [];
}

/**
 * Dashboard list tile — [Figma 6098:35943](https://www.figma.com/design/aeQeZHeULUG3dyZQaU1S9y/Neuron-2.0?node-id=6098-35943)
 */
export function DashboardTileCard({
  title,
  status,
  lastUpdatedLabel,
  coverImageDataUrl,
  sharedBy,
  sharedWith,
  onClick,
  overlay,
}: DashboardTileCardProps) {
  const hasCover = Boolean(coverImageDataUrl?.trim());
  const sharedPeople = resolveSharedPeople(sharedBy, sharedWith);
  const showAvatarStack = sharedPeople.length >= 3;

  return (
    <div className="dashboard-tile-lift group relative">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full flex-col overflow-visible rounded-[24px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[#1e1e1f]/20 focus-visible:ring-offset-2"
      >
        <div className="flex flex-col gap-3.5 overflow-visible px-[18px] pt-[18px] pb-6">
          <div className="relative h-[130px] w-full min-w-0 shrink-0 overflow-hidden rounded-[20px] bg-[#f3f5f7]">
            {hasCover ? (
              <img src={coverImageDataUrl!} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center font-['Inter',sans-serif] text-[10px] font-medium leading-[22px] text-[#1f1f1f]/38">
                No Preview Yet
              </span>
            )}
          </div>

          <div className="min-w-0 overflow-visible">
            <ReportStatusBadge status={status} />
            <div className="mt-3 w-full min-w-0">
              {showAvatarStack ? (
                <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2">
                  <span className="min-w-0 font-['Poppins',sans-serif] text-base font-semibold leading-normal text-black [overflow-wrap:anywhere]">
                    {title}
                  </span>
                  <div className="relative z-10 min-w-[4.5rem] shrink-0 justify-self-end">
                    <SharedWithAvatarStack people={sharedPeople} />
                  </div>
                </div>
              ) : (
                <span className="block min-w-0 font-['Poppins',sans-serif] text-base font-semibold leading-normal text-black [overflow-wrap:anywhere]">
                  {title}
                </span>
              )}
              <p className="mt-1 block w-full min-w-0 font-['Inter',sans-serif] text-xs font-normal leading-normal text-[#707070]">
                {lastUpdatedLabel}
              </p>
            </div>
          </div>
        </div>
      </button>
      {overlay}
    </div>
  );
}
