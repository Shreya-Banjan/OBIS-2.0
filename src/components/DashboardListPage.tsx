import { useState } from 'react';
import type { SavedDashboard } from '../types';
import { DashboardThumbnail } from './DashboardThumbnail';
import { IconLayoutGrid, IconLayoutList, IconMenu } from './Icons';
import { PrimaryButton } from './PrimaryButton';

function formatUpdated(ts: number) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
}

type DashboardListPageProps = {
  dashboards: SavedDashboard[];
  onOpenDashboard: (id: string) => void;
  onNewReport: () => void;
  onMenuOpen: () => void;
};

type LayoutMode = 'tile' | 'list';

function StatusBadge({ status }: { status: SavedDashboard['status'] }) {
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

export function DashboardListPage({ dashboards, onOpenDashboard, onNewReport, onMenuOpen }: DashboardListPageProps) {
  const [layout, setLayout] = useState<LayoutMode>('tile');

  const empty = dashboards.length === 0;

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#ebebeb] px-3 pb-8 pt-4 font-[family-name:var(--font-inter)] sm:px-4 sm:pt-6">
      <div className="mx-auto w-full max-w-[1460px]">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
            <div className="flex h-16 w-fit shrink-0 items-center justify-center rounded-2xl bg-white p-3 shadow-[var(--shadow-card)]">
              <button
                type="button"
                onClick={onMenuOpen}
                className="flex size-10 items-center justify-center rounded-lg bg-white text-[#1e1e1f] hover:bg-[#f5f5f5]"
                aria-label="Open menu"
                aria-haspopup="dialog"
              >
                <IconMenu className="size-6" />
              </button>
            </div>
            <div className="min-w-0 pt-2 sm:pt-0">
              <h1 className="font-['Poppins',sans-serif] text-2xl font-semibold text-[#1e1e1f] sm:text-[28px] sm:leading-tight">
                Neuron 2.0
              </h1>
              <p className="mt-1 font-['Inter',sans-serif] text-sm text-[#707070]">Open a report or start a new one.</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <div
              role="group"
              aria-label="Report layout"
              className="inline-flex w-full justify-center rounded-xl border border-[#e4e4e4] bg-white p-1 shadow-[var(--shadow-card)] sm:w-auto sm:justify-start"
            >
              <button
                type="button"
                onClick={() => setLayout('tile')}
                title="Tile view"
                aria-label="Tile view"
                className={`flex size-11 items-center justify-center rounded-lg transition-colors sm:size-10 ${
                  layout === 'tile'
                    ? 'bg-[#ebebeb] text-[#1e1e1f]'
                    : 'text-[#707070] hover:bg-[#f5f5f5] hover:text-[#1e1e1f]'
                }`}
                aria-pressed={layout === 'tile'}
              >
                <IconLayoutGrid className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => setLayout('list')}
                title="List view"
                aria-label="List view"
                className={`flex size-11 items-center justify-center rounded-lg transition-colors sm:size-10 ${
                  layout === 'list'
                    ? 'bg-[#ebebeb] text-[#1e1e1f]'
                    : 'text-[#707070] hover:bg-[#f5f5f5] hover:text-[#1e1e1f]'
                }`}
                aria-pressed={layout === 'list'}
              >
                <IconLayoutList className="size-5" />
              </button>
            </div>
            <PrimaryButton type="button" onClick={onNewReport} className="w-full shrink-0 sm:w-auto">
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
        ) : layout === 'tile' ? (
          <ul
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            role="list"
          >
            {dashboards.map((d) => (
              <li key={d.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onOpenDashboard(d.id)}
                  className="flex w-full flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[0_4px_14px_rgba(30,30,31,0.12)]"
                >
                  <div className="p-3 pb-0">
                    {d.coverImageDataUrl ? (
                      <div className="aspect-[5/3] w-full overflow-hidden rounded-xl border border-[#e4e4e4] bg-[#ebebeb]">
                        <img
                          src={d.coverImageDataUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <DashboardThumbnail sections={d.sections} compact />
                    )}
                  </div>
                  <div className="flex flex-col gap-2 p-4 pt-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 flex-1 font-['Poppins',sans-serif] text-base font-semibold leading-snug text-[#1e1e1f]">
                        {d.title}
                      </span>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="font-['Inter',sans-serif] text-xs text-[#707070]">
                      Last edited {formatUpdated(d.updatedAt)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]">
            <ul className="divide-y divide-[#ebebeb]" role="list">
              {dashboards.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => onOpenDashboard(d.id)}
                    className="flex w-full flex-col gap-1 px-5 py-4 text-left transition-colors hover:bg-[#fafafa] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-5"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-['Poppins',sans-serif] text-base font-semibold text-[#1e1e1f]">
                        {d.title}
                      </span>
                      <span className="mt-0.5 block font-['Inter',sans-serif] text-xs text-[#707070]">
                        Last edited {formatUpdated(d.updatedAt)}
                      </span>
                    </div>
                    <StatusBadge status={d.status} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
