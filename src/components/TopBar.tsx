import { useState } from 'react';
import { IconCalendar, IconEdit, IconLocation, IconMenu } from './Icons';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { DATE_OPTIONS, SCOPE_OPTIONS } from '../data/headerSelectOptions';
import { HeaderSelect } from './HeaderSelect';

type TopBarProps = {
  title: string;
  onTitleChange: (value: string) => void;
  onPublish: () => void;
  onCancel: () => void;
  onMenuOpen: () => void;
  /** When true, Publish is inactive until at least one dashboard section exists. */
  publishDisabled?: boolean;
};

export function TopBar({
  title,
  onTitleChange,
  onPublish,
  onCancel,
  onMenuOpen,
  publishDisabled = false,
}: TopBarProps) {
  const [editing, setEditing] = useState(false);
  const [scope, setScope] = useState<string>(SCOPE_OPTIONS[0]);
  const [reportDate, setReportDate] = useState<string>(DATE_OPTIONS[0]);

  return (
    <header className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
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
                className="group flex min-w-0 items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-[#f5f5f5]"
                onClick={() => setEditing(true)}
              >
                <span className="truncate font-['Poppins',sans-serif] text-lg font-semibold text-[#1e1e1f] sm:text-xl">
                  {title || 'Enter Title'}
                </span>
                <IconEdit className="size-[18px] shrink-0 text-[#1e1e1f]/50 group-hover:text-[#1e1e1f]/70" />
              </button>
            )}
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
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:shrink-0 sm:justify-end">
            <SecondaryButton type="button" onClick={onCancel} className="w-full sm:w-auto">
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
