import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { DEFAULT_REPORT_DOMAIN, REPORT_DOMAIN_OPTIONS, type ReportDomain } from '../data/reportDomains';
import { MONTH_OPTIONS } from '../data/headerSelectOptions';
import { HeaderSelect } from './HeaderSelect';
import { PartnerScopePickerField } from './PartnerScopePickerField';
import { IconChevronDown, IconClose } from './Icons';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

export type PublishFormValues = {
  title: string;
  scope: string;
  month: string;
  shareEmails: string[];
  /** Optional message for recipients / internal note */
  comment?: string;
  coverImageDataUrl?: string | null;
  /** New report flow only */
  domain?: ReportDomain;
};

type PublishDashboardModalProps = {
  onClose: () => void;
  onConfirm: (values: PublishFormValues) => void;
  initialTitle: string;
  /** New report: title only; primary action is Create Report. */
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
  variant = 'publish',
}: PublishDashboardModalProps) {
  const isNewReport = variant === 'newReport';
  const headingId = useId();
  const titleFieldId = useId();
  const domainFieldId = useId();
  const domainMenuListId = useId();
  const emailId = useId();
  const commentFieldId = useId();
  const domainFieldRef = useRef<HTMLDivElement>(null);
  const domainMenuPanelRef = useRef<HTMLDivElement>(null);
  const domainMenuOpenRef = useRef(false);
  const [domainMenuBox, setDomainMenuBox] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const [draftTitle, setDraftTitle] = useState(initialTitle);
  const [domain, setDomain] = useState<ReportDomain>(DEFAULT_REPORT_DOMAIN);
  const [domainMenuOpen, setDomainMenuOpen] = useState(false);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [month, setMonth] = useState<string>(MONTH_OPTIONS[0]);
  const [shareEmails, setShareEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [comment, setComment] = useState('');

  domainMenuOpenRef.current = domainMenuOpen;

  /** Escape closes domain menu first (capture) so the modal does not dismiss. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (!domainMenuOpenRef.current) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setDomainMenuOpen(false);
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, []);

  useLayoutEffect(() => {
    if (!domainMenuOpen) {
      setDomainMenuBox(null);
      return;
    }
    const measure = () => {
      const btn = domainFieldRef.current?.querySelector('button');
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      setDomainMenuBox({ top: r.bottom + 6, left: r.left, width: r.width });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [domainMenuOpen]);

  useEffect(() => {
    if (!domainMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (domainFieldRef.current?.contains(t)) return;
      if (domainMenuPanelRef.current?.contains(t)) return;
      setDomainMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [domainMenuOpen]);

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
          scope: '',
          month: MONTH_OPTIONS[0],
          shareEmails: [],
          domain,
        });
        return;
      }
      const trimmedComment = comment.trim();
      onConfirm({
        title,
        scope: selectedPartners.join(', '),
        month,
        shareEmails,
        comment: trimmedComment || undefined,
      });
    },
    [draftTitle, initialTitle, isNewReport, domain, selectedPartners, month, shareEmails, comment, onConfirm]
  );

  const domainMenuPortal =
    domainMenuOpen &&
    domainMenuBox &&
    typeof document !== 'undefined' &&
    isNewReport ? (
      createPortal(
        <div
          ref={domainMenuPanelRef}
          id={domainMenuListId}
          role="menu"
          style={{
            position: 'fixed',
            top: domainMenuBox.top,
            left: domainMenuBox.left,
            width: domainMenuBox.width,
            zIndex: 90,
          }}
          className="flex max-h-[min(280px,45vh)] flex-col gap-1 overflow-y-auto overflow-x-hidden rounded-xl border border-[#e8e8e8] bg-white p-1.5 shadow-[var(--shadow-elevated)]"
          onMouseDown={(e) => e.preventDefault()}
        >
          {REPORT_DOMAIN_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              role="menuitem"
              className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left font-['Inter',sans-serif] text-sm transition-colors ${
                opt === domain
                  ? 'bg-[#f5f5f5] font-medium text-[#333333]'
                  : 'font-normal text-[#333333] hover:bg-[#f2f2f2]'
              }`}
              onClick={() => {
                setDomain(opt);
                setDomainMenuOpen(false);
              }}
            >
              {opt}
            </button>
          ))}
        </div>,
        document.body
      )
    ) : null;

  return (
    <>
      {domainMenuPortal}
      <div
        className="fixed inset-0 z-[75] flex items-end justify-center p-3 sm:items-center sm:p-6"
        role="presentation"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
      <div className="absolute inset-0 bg-[var(--color-ink)]/50" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={`relative z-10 flex max-h-[min(92dvh,720px)] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-panel)] ${
          isNewReport ? 'max-w-md' : 'max-w-lg'
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-start justify-between gap-3 px-5 py-4 sm:px-6 ${
            isNewReport ? '' : 'border-b border-[#ebebeb]'
          }`.trim()}
        >
          <h2 id={headingId} className="font-['Poppins',sans-serif] text-lg font-semibold text-[#1e1e1f] sm:text-xl">
            {isNewReport ? 'New Report' : 'Publish dashboard'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-[#1e1e1f] hover:bg-[#f0f0f0]"
            aria-label="Close"
          >
            <IconClose className={isNewReport ? 'size-5' : 'size-6'} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-4 pb-6 sm:px-6 sm:pb-6">
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
                  className="h-12 w-full rounded-xl border border-[#e4e4e4] bg-[#FFF] px-4 font-['Poppins',sans-serif] text-sm font-normal text-[#1e1e1f] outline-none ring-[var(--color-brand-primary)] transition-[border-color,box-shadow] duration-150 placeholder:text-[#707070]/60 hover:border-[var(--color-brand-primary)] hover:ring-2 hover:ring-[var(--ring-input-focus)] focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring-input-focus)] active:border-[var(--color-brand-primary)] active:ring-2 active:ring-[var(--ring-input-focus)]"
                  placeholder={isNewReport ? 'Report title' : 'Dashboard title'}
                  autoComplete="off"
                  autoFocus={isNewReport}
                />
              </div>

              {isNewReport ? (
                <div className="w-full min-w-0 shrink-0">
                  <label
                    htmlFor={domainFieldId}
                    className="mb-1.5 block font-['Inter',sans-serif] text-xs font-medium text-[#1e1e1f]"
                  >
                    Domain
                  </label>
                  <div ref={domainFieldRef} className="relative">
                    <button
                      id={domainFieldId}
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={domainMenuOpen}
                      aria-controls={domainMenuOpen ? domainMenuListId : undefined}
                      onClick={() => setDomainMenuOpen((o) => !o)}
                      className="flex h-12 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-[#e4e4e4] bg-[#FFF] px-4 text-left font-['Poppins',sans-serif] text-sm font-normal text-[#1e1e1f] outline-none ring-[var(--color-brand-primary)] transition-[background-color,border-color,box-shadow] duration-150 hover:border-[var(--color-brand-primary)] hover:bg-[#FFF] hover:ring-2 hover:ring-[var(--ring-input-focus)] focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring-input-focus)] active:border-[var(--color-brand-primary)] active:ring-2 active:ring-[var(--ring-input-focus)]"
                    >
                      <span className="min-w-0 truncate">{domain}</span>
                      <IconChevronDown
                        className={`size-7 shrink-0 text-[#999999] transition-transform duration-150 ${
                          domainMenuOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden
                      />
                    </button>
                  </div>
                </div>
              ) : null}

              {!isNewReport ? (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <PartnerScopePickerField
                      label="Report scope"
                      selectedPartners={selectedPartners}
                      onPartnersChange={setSelectedPartners}
                    />
                    <HeaderSelect
                      label="Month"
                      value={month}
                      onChange={setMonth}
                      options={MONTH_OPTIONS}
                      textClass="font-semibold text-[#1e1e1f]"
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
                        className="h-12 min-w-0 flex-1 rounded-xl border border-[#e4e4e4] bg-[#FFF] px-4 font-['Inter',sans-serif] text-sm text-[#1e1e1f] outline-none ring-[var(--color-brand-primary)] transition-[border-color,box-shadow] duration-150 placeholder:text-[#707070]/60 hover:border-[var(--color-brand-primary)] hover:ring-2 hover:ring-[var(--ring-input-focus)] focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring-input-focus)] active:border-[var(--color-brand-primary)] active:ring-2 active:ring-[var(--ring-input-focus)]"
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

                  <div>
                    <label
                      htmlFor={commentFieldId}
                      className="mb-1.5 block font-['Inter',sans-serif] text-xs font-medium text-[#1e1e1f]"
                    >
                      Comment <span className="font-normal text-[#707070]">(optional)</span>
                    </label>
                    <textarea
                      id={commentFieldId}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      className="min-h-[5.5rem] w-full resize-y rounded-xl border border-[#e4e4e4] bg-[#FFF] px-4 py-3 font-['Inter',sans-serif] text-sm text-[#1e1e1f] outline-none ring-[var(--color-brand-primary)] transition-[border-color,box-shadow] duration-150 placeholder:text-[#707070]/60 hover:border-[var(--color-brand-primary)] hover:ring-2 hover:ring-[var(--ring-input-focus)] focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring-input-focus)] active:border-[var(--color-brand-primary)] active:ring-2 active:ring-[var(--ring-input-focus)]"
                      placeholder="Add a note for recipients or your team…"
                      autoComplete="off"
                    />
                  </div>
                </>
              ) : null}
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#ebebeb] bg-white px-5 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
            <SecondaryButton type="button" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="w-full sm:w-auto">
              {isNewReport ? 'Create Report' : 'Publish'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
