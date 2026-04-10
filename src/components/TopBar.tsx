import { useState } from 'react';
import { IconCalendar, IconCheck, IconEdit, IconLocation, IconShare } from './Icons';
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
}: TopBarProps) {
  const [editing, setEditing] = useState(false);
  const [scope, setScope] = useState<string>(SCOPE_OPTIONS[0]);
  const [reportDate, setReportDate] = useState<string>(DATE_OPTIONS[0]);

  return (
    <header className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch">
      <div className="flex min-h-16 min-w-0 flex-1 flex-col gap-3 rounded-2xl bg-white p-3 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-3 sm:py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-0 py-1 sm:px-2">
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
        </div>

        <div className="flex w-full min-w-0 shrink-0 flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <HeaderSelect
            label="Report scope"
            icon={IconLocation}
            value={scope}
            onChange={setScope}
            options={SCOPE_OPTIONS}
            textClass="text-[#333]"
          />
          <HeaderSelect
            label="Report date"
            icon={IconCalendar}
            value={reportDate}
            onChange={setReportDate}
            options={DATE_OPTIONS}
            textClass="text-[#1e1e1f]"
          />
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {onShare ? (
              <button
                type="button"
                onClick={onShare}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-solid border-black bg-white font-['Inter',sans-serif] text-black outline-none transition-[border-color,box-shadow] duration-150 hover:border-black/75 hover:shadow-[var(--shadow-focus)] focus-visible:border-black/75 focus-visible:shadow-[var(--shadow-focus)] active:border-black"
                aria-label="Share dashboard"
                title="Share"
              >
                <IconShare className="block size-5 shrink-0" />
              </button>
            ) : null}
            <SecondaryButton type="button" onClick={onSaveAndClose} className="w-full sm:w-auto">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="button" disabled={publishDisabled} onClick={onPublish} className="w-full sm:w-auto">
              Publish
            </PrimaryButton>
          </div>
        </div>
      </div>
    </header>
  );
}
