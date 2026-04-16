import { lazy, Suspense, useMemo, useState, type CSSProperties } from 'react';
import type { DashboardListLayoutMode, SavedDashboard } from '../types';
import { NAV_BURGER_MIN_LAYOUT_WIDTH_PX } from '../layoutUtils';
import { useContainerNarrowToolbar } from '../useContainerNarrowToolbar';
import { useEffectiveLayoutWidth } from '../useEffectiveLayoutWidth';
import { AppBurgerButton } from './AppBurgerButton';
import { IconLayoutGrid } from './Icons';
import { DashboardListPageSkeleton } from './DashboardListPageSkeleton';
import { ReportsListToolbarActions } from './ReportsListToolbarActions';
import { ViewportSizePresetBar } from './ViewportSizePresetBar';

export type { DashboardListLayoutMode } from '../types';

const DashboardListBody = lazy(() =>
  import('./DashboardListBody').then((m) => ({ default: m.DashboardListBody }))
);

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
      className="flex w-full min-h-12 min-w-0 flex-nowrap items-stretch gap-1.5 overflow-x-auto overscroll-x-contain rounded-[10px] bg-white p-1 box-border [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] sm:inline-flex sm:h-12 sm:w-auto sm:max-w-none sm:gap-2"
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

type DashboardListPageProps = {
  dashboards: SavedDashboard[];
  onOpenDashboard: (id: string) => void;
  onShareDashboard: (id: string) => void;
  onDeleteDashboard: (id: string) => void;
  onNewReport: () => void;
  onMenuOpen: () => void;
  onOpenComponents: () => void;
  layoutMode: DashboardListLayoutMode;
  previewViewportWidth: number | null;
  onPreviewViewportWidthChange: (width: number | null) => void;
  /** From effective layout width (preview or window): 1460 or 1843 at ≥3200. */
  reportsContentMaxWidth: number;
};

/**
 * Reports home shell + lazy body (same pattern as executive-dashboard-ui’s `Suspense` +
 * `SummaryOverviewPanelSkeleton` around `LazySummaryOverviewPanel`).
 */
export function DashboardListPage({
  dashboards,
  onOpenDashboard,
  onShareDashboard,
  onDeleteDashboard,
  onNewReport,
  onMenuOpen,
  onOpenComponents,
  layoutMode,
  previewViewportWidth,
  onPreviewViewportWidthChange,
  reportsContentMaxWidth,
}: DashboardListPageProps) {
  const [reportFilter, setReportFilter] = useState<ReportFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
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

  const { containerRef, narrowToolbar } = useContainerNarrowToolbar();
  const effectiveLayoutWidth = useEffectiveLayoutWidth(previewViewportWidth);

  const listBody =
    empty ? (
      <div
        className="dashboard-list-page-layer overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]"
        style={{ ['--page-stack']: 2 } as CSSProperties}
      >
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-[min(50vh,22rem)] w-full flex-col items-center justify-center gap-6 px-6 py-16 text-center"
        >
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-[#e0e0e0] bg-[#fafafa] px-6 py-12 sm:px-10 sm:py-14">
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-[#ebebeb] bg-white shadow-[var(--shadow-subtle)]"
              aria-hidden
            >
              <IconLayoutGrid className="size-7 text-[#b0b0b0]" />
            </div>
            <div className="max-w-xs space-y-1.5">
              <p className="font-['Inter',sans-serif] text-base font-medium text-[#1e1e1f]">
                No reports yet
              </p>
              <p className="font-['Inter',sans-serif] text-sm leading-relaxed text-[#707070]">
                When you create a report, it will show up here. Use <span className="whitespace-nowrap">New Report</span>{' '}
                in the toolbar to get started.
              </p>
            </div>
          </div>
        </div>
      </div>
    ) : filteredEmpty ? (
      <div
        className="dashboard-list-page-layer overflow-hidden rounded-2xl bg-white px-6 py-16 text-center shadow-[var(--shadow-card)]"
        style={{ ['--page-stack']: 2 } as CSSProperties}
      >
        <p className="font-['Inter',sans-serif] text-sm text-[#707070]">
          {noSearchMatches ? 'No reports match your search.' : 'No reports in this category.'}
        </p>
      </div>
    ) : (
      <Suspense
        fallback={<DashboardListPageSkeleton reportsContentMaxWidth={reportsContentMaxWidth} />}
      >
        <DashboardListBody
          filteredDashboards={filteredDashboards}
          layoutMode={layoutMode}
          onOpenDashboard={onOpenDashboard}
          onShareDashboard={onShareDashboard}
          onDeleteDashboard={onDeleteDashboard}
          previewViewportWidth={previewViewportWidth}
        />
      </Suspense>
    );

  const toolbarActionsProps = {
    searchQuery,
    onSearchQueryChange: setSearchQuery,
    searchFocused,
    onSearchFocus: () => setSearchFocused(true),
    onSearchBlur: () => setSearchFocused(false),
    onNewReport,
  };

  return (
    <>
      <div className="min-h-dvh overflow-x-hidden bg-[#ebebeb] px-3 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] font-[family-name:var(--font-inter)] sm:px-4">
        <ViewportSizePresetBar
          selectedWidth={previewViewportWidth}
          onSelectWidth={onPreviewViewportWidthChange}
          onOpenComponents={onOpenComponents}
        />
        <div
          className={
            previewViewportWidth != null ? 'mx-auto w-full min-w-0' : 'w-full min-w-0'
          }
          style={
            previewViewportWidth != null
              ? { maxWidth: `${previewViewportWidth}px` }
              : undefined
          }
        >
          <div
            className="dashboard-list-page-layer mb-5 flex w-full min-w-0 items-center gap-2 sm:gap-3"
            style={{ ['--page-stack']: 0 } as CSSProperties}
          >
            {effectiveLayoutWidth >= NAV_BURGER_MIN_LAYOUT_WIDTH_PX ? (
              <AppBurgerButton
                onClick={onMenuOpen}
                className="h-14 min-h-0 w-14 shrink-0 rounded-[16px] border-0 bg-white p-2.5 shadow-[var(--shadow-card)] hover:bg-[#f5f5f5] sm:h-16 sm:w-16 sm:p-3 [&_svg]:size-6"
              />
            ) : null}

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

          <div
            ref={containerRef}
            className="@container mx-auto w-full"
            style={{ maxWidth: `${reportsContentMaxWidth}px` }}
          >
            <div className="flex w-full min-w-0 flex-col gap-5">
              {narrowToolbar ? (
                <>
                  <div
                    className="dashboard-list-page-layer w-full min-w-0"
                    style={{ ['--page-stack']: 1 } as CSSProperties}
                  >
                    <ReportFilterToggle value={reportFilter} onChange={setReportFilter} counts={filterCounts} />
                  </div>
                  <div
                    className="dashboard-list-page-layer w-full min-w-0 border-b border-[#e0e0e0] pb-4"
                    style={{ ['--page-stack']: 1 } as CSSProperties}
                  >
                    <ReportsListToolbarActions layout="narrow" {...toolbarActionsProps} />
                  </div>
                  {listBody}
                </>
              ) : (
                <>
                  <div
                    className="dashboard-list-page-layer flex w-full min-w-0 flex-col gap-3 @min-[640px]:flex-row @min-[640px]:flex-wrap @min-[640px]:items-center @min-[640px]:gap-3 @min-[768px]:gap-4"
                    style={{ ['--page-stack']: 1 } as CSSProperties}
                  >
                    <div className="min-w-0 w-full @min-[640px]:max-w-[min(100%,42rem)] @min-[640px]:flex-1 @min-[640px]:min-w-[12rem] @min-[768px]:max-w-none">
                      <ReportFilterToggle value={reportFilter} onChange={setReportFilter} counts={filterCounts} />
                    </div>
                    <ReportsListToolbarActions layout="wide" {...toolbarActionsProps} />
                  </div>
                  {listBody}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
