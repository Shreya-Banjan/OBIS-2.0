import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import type { SavedDashboard } from '../types';
import { IconClose, IconCopy } from './Icons';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

function isValidEmail(value: string) {
  const t = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

/** Split pasted lists: newlines, commas, semicolons, or spaces between addresses. */
function parseEmailList(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const parts = raw
    .split(/[\n,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const p of parts) {
    if (!isValidEmail(p)) continue;
    const k = p.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out;
}

type ShareDashboardModalProps = {
  dashboard: SavedDashboard;
  onClose: () => void;
  /** Persist recipient list on this device when the textarea is committed. */
  onShareEmailsChange?: (emails: string[]) => void;
};

export function ShareDashboardModal({
  dashboard,
  onClose,
  onShareEmailsChange,
}: ShareDashboardModalProps) {
  const headingId = useId();
  const linkFieldId = useId();
  const emailFieldId = useId();
  const [copied, setCopied] = useState(false);
  const [emailText, setEmailText] = useState(() => (dashboard.shareEmails ?? []).join('\n'));

  useEffect(() => {
    setEmailText((dashboard.shareEmails ?? []).join('\n'));
  }, [dashboard.id, dashboard.shareEmails]);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const u = new URL(window.location.href);
    u.search = '';
    u.hash = '';
    u.searchParams.set('openDashboard', dashboard.id);
    return u.toString();
  }, [dashboard.id]);

  const flushRecipients = useCallback(() => {
    const parsed = parseEmailList(emailText);
    onShareEmailsChange?.(parsed);
  }, [emailText, onShareEmailsChange]);

  const handleClose = useCallback(() => {
    flushRecipients();
    onClose();
  }, [flushRecipients, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [shareUrl]);

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="absolute inset-0 bg-[var(--color-ink)]/50" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative z-10 flex max-h-[min(92dvh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-panel)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#ebebeb] px-5 py-4 sm:px-6">
          <h2 id={headingId} className="font-['Poppins',sans-serif] text-lg font-semibold text-[#1e1e1f] sm:text-xl">
            Share dashboard
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-lg p-1 text-[#1e1e1f] hover:bg-[#f0f0f0]"
            aria-label="Close"
          >
            <IconClose className="size-6" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 sm:px-6">
          <p className="font-['Inter',sans-serif] text-sm text-[#707070]">
            Copy a link to this dashboard. In this demo, opening the link in the same browser loads the report from
            saved data on this device.
          </p>
          <div>
            <label
              htmlFor={linkFieldId}
              className="mb-1.5 block font-['Inter',sans-serif] text-xs font-medium text-[#1e1e1f]"
            >
              Link
            </label>
            <div className="flex items-stretch gap-2">
              <input
                id={linkFieldId}
                type="text"
                readOnly
                value={shareUrl}
                className="h-12 min-w-0 flex-1 rounded-xl border border-[#e4e4e4] bg-[#fafafa] px-4 font-['Inter',sans-serif] text-sm text-[#1e1e1f] outline-none ring-[var(--color-brand-primary)] transition-[border-color,box-shadow] duration-150 hover:border-[var(--color-brand-primary)] hover:ring-2 hover:ring-[var(--ring-input-focus)] focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring-input-focus)] active:border-[var(--color-brand-primary)] active:ring-2 active:ring-[var(--ring-input-focus)]"
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                onClick={() => void copyLink()}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#e4e4e4] bg-[#fafafa] text-[#1e1e1f] outline-none ring-[var(--color-brand-primary)] transition-[border-color,background-color,box-shadow] duration-150 hover:border-[var(--color-brand-primary)] hover:bg-[#f0f0f0] hover:ring-2 hover:ring-[var(--ring-input-focus)] focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring-input-focus)] active:border-[var(--color-brand-primary)] active:ring-2 active:ring-[var(--ring-input-focus)]"
                aria-label="Copy link"
                title="Copy link"
              >
                <IconCopy className="block size-5 shrink-0" />
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor={emailFieldId}
              className="mb-1.5 block font-['Inter',sans-serif] text-xs font-medium text-[#1e1e1f]"
            >
              Share with (emails)
            </label>
            <textarea
              id={emailFieldId}
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              onBlur={() => flushRecipients()}
              rows={5}
              className="min-h-[7.5rem] w-full resize-y rounded-xl border border-[#e4e4e4] bg-[#FFF] px-4 py-3 font-['Inter',sans-serif] text-sm text-[#1e1e1f] outline-none ring-[var(--color-brand-primary)] transition-[border-color,box-shadow] duration-150 placeholder:text-[#707070]/60 hover:border-[var(--color-brand-primary)] hover:ring-2 hover:ring-[var(--ring-input-focus)] focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring-input-focus)] active:border-[var(--color-brand-primary)] active:ring-2 active:ring-[var(--ring-input-focus)]"
              placeholder={'One address per line, or paste many separated by commas or newlines.\nname@company.com\nother@company.com'}
              autoComplete="off"
            />
            <p className="mt-1.5 font-['Inter',sans-serif] text-xs text-[#707070]">
              Optional — saved with this dashboard on this device. Invalid entries are ignored when you leave the field
              or close.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#ebebeb] bg-white px-5 py-4 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-3 sm:px-6">
          <SecondaryButton type="button" onClick={handleClose} className="w-full sm:w-auto">
            Close
          </SecondaryButton>
          <PrimaryButton type="button" onClick={() => void copyLink()} className="w-full sm:w-auto">
            {copied ? 'Copied' : 'Share'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
