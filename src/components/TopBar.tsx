import { useEffect, useRef, useState } from 'react';
import {
  IconCalendar,
  IconCheck,
  IconChevronLeft,
  IconEdit,
  IconLocation,
  IconMoreVertical,
  IconShare,
} from './Icons';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { DATE_OPTIONS, SCOPE_OPTIONS } from '../data/headerSelectOptions';
import type { SavedDashboard } from '../types';
import { DashboardStatusBadge } from './DashboardStatusBadge';
import { HeaderSelect } from './HeaderSelect';

type AutoSaveIndicator = 'idle' | 'saving' | 'saved';

type TopBarProps = {
  title: string;
  onTitleChange: (value: string) => void;
  onPublish: () => void;
  /** Persist latest title/sections and return to the dashboard list. */
  onSaveAndClose: () => void;
  /** When true, Publish is inactive until at least one dashboard section exists. */
  publishDisabled?: boolean;
  /** Auto-save UI: spinner while saving, tick when saved (editor only). */
  autoSaveStatus?: AutoSaveIndicator;
  /** Draft / published pill in the editor header. */
  reportStatus?: SavedDashboard['status'] | null;
  /** Opens share dialog (copy link + recipients). Editor only when provided. */
  onShare?: () => void;
  /** Delete active report (published header overflow menu). */
  onDelete?: () => void;
  /** When set, shows a back chevron inline before the title (same row as title / status). */
  onBackToReports?: () => void;
};

export function TopBar({
  title,
  onTitleChange,
  onPublish,
  onSaveAndClose,
  publishDisabled = false,
  autoSaveStatus = 'idle',
  reportStatus = null,
  onShare,
  onDelete,
  onBackToReports,
}: TopBarProps) {
  const [editing, setEditing] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRootRef = useRef<HTMLDivElement>(null);
  const [scope, setScope] = useState<string>(SCOPE_OPTIONS[0]);
  const [reportDate, setReportDate] = useState<string>(DATE_OPTIONS[0]);

  const isPublished = reportStatus === 'published';

  useEffect(() => {
    if (!overflowOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (overflowRootRef.current && !overflowRootRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOverflowOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [overflowOpen]);

  const cardShell =
    'rounded-2xl bg-white shadow-[var(--shadow-card)]';

  return (
    <header className="flex w-full min-w-0 flex-wrap items-stretch gap-2 sm:gap-3">
      <div
        className={`flex min-h-16 min-w-0 flex-[1_1_12rem] flex-wrap items-center gap-x-2 gap-y-2 p-3 sm:gap-x-3 sm:px-3 sm:py-2 ${cardShell}`}
      >
        {onBackToReports ? (
          <button
            type="button"
            onClick={onBackToReports}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[#1e1e1f] outline-none transition-colors hover:bg-[#f5f5f5] focus-visible:ring-2 focus-visible:ring-[#1e1e1f]/20"
            aria-label="Back to reports"
            title="Back to reports"
          >
            <IconChevronLeft className="size-5 shrink-0" aria-hidden />
          </button>
        ) : null}

        <div
          className={`flex min-w-0 flex-[1_1_10rem] items-center gap-2 rounded-xl px-0 py-1 sm:min-w-[10rem] ${onBackToReports ? 'sm:pl-0 sm:pr-1' : 'sm:px-1'}`}
        >
          {editing ? (
            <input
              autoFocus
              className="min-w-0 max-w-full flex-1 border-b border-[#d7d7d7] bg-transparent font-['Poppins',sans-serif] text-lg font-semibold text-[#1e1e1f] outline-none sm:min-w-[8rem] sm:text-xl"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setEditing(false);
              }}
              aria-label="Report title"
            />
          ) : (
            <button
              type="button"
              className="group inline-flex w-max max-w-full min-w-0 shrink items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-[#f5f5f5]"
              onClick={() => setEditing(true)}
            >
              <span className="truncate font-['Poppins',sans-serif] text-lg font-semibold leading-tight text-[#1e1e1f] sm:text-xl">
                {title || 'Enter Title'}
              </span>
              <IconEdit className="block size-[18px] shrink-0 text-[#1e1e1f]/50 group-hover:text-[#1e1e1f]/70" aria-hidden />
            </button>
          )}
          {reportStatus ? <DashboardStatusBadge status={reportStatus} /> : null}
          {autoSaveStatus === 'saving' ? (
            <span
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap font-['Poppins',sans-serif] text-[10px] font-medium leading-none text-[#1e1e1f]/50"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <span className="autosave-spinner size-2.5 shrink-0" aria-hidden />
              Saving…
            </span>
          ) : null}
          {autoSaveStatus === 'saved' ? (
            <span
              className="flex shrink-0 items-center gap-1 whitespace-nowrap font-['Poppins',sans-serif] text-[10px] font-medium leading-none text-[#1e1e1f]/45"
              role="status"
              aria-live="polite"
            >
              <span className="autosave-check-in inline-flex shrink-0" aria-hidden>
                <IconCheck className="size-2.5 text-emerald-600/85" />
              </span>
              Auto saved
            </span>
          ) : null}
        </div>

        <HeaderSelect
          layout="toolbar"
          label="Report scope"
          icon={IconLocation}
          value={scope}
          onChange={setScope}
          options={SCOPE_OPTIONS}
          textClass="text-[#333]"
        />
        <HeaderSelect
          layout="toolbar"
          label="Report date"
          icon={IconCalendar}
          value={reportDate}
          onChange={setReportDate}
          options={DATE_OPTIONS}
          textClass="text-[#1e1e1f]"
        />
      </div>

      <div
        role="toolbar"
        aria-label="Report actions"
        className={`flex min-h-16 w-full min-w-0 shrink-0 flex-wrap items-center justify-end gap-2 p-2 px-3 sm:ml-auto sm:w-auto sm:shrink-0 sm:p-2 sm:px-3 ${cardShell}`}
      >
          {isPublished ? (
            <>
              {onShare ? (
                <SecondaryButton
                  type="button"
                  onClick={onShare}
                  className="min-w-0 gap-2 px-4"
                  aria-label="Share report"
                >
                  <IconShare className="size-5 shrink-0" aria-hidden />
                  Share
                </SecondaryButton>
              ) : null}
              <SecondaryButton type="button" onClick={onSaveAndClose} className="min-w-0 px-4">
                Cancel
              </SecondaryButton>
              <PrimaryButton type="button" onClick={onPublish} className="min-w-0 px-4">
                Edit
              </PrimaryButton>
              {onShare || onDelete ? (
                <div ref={overflowRootRef} className="relative shrink-0">
                  <button
                    type="button"
                    className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-solid border-black bg-white text-[#1e1e1f] outline-none transition-[border-color,box-shadow] duration-150 hover:border-black/75 hover:shadow-[var(--shadow-focus)] focus-visible:border-black/75 focus-visible:shadow-[var(--shadow-focus)] active:border-black"
                    aria-haspopup="menu"
                    aria-expanded={overflowOpen}
                    aria-controls={overflowOpen ? 'topbar-overflow-menu' : undefined}
                    aria-label="More actions"
                    title="More actions"
                    onClick={() => setOverflowOpen((o) => !o)}
                  >
                    <IconMoreVertical className="size-5 shrink-0" aria-hidden />
                  </button>
                  {overflowOpen ? (
                    <div
                      id="topbar-overflow-menu"
                      role="menu"
                      className="absolute right-0 top-[calc(100%+6px)] z-[60] min-w-[11rem] overflow-hidden rounded-xl border border-[#e8e8e8] bg-white py-1 shadow-[var(--shadow-elevated)]"
                    >
                      {onShare ? (
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center px-3 py-2.5 text-left font-['Inter',sans-serif] text-sm text-[#1e1e1f] hover:bg-[#f5f5f5]"
                          onClick={() => {
                            setOverflowOpen(false);
                            onShare();
                          }}
                        >
                          Share
                        </button>
                      ) : null}
                      {onDelete ? (
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center px-3 py-2.5 text-left font-['Inter',sans-serif] text-sm text-[#9e1f16] hover:bg-[#fff5f5]"
                          onClick={() => {
                            setOverflowOpen(false);
                            onDelete();
                          }}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <SecondaryButton type="button" onClick={onSaveAndClose} className="min-w-0 px-4">
                Cancel
              </SecondaryButton>
              <PrimaryButton
                type="button"
                disabled={publishDisabled}
                onClick={onPublish}
                className="min-w-0 px-4"
              >
                Publish
              </PrimaryButton>
            </>
          )}
      </div>
    </header>
  );
}
