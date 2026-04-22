import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { DashboardListLayoutMode, SavedDashboard } from '../types';
import { displayDomainForDashboard } from '../utils/displayDomain';
import { DomainChip } from './DomainChip';
import { DashboardTileCard } from './DashboardTileCard';
import { ProfileAvatar } from './ProfileAvatar';
import { IconEdit, IconMoreVertical, IconShare, IconTrash } from './Icons';
import { REPORTS_LAYOUT_WIDE_MIN_PX } from '../layoutUtils';

/** Stagger between cards — higher = slower cascade (tile grid + list). */
const REVEAL_BASE_MS = 1400;
const REVEAL_COL_MS = 160;
const REVEAL_ROW_MS = 200;

/** Duration of each card’s `cardStackIn` stack motion (longer = slower bounce-in). */
const STACK_ANIM_DURATION_MS = 720;

/**
 * Matches tile grid: `sm:2 md:3 lg:4` then 5 columns at effective width ≥ `REPORTS_LAYOUT_WIDE_MIN_PX`.
 * Content max width: `reportsContentMaxWidthPx` in `layoutUtils`.
 */
function reportTileColumnCountFromWidth(width: number): number {
  if (width >= REPORTS_LAYOUT_WIDE_MIN_PX) return 5;
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  if (width >= 640) return 2;
  return 1;
}

function useReportTileColumnCount(previewWidth: number | null): number {
  const [innerWidth, setInnerWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  useEffect(() => {
    if (previewWidth != null) return;
    const onResize = () => setInnerWidth(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [previewWidth]);

  const effectiveWidth = previewWidth ?? innerWidth;
  return useMemo(() => reportTileColumnCountFromWidth(effectiveWidth), [effectiveWidth]);
}

function cardStackGridPosition(index: number, columnCount: number) {
  const col = index % columnCount;
  const row = Math.floor(index / columnCount);
  return { col, row };
}

function cardEntranceDelayMs(
  index: number,
  layoutMode: DashboardListLayoutMode,
  tileCols: number
): number {
  const { col, row } =
    layoutMode === 'tile'
      ? cardStackGridPosition(index, tileCols)
      : { col: 0, row: index };
  return col * REVEAL_COL_MS + row * REVEAL_ROW_MS;
}

function cardRevealDelayMs(
  index: number,
  layoutMode: DashboardListLayoutMode,
  tileCols: number
): number {
  return REVEAL_BASE_MS + cardEntranceDelayMs(index, layoutMode, tileCols);
}

function formatUpdated(ts: number) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(ts)
    );
  } catch {
    return new Date(ts).toLocaleString();
  }
}

function DashboardOverflowActions({
  dashboardId,
  title,
  isOpen,
  onOpenChange,
  onEdit,
  onShare,
  onDelete,
  toolbarClassName,
}: {
  dashboardId: string;
  title: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onShare?: () => void;
  onDelete: () => void;
  toolbarClassName: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onOpenChange]);

  return (
    <div
      ref={rootRef}
      className={toolbarClassName}
      role="toolbar"
      aria-label={`Actions for ${title}`}
    >
      <div className="relative">
        <button
          type="button"
          className="pointer-events-auto inline-flex size-9 items-center justify-center rounded-lg border border-[#e4e4e4] bg-white text-[#1e1e1f] shadow-sm transition-[color,background-color,border-color,box-shadow] hover:bg-[#f5f5f5] active:border-[var(--color-brand-primary)] active:bg-[var(--color-brand-press-surface)] active:shadow-[var(--shadow-focus-brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-input-focus)]"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={isOpen ? `dashboard-overflow-${dashboardId}` : undefined}
          title="More actions"
          aria-label={`More actions for ${title}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenChange(!isOpen);
          }}
        >
          <IconMoreVertical className="size-5" />
        </button>
        {isOpen ? (
          <div
            id={`dashboard-overflow-${dashboardId}`}
            role="menu"
            className="pointer-events-auto absolute right-0 top-[calc(100%+6px)] z-[25] flex max-w-[min(18rem,calc(100vw-1.5rem))] min-w-[11rem] flex-col gap-1 rounded-xl border border-[#e8e8e8] bg-white p-1.5 shadow-[var(--shadow-elevated)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-['Inter',sans-serif] text-sm text-[#333333] transition-colors hover:bg-[#f2f2f2]"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange(false);
                onEdit();
              }}
            >
              <IconEdit className="size-5 shrink-0 text-[#333333]" aria-hidden />
              <span>Edit</span>
            </button>
            {onShare ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-['Inter',sans-serif] text-sm text-[#333333] transition-colors hover:bg-[#f2f2f2]"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenChange(false);
                  onShare();
                }}
              >
                <IconShare className="size-5 shrink-0 text-[#333333]" aria-hidden />
                <span>Share</span>
              </button>
            ) : null}
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-['Inter',sans-serif] text-sm text-[#9e1f16] transition-colors hover:bg-[#fff5f5]"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange(false);
                onDelete();
              }}
            >
              <IconTrash className="size-5 shrink-0 text-[#9e1f16]" aria-hidden />
              <span>Delete</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type DashboardListBodyProps = {
  filteredDashboards: SavedDashboard[];
  layoutMode: DashboardListLayoutMode;
  onOpenDashboard: (id: string) => void;
  onShareDashboard: (id: string) => void;
  onDeleteDashboard: (id: string) => void;
  /** When set (reports list viewport preview), tile columns match this width instead of the browser. */
  previewViewportWidth?: number | null;
};

/**
 * Report tiles / list — matches [executive-dashboard-ui](https://github.com/elannn-ghub/executive-dashboard-ui)
 * KPI pattern: staggered skeleton reveal + `cardStackIn` stack entrance (duration/stagger via constants),
 * then clear inline animation after the last card’s entrance (`initialAnimsDone`).
 */
export function DashboardListBody({
  filteredDashboards,
  layoutMode,
  onOpenDashboard,
  onShareDashboard,
  onDeleteDashboard,
  previewViewportWidth = null,
}: DashboardListBodyProps) {
  const [actionsMenuId, setActionsMenuId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => new Set());
  const [initialAnimsDone, setInitialAnimsDone] = useState(false);
  const tileColumnCount = useReportTileColumnCount(previewViewportWidth);
  const previewGridActive = previewViewportWidth != null;

  const maxRevealDelayMs = useMemo(() => {
    if (filteredDashboards.length === 0) return 0;
    let max = 0;
    filteredDashboards.forEach((_, i) => {
      max = Math.max(max, cardRevealDelayMs(i, layoutMode, tileColumnCount));
    });
    return max;
  }, [filteredDashboards, layoutMode, tileColumnCount]);

  useEffect(() => {
    setInitialAnimsDone(false);
    if (filteredDashboards.length === 0) {
      setInitialAnimsDone(true);
      return;
    }
    const afterEntranceMs = STACK_ANIM_DURATION_MS + 280;
    const t = window.setTimeout(
      () => setInitialAnimsDone(true),
      maxRevealDelayMs + afterEntranceMs
    );
    return () => window.clearTimeout(t);
  }, [filteredDashboards, layoutMode, maxRevealDelayMs]);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setRevealedIds(new Set(filteredDashboards.map((d) => d.id)));
      return;
    }
    setRevealedIds(new Set());
    const timers: ReturnType<typeof setTimeout>[] = [];
    filteredDashboards.forEach((d, i) => {
      const revealDelay = cardRevealDelayMs(i, layoutMode, tileColumnCount);
      timers.push(
        window.setTimeout(() => {
          setRevealedIds((prev) => new Set(prev).add(d.id));
        }, revealDelay)
      );
    });
    return () => timers.forEach((x) => window.clearTimeout(x));
  }, [filteredDashboards, layoutMode, tileColumnCount]);

  const gridBusy = filteredDashboards.some((d) => !revealedIds.has(d.id));

  if (layoutMode === 'tile') {
    return (
      <div
        className="dashboard-list-page-layer w-full min-w-0 overflow-visible"
        style={{ ['--page-stack']: 2 } as CSSProperties}
        role="region"
        aria-label="Report tiles"
        aria-busy={gridBusy}
      >
        <ul
          className={
            previewGridActive
              ? 'grid gap-4 overflow-visible'
              : 'grid grid-cols-1 gap-4 overflow-visible sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 min-[3200px]:grid-cols-5'
          }
          style={
            previewGridActive
              ? ({
                  gridTemplateColumns: `repeat(${tileColumnCount}, minmax(0, 1fr))`,
                } as CSSProperties)
              : undefined
          }
          role="list"
        >
          {filteredDashboards.map((d, tileIndex) => {
            const menuOpen = actionsMenuId === d.id;
            const revealed = revealedIds.has(d.id);
            const entranceDelay = cardEntranceDelayMs(tileIndex, layoutMode, tileColumnCount);
            const stackStyle: CSSProperties | undefined = initialAnimsDone
              ? undefined
              : {
                  animation: `cardStackIn ${STACK_ANIM_DURATION_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1) ${entranceDelay}ms both`,
                };
            return (
              <li key={d.id} className="min-w-0 isolate">
                <div className="relative" style={stackStyle}>
                  <div
                    className={`absolute inset-0 z-10 rounded-[24px] bg-white shadow-[var(--shadow-card)] transition-opacity duration-300 ${
                      revealed ? 'pointer-events-none opacity-0' : 'opacity-100'
                    }`}
                  >
                    <div className="flex flex-col gap-3.5 px-[18px] pt-[18px] pb-6">
                      <div className="relative h-[130px] w-full overflow-hidden rounded-[20px] bg-[#f3f5f7]">
                        <div className="skeleton-shimmer absolute inset-0 rounded-[20px]" aria-hidden />
                      </div>
                      <div className="space-y-2">
                        <div className="skeleton-shimmer h-3 w-[40%] max-w-[7rem] rounded" aria-hidden />
                        <div className="skeleton-shimmer h-3 w-[90%] max-w-[18rem] rounded" aria-hidden />
                        <div className="skeleton-shimmer h-3 w-[55%] rounded" aria-hidden />
                      </div>
                    </div>
                  </div>
                  <div
                    className={`transition-opacity duration-300 ${revealed ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <div className={revealed ? undefined : 'pointer-events-none'}>
                      <DashboardTileCard
                        title={d.title}
                        domainLabel={displayDomainForDashboard(d)}
                        lastUpdatedLabel={`Last Updated ${formatUpdated(d.updatedAt)}`}
                        coverImageDataUrl={d.coverImageDataUrl}
                        sharedBy={d.sharedBy}
                        sharedWith={d.sharedWith}
                        onClick={() => revealed && onOpenDashboard(d.id)}
                        overlay={
                          <DashboardOverflowActions
                            dashboardId={d.id}
                            title={d.title}
                            isOpen={menuOpen}
                            onOpenChange={(open) => setActionsMenuId(open ? d.id : null)}
                            onEdit={() => onOpenDashboard(d.id)}
                            onShare={
                              d.status === 'published' ? () => onShareDashboard(d.id) : undefined
                            }
                            onDelete={() => onDeleteDashboard(d.id)}
                            toolbarClassName={[
                              'pointer-events-none absolute right-[18px] top-[18px] z-10 max-w-[calc(100%-2.25rem)]',
                              'opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-150',
                              'sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto sm:group-focus-within:opacity-100 sm:group-focus-within:pointer-events-auto',
                              menuOpen ? 'sm:!pointer-events-auto sm:!opacity-100' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          />
                        }
                      />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div
      className="dashboard-list-page-layer overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]"
      style={{ ['--page-stack']: 2 } as CSSProperties}
      role="region"
      aria-label="Reports list"
      aria-busy={gridBusy}
    >
      <ul className="divide-y divide-[#ebebeb]" role="list">
        {filteredDashboards.map((d, rowIndex) => {
          const menuOpen = actionsMenuId === d.id;
          const revealed = revealedIds.has(d.id);
          const entranceDelay = cardEntranceDelayMs(rowIndex, layoutMode, tileColumnCount);
          const stackStyle: CSSProperties | undefined = initialAnimsDone
            ? undefined
            : {
                animation: `cardStackIn ${STACK_ANIM_DURATION_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1) ${entranceDelay}ms both`,
              };
          return (
            <li key={d.id} className="min-w-0">
              <div className="relative" style={stackStyle}>
                <div
                  className={`absolute inset-0 z-10 flex items-center gap-3 bg-white px-4 py-4 transition-opacity duration-300 sm:px-6 sm:py-5 ${
                    revealed ? 'pointer-events-none opacity-0' : 'opacity-100'
                  }`}
                >
                  <div className="skeleton-shimmer size-10 shrink-0 rounded-full sm:size-11" aria-hidden />
                  <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                    <div className="skeleton-shimmer h-4 w-[min(220px,45%)] rounded" aria-hidden />
                    <div className="skeleton-shimmer h-3 w-32 rounded" aria-hidden />
                  </div>
                </div>
                <div className={`transition-opacity duration-300 ${revealed ? 'opacity-100' : 'opacity-0'}`}>
                  <div className={revealed ? undefined : 'pointer-events-none'}>
                    <div className="group flex w-full items-center">
                      <button
                        type="button"
                        onClick={() => revealed && onOpenDashboard(d.id)}
                        className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-4 text-left transition-colors hover:bg-[#fafafa] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-5"
                      >
                        <div
                          className={`flex min-w-0 flex-1 gap-3 sm:items-center ${d.sharedBy ? 'sm:gap-4' : ''}`}
                        >
                          {d.sharedBy ? (
                            <ProfileAvatar sharedBy={d.sharedBy} size="md" />
                          ) : null}
                          <div className="min-w-0 flex-1 text-left">
                            <span className="block truncate font-['Poppins',sans-serif] text-base font-semibold text-[#1e1e1f]">
                              {d.title}
                            </span>
                            {d.sharedBy ? (
                              <span className="mt-0.5 block font-['Inter',sans-serif] text-xs text-[#707070]">
                                Shared by{' '}
                                <span className="font-medium text-[#1e1e1f]">
                                  {d.sharedBy.displayName}
                                </span>
                              </span>
                            ) : null}
                            <span className="mt-0.5 block font-['Inter',sans-serif] text-xs text-[#707070]">
                              Last Updated {formatUpdated(d.updatedAt)}
                            </span>
                          </div>
                        </div>
                        <DomainChip label={displayDomainForDashboard(d)} className="shrink-0" />
                      </button>
                      <DashboardOverflowActions
                        dashboardId={d.id}
                        title={d.title}
                        isOpen={menuOpen}
                        onOpenChange={(open) => setActionsMenuId(open ? d.id : null)}
                        onEdit={() => onOpenDashboard(d.id)}
                        onShare={
                          d.status === 'published' ? () => onShareDashboard(d.id) : undefined
                        }
                        onDelete={() => onDeleteDashboard(d.id)}
                        toolbarClassName={[
                          'pointer-events-auto flex max-w-[11rem] shrink-0 items-start justify-end px-3 py-4 sm:max-w-none sm:py-5',
                          'opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-150',
                          'sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100',
                          menuOpen ? 'sm:!opacity-100' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
