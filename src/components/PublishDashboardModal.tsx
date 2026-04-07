import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import type { DashboardSection } from '../types';
import { DashboardThumbnail } from './DashboardThumbnail';
import { MONTH_OPTIONS, SCOPE_OPTIONS } from '../data/headerSelectOptions';
import { HeaderSelect } from './HeaderSelect';
import { IconCalendar, IconClose, IconLocation } from './Icons';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

export type PublishFormValues = {
  title: string;
  scope: string;
  month: string;
  shareEmails: string[];
  coverImageDataUrl?: string | null;
};

type PublishDashboardModalProps = {
  onClose: () => void;
  onConfirm: (values: PublishFormValues) => void;
  initialTitle: string;
  sections: DashboardSection[];
  /** New report: title only; primary action is Create report. */
  variant?: 'publish' | 'newReport';
};

function isValidEmail(value: string) {
  const t = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

export function PublishDashboardModal({
  onClose,
  onConfirm,
  initialTitle,
  sections,
  variant = 'publish',
}: PublishDashboardModalProps) {
  const isNewReport = variant === 'newReport';
  const headingId = useId();
  const titleFieldId = useId();
  const emailId = useId();

  const [draftTitle, setDraftTitle] = useState(initialTitle);
  const [scope, setScope] = useState<string>('National');
  const [month, setMonth] = useState<string>(MONTH_OPTIONS[0]);
  const [shareEmails, setShareEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');

  const thumbnailTitle = (draftTitle.trim() || initialTitle) || undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const addEmail = useCallback(() => {
    const next = emailInput.trim();
    if (!isValidEmail(next)) return;
    const lower = next.toLowerCase();
    setShareEmails((prev) => (prev.some((x) => x.toLowerCase() === lower) ? prev : [...prev, next.trim()]));
    setEmailInput('');
  }, [emailInput]);

  const removeEmail = useCallback((email: string) => {
    setShareEmails((prev) => prev.filter((x) => x !== email));
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const title = draftTitle.trim() || initialTitle;
      if (isNewReport) {
        onConfirm({
          title,
          scope: 'National',
          month: MONTH_OPTIONS[0],
          shareEmails: [],
          coverImageDataUrl: undefined,
        });
        return;
      }
      onConfirm({
        title,
        scope,
        month,
        shareEmails,
      });
    },
    [draftTitle, initialTitle, isNewReport, scope, month, shareEmails, onConfirm]
  );

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/45" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={`relative z-10 flex max-h-[min(92dvh,720px)] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-panel)] ${
          isNewReport ? 'max-w-md' : 'max-w-lg'
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#ebebeb] px-5 py-4 sm:px-6">
          <h2 id={headingId} className="font-['Poppins',sans-serif] text-lg font-semibold text-[#1e1e1f] sm:text-xl">
            {isNewReport ? 'New report' : 'Publish dashboard'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-[#1e1e1f] hover:bg-[#f0f0f0]"
            aria-label="Close"
          >
            <IconClose className="size-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            {!isNewReport ? (
              <>
                <p className="mb-3 font-['Inter',sans-serif] text-xs text-[#707070]">Preview</p>
                <DashboardThumbnail sections={sections} title={thumbnailTitle} />
              </>
            ) : null}

            <div className={isNewReport ? 'flex flex-col gap-4' : 'mt-5 flex flex-col gap-4'}>
              <div>
                <label
                  htmlFor={titleFieldId}
                  className="mb-1.5 block font-['Inter',sans-serif] text-xs font-medium text-[#1e1e1f]"
                >
                  {isNewReport ? 'Title' : 'Dashboard title'}
                </label>
                <input
                  id={titleFieldId}
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="h-12 w-full rounded-xl border border-[#e4e4e4] bg-[#FFF] px-4 font-['Poppins',sans-serif] text-sm font-semibold text-[#1e1e1f] outline-none ring-[#b6bec8] transition-[border-color,box-shadow] duration-150 placeholder:text-[#707070]/60 focus-visible:border-[#c4c4c4] focus-visible:ring-2"
                  placeholder={isNewReport ? 'Report title' : 'Dashboard title'}
                  autoComplete="off"
                  autoFocus={isNewReport}
                />
              </div>

              {!isNewReport ? (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <HeaderSelect
                      label="Report scope"
                      icon={IconLocation}
                      value={scope}
                      onChange={setScope}
                      options={SCOPE_OPTIONS}
                      textClass="text-[#333]"
                    />
                    <HeaderSelect
                      label="Month"
                      icon={IconCalendar}
                      value={month}
                      onChange={setMonth}
                      options={MONTH_OPTIONS}
                      textClass="text-[#1e1e1f]"
                    />
                  </div>

                  <div>
                    <label htmlFor={emailId} className="mb-1.5 block font-['Inter',sans-serif] text-xs font-medium text-[#1e1e1f]">
                      Share with (email)
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                      <input
                        id={emailId}
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addEmail();
                          }
                        }}
                        className="h-12 min-w-0 flex-1 rounded-xl border border-[#e4e4e4] bg-[#FFF] px-4 font-['Inter',sans-serif] text-sm text-[#1e1e1f] outline-none ring-[#b6bec8] transition-[border-color,box-shadow] duration-150 placeholder:text-[#707070]/60 focus-visible:border-[#c4c4c4] focus-visible:ring-2"
                        placeholder="name@company.com"
                        autoComplete="email"
                      />
                      <SecondaryButton type="button" onClick={addEmail} className="w-full shrink-0 sm:w-auto">
                        Add
                      </SecondaryButton>
                    </div>
                    {shareEmails.length > 0 ? (
                      <ul className="mt-2 flex flex-wrap gap-2" aria-label="Recipients">
                        {shareEmails.map((email) => (
                          <li
                            key={email}
                            className="inline-flex max-w-full items-center gap-1 rounded-lg border border-[#e4e4e4] bg-[#fafafa] py-1 pl-2.5 pr-1 font-['Inter',sans-serif] text-xs text-[#1e1e1f]"
                          >
                            <span className="min-w-0 truncate">{email}</span>
                            <button
                              type="button"
                              onClick={() => removeEmail(email)}
                              className="shrink-0 rounded-md px-1.5 py-0.5 text-[#606080] hover:bg-[#eee]"
                              aria-label={`Remove ${email}`}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#ebebeb] bg-white px-5 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
            <SecondaryButton type="button" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="w-full sm:w-auto">
              {isNewReport ? 'Create report' : 'Publish'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
