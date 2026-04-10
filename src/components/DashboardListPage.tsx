import { useEffect, useRef, useState } from 'react';
import type { SavedDashboard } from '../types';
import { DashboardStatusBadge } from './DashboardStatusBadge';
import { DashboardThumbnail } from './DashboardThumbnail';
import { ProfileAvatar } from './ProfileAvatar';
import { AppBurgerButton } from './AppBurgerButton';
import { IconLayoutGrid, IconLayoutList, IconMoreVertical } from './Icons';
import { PrimaryButton } from './PrimaryButton';

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
  onShare: () => void;
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
            className="pointer-events-auto absolute right-0 top-[calc(100%+6px)] z-[25] min-w-[11rem] overflow-hidden rounded-xl border border-[#e8e8e8] bg-white py-1 shadow-[var(--shadow-elevated)]"
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
  onLayoutModeChange: (mode: DashboardListLayoutMode) => void;
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
  onLayoutModeChange,
}: DashboardListPageProps) {
  const empty = dashboards.length === 0;
  const [actionsMenuId, setActionsMenuId] = useState<string | null>(null);

  return (
    <>
      <div className="min-h-dvh overflow-x-hidden bg-[#ebebeb] px-3 pb-8 pt-4 font-[family-name:var(--font-inter)] sm:px-4 sm:pt-6">
        <div className="mx-auto w-full max-w-[1460px]">
        <div className="mb-6 flex gap-3 sm:mb-8 sm:gap-4">
          <AppBurgerButton onClick={onMenuOpen} className="h-16 self-start sm:self-center" />
          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 pt-2 sm:pt-0">
            <h1 className="font-['Poppins',sans-serif] text-2xl font-semibold text-[#1e1e1f] sm:text-[28px] sm:leading-tight">
              Neuron 2.0
            </h1>
            <p className="mt-1 font-['Inter',sans-serif] text-sm text-[#707070]">Open a report or start a new one.</p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onOpenComponents}
              className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-[#e4e4e4] bg-white px-4 font-['Inter',sans-serif] text-sm font-medium text-[#1e1e1f] shadow-[var(--shadow-card)] transition-colors hover:bg-[#f5f5f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e1e1f]/20 sm:h-11 sm:w-auto"
            >
              <IconLayoutGrid className="size-5 text-[#707070]" aria-hidden />
              Components
            </button>
            <div
              role="group"
              aria-label="Report layout"
              className="inline-flex w-full justify-center rounded-xl border border-[#e4e4e4] bg-white p-1 shadow-[var(--shadow-card)] sm:w-auto sm:justify-start"
            >
              <button
                type="button"
                onClick={() => onLayoutModeChange('tile')}
                title="Tile view"
                aria-label="Tile view"
                className={`flex size-11 items-center justify-center rounded-lg transition-colors sm:size-10 ${
                  layoutMode === 'tile'
                    ? 'bg-[#ebebeb] text-[#1e1e1f]'
                    : 'text-[#707070] hover:bg-[#f5f5f5] hover:text-[#1e1e1f]'
                }`}
                aria-pressed={layoutMode === 'tile'}
              >
                <IconLayoutGrid className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => onLayoutModeChange('list')}
                title="List view"
                aria-label="List view"
                className={`flex size-11 items-center justify-center rounded-lg transition-colors sm:size-10 ${
                  layoutMode === 'list'
                    ? 'bg-[#ebebeb] text-[#1e1e1f]'
                    : 'text-[#707070] hover:bg-[#f5f5f5] hover:text-[#1e1e1f]'
                }`}
                aria-pressed={layoutMode === 'list'}
              >
                <IconLayoutList className="size-5" />
              </button>
            </div>
            <PrimaryButton type="button" onClick={onNewReport} className="w-full shrink-0 sm:w-auto">
              New Report
            </PrimaryButton>
          </div>
          </div>
        </div>

        {empty ? (
          <div className="overflow-hidden rounded-2xl bg-white px-6 py-16 text-center shadow-[var(--shadow-card)]">
            <p className="font-['Inter',sans-serif] text-sm text-[#707070]">
              No dashboards yet. Create one with New Report.
            </p>
          </div>
        ) : layoutMode === 'tile' ? (
          <ul
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            role="list"
          >
            {dashboards.map((d) => {
              const menuOpen = actionsMenuId === d.id;
              return (
                <li key={d.id} className="min-w-0">
                  <div className="group relative rounded-2xl bg-white shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
                    <button
                      type="button"
                      onClick={() => onOpenDashboard(d.id)}
                      className="flex w-full flex-col gap-3 overflow-hidden rounded-2xl p-[20px] text-left"
                    >
                      <div className="aspect-[5/3] w-full shrink-0 overflow-hidden rounded-xl bg-[#f5f5f5]">
                        {d.coverImageDataUrl ? (
                          <img src={d.coverImageDataUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <DashboardThumbnail sections={d.sections} compact />
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="min-w-0 flex-1 font-['Poppins',sans-serif] text-base font-semibold leading-snug text-[#1e1e1f]">
                            {d.title}
                          </span>
                          <DashboardStatusBadge status={d.status} />
                        </div>
                        {d.sharedBy ? (
                          <div className="flex min-w-0 items-center gap-2">
                            <ProfileAvatar sharedBy={d.sharedBy} size="sm" />
                            <span className="min-w-0 font-['Inter',sans-serif] text-xs leading-snug text-[#707070]">
                              Shared by{' '}
                              <span className="font-medium text-[#1e1e1f]">{d.sharedBy.displayName}</span>
                            </span>
                          </div>
                        ) : null}
                        <p className="font-['Inter',sans-serif] text-xs text-[#707070]">
                          Last edited {formatUpdated(d.updatedAt)}
                        </p>
                      </div>
                    </button>
                    <DashboardOverflowActions
                      dashboardId={d.id}
                      title={d.title}
                      isOpen={menuOpen}
                      onOpenChange={(open) => setActionsMenuId(open ? d.id : null)}
                      onEdit={() => onOpenDashboard(d.id)}
                      onShare={() => onShareDashboard(d.id)}
                      onDelete={() => onDeleteDashboard(d.id)}
                      toolbarClassName={[
                        'pointer-events-none absolute right-[14px] top-[14px] z-10 max-w-[calc(100%-28px)]',
                        'opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-150',
                        'sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto sm:group-focus-within:opacity-100 sm:group-focus-within:pointer-events-auto',
                        menuOpen ? 'sm:!pointer-events-auto sm:!opacity-100' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]">
            <ul className="divide-y divide-[#ebebeb]" role="list">
              {dashboards.map((d) => {
                const menuOpen = actionsMenuId === d.id;
                return (
                  <li key={d.id}>
                    <div className="group flex w-full items-center">
                      <button
                        type="button"
                        onClick={() => onOpenDashboard(d.id)}
                        className="flex min-w-0 flex-1 flex-col gap-1 px-5 py-4 text-left transition-colors hover:bg-[#fafafa] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-5"
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
                              Last edited {formatUpdated(d.updatedAt)}
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
                        onShare={() => onShareDashboard(d.id)}
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
    </>
  );
}
