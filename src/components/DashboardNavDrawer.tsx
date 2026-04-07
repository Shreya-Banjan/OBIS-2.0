import { useCallback, useEffect, useState } from 'react';
import { IconAdd, IconChevronDown, IconClose, IconLogout, IconSettings } from './Icons';

type PublishedLink = { id: string; label: string; badge?: string };
type DraftLink = { id: string; label: string; selected?: boolean };

const PUBLISHED_LINKS: PublishedLink[] = [
  { id: 'np', label: 'Network Performance', badge: 'New' },
  { id: 'nh', label: 'Network Health Summary' },
  { id: 'nk', label: 'Network KPI Trend Report' },
  { id: 'na', label: 'Network Availability & Outages' },
  { id: 'bp', label: 'Build Plan vs Performance' },
];

const DRAFT_LINKS: DraftLink[] = [
  { id: 'facts', label: 'Network Facts', selected: true },
  { id: 'd2', label: 'Dashboard 2' },
  { id: 'd3', label: 'Dashboard 3' },
];

type DashboardNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  onNewReport?: () => void;
  onSignOut?: () => void;
};

function SectionChevron({ expanded }: { expanded: boolean }) {
  return (
    <IconChevronDown
      className={`size-5 shrink-0 text-[#999] transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}
      aria-hidden
    />
  );
}

export function DashboardNavDrawer({ open, onClose, onNewReport, onSignOut }: DashboardNavDrawerProps) {
  const [publishedOpen, setPublishedOpen] = useState(true);
  const [draftOpen, setDraftOpen] = useState(true);
  const [sharedOpen, setSharedOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(true);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleNewReport = useCallback(() => {
    onNewReport?.();
    onClose();
  }, [onNewReport, onClose]);

  const handleSignOut = useCallback(() => {
    onSignOut?.();
    onClose();
  }, [onSignOut, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[60] ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        role="presentation"
        className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ease-out ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        className={`absolute left-0 top-0 flex h-dvh w-[min(100vw,328px)] flex-col rounded-r-2xl bg-white p-6 shadow-[1px_2px_8px_0px_rgba(30,30,31,0.1)] transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Neuron 2.0 navigation"
      >
        <div className="flex w-full max-w-[280px] flex-1 flex-col">
          <div className="flex shrink-0 items-start justify-between gap-3">
            <p className="font-['Poppins',sans-serif] text-lg font-semibold text-black">Neuron 2.0</p>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-0.5 text-[#1e1e1f] hover:bg-[#f5f5f5]"
              aria-label="Close"
            >
              <IconClose className="size-6" />
            </button>
          </div>

          <nav className="mt-6 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1">
            <div>
              <button
                type="button"
                onClick={() => setPublishedOpen((v) => !v)}
                className="flex w-full items-center gap-2 py-0 text-left"
                aria-expanded={publishedOpen}
              >
                <SectionChevron expanded={publishedOpen} />
                <span className="font-['Poppins',sans-serif] text-sm font-medium text-[#999]">Published</span>
              </button>
              {publishedOpen ? (
                <ul className="mt-2 flex flex-col gap-0.5 pl-[14px]">
                  {PUBLISHED_LINKS.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left font-['Poppins',sans-serif] text-sm text-[#333] hover:bg-[#f5f5f5]"
                      >
                        <span className="min-w-0 truncate">{item.label}</span>
                        {item.badge ? (
                          <span className="shrink-0 rounded-md bg-[rgba(0,107,235,0.1)] px-1.5 py-0.5 font-['Poppins',sans-serif] text-xs leading-[13px] text-[#5360e1]">
                            {item.badge}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div>
              <div className="flex w-full items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setDraftOpen((v) => !v)}
                  className="flex min-w-0 flex-1 items-center gap-2 py-0 text-left"
                  aria-expanded={draftOpen}
                >
                  <SectionChevron expanded={draftOpen} />
                  <span className="font-['Poppins',sans-serif] text-sm font-medium text-[#999]">Draft</span>
                </button>
                <button
                  type="button"
                  onClick={handleNewReport}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#333] bg-white px-2.5 py-1 font-['Poppins',sans-serif] text-xs tracking-[-0.24px] text-[#333] transition-[border-color,box-shadow] duration-150 hover:border-black hover:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                >
                  <span>New Report</span>
                  <IconAdd className="size-[18px] text-[#e20074]" />
                </button>
              </div>
              {draftOpen ? (
                <ul className="mt-2 flex flex-col gap-0.5 pl-[14px]">
                  {DRAFT_LINKS.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`w-full rounded-[10px] px-3 py-2 text-left font-['Poppins',sans-serif] text-sm hover:bg-[#f5f5f5] ${
                          item.selected
                            ? 'bg-[rgba(226,0,116,0.1)] font-medium text-[#e20074]'
                            : 'text-[#333]'
                        }`}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setSharedOpen((v) => !v)}
                className="flex w-full items-center gap-2 py-0 text-left"
                aria-expanded={sharedOpen}
              >
                <SectionChevron expanded={sharedOpen} />
                <span className="font-['Poppins',sans-serif] text-[13px] font-medium text-[#999]">Shared with me</span>
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setAdminOpen((v) => !v)}
                className="flex w-full items-center gap-2 py-0 text-left"
                aria-expanded={adminOpen}
              >
                <SectionChevron expanded={adminOpen} />
                <span className="font-['Poppins',sans-serif] text-[13px] font-medium text-[#999]">Admin Settings</span>
              </button>
              {adminOpen ? (
                <div className="mt-2 pl-[14px]">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-['Poppins',sans-serif] text-sm text-[#333] hover:bg-[#f5f5f5]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <IconSettings className="size-5 shrink-0 text-[#333]" />
                      <span className="truncate">Admin Control Center</span>
                    </span>
                    <IconChevronDown className="size-5 shrink-0 rotate-[-90deg] text-[#333]" aria-hidden />
                  </button>
                </div>
              ) : null}
            </div>
          </nav>

          <div className="mt-4 shrink-0 rounded-xl bg-[rgba(255,72,72,0.1)]">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-3 py-2 text-left font-['Poppins',sans-serif] text-sm text-[#ff4848] hover:bg-[rgba(255,72,72,0.15)]"
            >
              <IconLogout className="size-5 shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
