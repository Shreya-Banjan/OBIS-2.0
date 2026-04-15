import { useEffect, useMemo, useRef, useState } from 'react';
import type { SavedDashboard } from '../types';
import { DashboardStatusBadge } from './DashboardStatusBadge';
import { DashboardTileCard } from './DashboardTileCard';
import { ProfileAvatar } from './ProfileAvatar';
import { AppBurgerButton } from './AppBurgerButton';
import { IconAdd, IconLayoutGrid, IconMoreVertical, IconSearch } from './Icons';
import { PrimaryButton } from './PrimaryButton';

type ReportFilterTab = 'all' | 'mine' | 'shared';

function reportFilterCounts(dashboards: SavedDashboard[]) {
  let mine = 0;
  let shared = 0;
  for (const d of dashboards) {
    if (d.sharedBy) shared += 1;
    else mine += 1;
  }
  return { all: dashboards.length, mine, shared };
}

function ReportFilterToggle({
  value,
  onChange,
  counts,
}: {
  value: ReportFilterTab;
  onChange: (next: ReportFilterTab) => void;
  counts: { all: number; mine: number; shared: number };
}) {
  const segments: { id: ReportFilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'mine', label: 'My Reports', count: counts.mine },
    { id: 'shared', label: 'Shared With Me', count: counts.shared },
  ];

  return (
    <div
      role="tablist"
      aria-label="Filter reports"
      className="flex w-full min-h-12 min-w-0 flex-nowrap items-stretch gap-1.5 overflow-x-auto overscroll-x-contain rounded-[10px] bg-white p-1 shadow-[var(--shadow-card)] box-border [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] sm:inline-flex sm:h-12 sm:w-auto sm:max-w-none sm:gap-2"
    >
      {segments.map(({ id, label, count }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(id)}
            className={`flex min-h-12 shrink-0 touch-manipulation items-center justify-center self-stretch rounded-[10px] px-2 font-['Inter',sans-serif] text-xs font-normal leading-none whitespace-nowrap transition-colors sm:min-h-0 sm:px-3 sm:text-sm ${
              selected
                ? 'bg-[#e20074] text-white'
                : 'bg-white text-[#1e1e1f] hover:bg-[#f5f5f5]'
            }`}
          >
            {label} ({count})
          </button>
        );
      })}
    </div>
  );
}

function formatUpdated(ts: number) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
}

export type DashboardListLayoutMode = 'tile' | 'list';

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
  /** Omitted for drafts — Share is only for published reports. */
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
          className="pointer-events-auto inline-flex size-9 items-center justify-center rounded-lg border border-[#e4e4e4] bg-white text-[#1e1e1f] shadow-sm transition-colors hover:bg-[#f5f5f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e1e1f]/20"
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
            className="pointer-events-auto absolute right-0 top-[calc(100%+6px)] z-[25] max-w-[min(18rem,calc(100vw-1.5rem))] min-w-[11rem] overflow-hidden rounded-xl border border-[#e8e8e8] bg-white py-1 shadow-[var(--shadow-elevated)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center px-3 py-2.5 text-left font-['Inter',sans-serif] text-sm text-[#1e1e1f] hover:bg-[#f5f5f5]"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange(false);
                onEdit();
              }}
            >
              Edit
            </button>
            {onShare ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center px-3 py-2.5 text-left font-['Inter',sans-serif] text-sm text-[#5c3d6e] hover:bg-[#faf5fc]"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenChange(false);
                  onShare();
                }}
              >
                Share
              </button>
            ) : null}
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center px-3 py-2.5 text-left font-['Inter',sans-serif] text-sm text-[#9e1f16] hover:bg-[#fff5f5]"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange(false);
                onDelete();
              }}
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type DashboardListPageProps = {
  dashboards: SavedDashboard[];
  onOpenDashboard: (id: string) => void;
  onShareDashboard: (id: string) => void;
  onDeleteDashboard: (id: string) => void;
  onNewReport: () => void;
  /** Opens the app navigation drawer (burger). */
  onMenuOpen: () => void;
  /** Opens the standalone Components library (separate from the nav drawer). */
  onOpenComponents: () => void;
  layoutMode: DashboardListLayoutMode;
};

export function DashboardListPage({
  dashboards,
  onOpenDashboard,
  onShareDashboard,
  onDeleteDashboard,
  onNewReport,
  onMenuOpen,
  onOpenComponents,
  layoutMode,
}: DashboardListPageProps) {
  const [reportFilter, setReportFilter] = useState<ReportFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchExpanded = searchFocused || searchQuery.trim() !== '';
  const filterCounts = useMemo(() => reportFilterCounts(dashboards), [dashboards]);
  const tabFilteredDashboards = useMemo(() => {
    if (reportFilter === 'all') return dashboards;
    if (reportFilter === 'mine') return dashboards.filter((d) => !d.sharedBy);
    return dashboards.filter((d) => !!d.sharedBy);
  }, [dashboards, reportFilter]);

  const filteredDashboards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tabFilteredDashboards;
    return tabFilteredDashboards.filter((d) => {
      if (d.title.toLowerCase().includes(q)) return true;
      if (d.sharedBy?.displayName.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [tabFilteredDashboards, searchQuery]);

  const empty = dashboards.length === 0;
  const filteredEmpty = !empty && filteredDashboards.length === 0;
  const noSearchMatches =
    !empty &&
    tabFilteredDashboards.length > 0 &&
    filteredDashboards.length === 0 &&
    searchQuery.trim() !== '';
  const [actionsMenuId, setActionsMenuId] = useState<string | null>(null);

  return (
    <>
      <div className="min-h-dvh overflow-x-hidden bg-[#ebebeb] px-3 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] font-[family-name:var(--font-inter)] sm:px-4">
        <div className="mb-5 flex w-full min-w-0 items-center gap-2 sm:gap-3">
          <AppBurgerButton
            onClick={onMenuOpen}
            className="h-14 min-h-0 w-14 shrink-0 rounded-[16px] border-0 bg-white p-2.5 shadow-[var(--shadow-card)] hover:bg-[#f5f5f5] sm:h-16 sm:w-16 sm:p-3 [&_svg]:size-6"
          />

          <div className="flex h-14 min-h-[3.5rem] min-w-0 flex-1 items-center rounded-[16px] bg-white px-3 py-2 shadow-[var(--shadow-card)] sm:h-16 sm:min-h-16 sm:px-4">
            <div className="min-w-0">
              <h1 className="truncate font-['Poppins',sans-serif] text-xl font-semibold leading-tight text-[#1e1e1f] sm:text-2xl sm:leading-normal md:text-[24px]">
                Neuron 2.0
              </h1>
              <p className="sr-only">Open a report or start a new one.</p>
            </div>
          </div>

          <div className="flex h-14 shrink-0 items-center rounded-[16px] bg-white p-2.5 shadow-[var(--shadow-card)] sm:h-16 sm:p-3">
            <button
              type="button"
              className="flex size-9 shrink-0 items-center justify-center rounded-[20px] bg-[#e2f0f5] font-['Poppins',sans-serif] text-[18px] font-semibold leading-normal text-[#333] outline-none transition-colors hover:bg-[#d4e8ef] focus-visible:ring-2 focus-visible:ring-[#1e1e1f]/20 sm:size-10 sm:text-[20px]"
              aria-label="Account"
            >
              S
            </button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1460px]">
          <div className="flex w-full min-w-0 flex-col gap-5">
            <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 md:gap-4">
              <div className="min-w-0 w-full sm:max-w-[min(100%,42rem)] sm:flex-1 md:max-w-none">
                <ReportFilterToggle value={reportFilter} onChange={setReportFilter} counts={filterCounts} />
              </div>
              <div className="w-full min-w-0 sm:w-auto sm:shrink-0">
                <button
                  type="button"
                  onClick={onOpenComponents}
                  className="inline-flex h-12 min-h-12 w-full min-w-0 shrink-0 touch-manipulation items-center justify-center gap-2 rounded-[16px] border border-[#e4e4e4] bg-white px-3 font-['Inter',sans-serif] text-sm font-medium text-[#1e1e1f] shadow-[var(--shadow-card)] transition-colors hover:bg-[#f5f5f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e1e1f]/20 sm:w-auto sm:px-4"
                >
                  <IconLayoutGrid className="size-5 shrink-0 text-[#707070]" aria-hidden />
                  <span className="truncate">Components</span>
                </button>
              </div>
              <div className="flex w-full min-w-0 justify-end sm:inline-flex sm:w-fit sm:shrink-0 sm:justify-end">
                <div
                  className={`relative min-w-12 overflow-hidden rounded-[16px] border border-[#e4e4e4] bg-white shadow-[var(--shadow-card)] transition-[max-width] duration-300 ease-out motion-reduce:transition-none hover:bg-[#fafafa] focus-within:border-[#d7d7d7] focus-within:ring-2 focus-within:ring-[#1e1e1f]/20 focus-within:ring-offset-0 ${
                    searchExpanded
                      ? 'max-w-[min(100%,28rem)] md:max-w-sm'
                      : 'max-w-12 cursor-text'
                  }`}
                >
                  <label htmlFor="reports-toolbar-search" className="sr-only">
                    Search reports
                  </label>
                  <IconSearch
                    className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#707070]"
                    aria-hidden
                  />
                  <input
                    id="reports-toolbar-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="Search reports…"
                    autoComplete="off"
                    spellCheck={false}
                    className="box-border h-12 w-full min-w-0 rounded-[16px] border-0 bg-transparent py-0 pl-10 pr-3 font-['Inter',sans-serif] text-sm text-[#1e1e1f] outline-none placeholder:text-[#707070]"
                  />
                </div>
              </div>
              <div className="w-full min-w-0 sm:w-auto sm:shrink-0">
                <PrimaryButton
                  type="button"
                  onClick={onNewReport}
                  className="h-12 min-h-12 w-full min-w-0 gap-2 rounded-[16px] sm:w-auto"
                >
                  <IconAdd className="size-5 shrink-0" aria-hidden />
                  New Report
                </PrimaryButton>
              </div>
            </div>

            {empty ? (
          <div className="overflow-hidden rounded-2xl bg-white px-6 py-16 text-center shadow-[var(--shadow-card)]">
            <p className="font-['Inter',sans-serif] text-sm text-[#707070]">
              No dashboards yet. Create one with New Report.
            </p>
          </div>
        ) : filteredEmpty ? (
          <div className="overflow-hidden rounded-2xl bg-white px-6 py-16 text-center shadow-[var(--shadow-card)]">
            <p className="font-['Inter',sans-serif] text-sm text-[#707070]">
              {noSearchMatches ? 'No reports match your search.' : 'No reports in this category.'}
            </p>
          </div>
        ) : layoutMode === 'tile' ? (
          <ul
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            role="list"
          >
            {filteredDashboards.map((d) => {
              const menuOpen = actionsMenuId === d.id;
              return (
                <li key={d.id} className="min-w-0 isolate">
                  <DashboardTileCard
                    title={d.title}
                    status={d.status}
                    lastUpdatedLabel={`Last Updated ${formatUpdated(d.updatedAt)}`}
                    coverImageDataUrl={d.coverImageDataUrl}
                    sharedBy={d.sharedBy}
                    sharedWith={d.sharedWith}
                    onClick={() => onOpenDashboard(d.id)}
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
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]">
            <ul className="divide-y divide-[#ebebeb]" role="list">
              {filteredDashboards.map((d) => {
                const menuOpen = actionsMenuId === d.id;
                return (
                  <li key={d.id}>
                    <div className="group flex w-full items-center">
                      <button
                        type="button"
                        onClick={() => onOpenDashboard(d.id)}
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
                                <span className="font-medium text-[#1e1e1f]">{d.sharedBy.displayName}</span>
                              </span>
                            ) : null}
                            <span className="mt-0.5 block font-['Inter',sans-serif] text-xs text-[#707070]">
                              Last Updated {formatUpdated(d.updatedAt)}
                            </span>
                          </div>
                        </div>
                        <DashboardStatusBadge status={d.status} />
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
                  </li>
                );
              })}
            </ul>
          </div>
        )}
          </div>
        </div>
      </div>
    </>
  );
}
