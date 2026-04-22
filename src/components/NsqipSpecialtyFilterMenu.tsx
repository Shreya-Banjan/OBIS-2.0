import type { RefObject } from 'react';
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { QUALITY_NSQIP_SPECIALTIES } from '../data/widgets';
import { IconCheck, IconSearch } from './Icons';

const ALL_IDS = QUALITY_NSQIP_SPECIALTIES.map((s) => s.id);
const ALL_COUNT = ALL_IDS.length;

type NsqipSpecialtyFilterMenuProps = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  /** Currently applied specialty ids (full set = no narrowing). */
  appliedIds: ReadonlySet<string>;
  onApply: (next: Set<string>) => void;
};

function boxStyle(checked: boolean, indeterminate: boolean) {
  if (indeterminate || checked) {
    return 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white';
  }
  return 'border-[#d6d6d6] bg-white text-transparent';
}

export function NsqipSpecialtyFilterMenu({
  open,
  anchorRef,
  onClose,
  appliedIds,
  onApply,
}: NsqipSpecialtyFilterMenuProps) {
  const titleId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Set<string>>(() => new Set(appliedIds));
  const [query, setQuery] = useState('');
  const [fixedRect, setFixedRect] = useState({ top: 0, left: 0, width: 0 });
  const appliedRef = useRef(appliedIds);
  appliedRef.current = appliedIds;

  const updateFixedPosition = () => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    setFixedRect({ top: r.bottom + 6, left: r.left, width: r.width });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateFixedPosition();
    const anchor = anchorRef.current;
    const ro = anchor ? new ResizeObserver(updateFixedPosition) : null;
    if (anchor) ro?.observe(anchor);
    window.addEventListener('scroll', updateFixedPosition, true);
    window.addEventListener('resize', updateFixedPosition);
    return () => {
      ro?.disconnect();
      window.removeEventListener('scroll', updateFixedPosition, true);
      window.removeEventListener('resize', updateFixedPosition);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    setDraft(new Set(appliedRef.current));
    setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const menuEl = menuRef.current;
      const anchorEl = anchorRef.current;
      if (!menuEl) return;
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (menuEl.contains(t) || anchorEl?.contains(t)) return;
      onClose();
    };
    document.addEventListener('mousedown', onPointer, true);
    document.addEventListener('touchstart', onPointer, true);
    return () => {
      document.removeEventListener('mousedown', onPointer, true);
      document.removeEventListener('touchstart', onPointer, true);
    };
  }, [open, onClose, anchorRef]);

  const filteredSpecialties = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QUALITY_NSQIP_SPECIALTIES;
    return QUALITY_NSQIP_SPECIALTIES.filter((s) => s.label.toLowerCase().includes(q));
  }, [query]);

  const draftAllSelected = draft.size === ALL_COUNT;
  const draftNoneSelected = draft.size === 0;
  const allRowIndeterminate = !draftAllSelected && !draftNoneSelected;
  const allRowChecked = draftAllSelected;

  const toggleSpecialty = (id: string) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllRow = () => {
    if (draftAllSelected) setDraft(new Set());
    else setDraft(new Set(ALL_IDS));
  };

  const onResetClick = () => {
    const next = new Set(ALL_IDS);
    onApply(next);
    onClose();
  };

  const onApplyClick = () => {
    if (draftNoneSelected) return;
    onApply(new Set(draft));
    onClose();
  };

  if (!open || typeof document === 'undefined') return null;

  const menu = (
    <div
      ref={menuRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{
        position: 'fixed',
        top: fixedRect.top,
        left: fixedRect.left,
        width: fixedRect.width,
        zIndex: 120,
      }}
      className="box-border flex min-w-0 flex-col gap-2.5 rounded-2xl border border-[#ececec] bg-white px-2 pb-3 pt-3 shadow-[0_0_0_1px_rgba(51,51,51,0.04),0_0_20px_rgba(51,51,51,0.09),0_0_40px_-8px_rgba(51,51,51,0.05)]"
    >
      <div className="rounded-lg bg-white px-1.5 py-1.5">
        <p
          id={titleId}
          className="truncate font-['Poppins',sans-serif] text-sm font-medium leading-5 text-[#333333]"
        >
          Filter by Speciality
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-0">
        <div className="shrink-0 px-1">
          <div className="flex h-[34px] w-full items-center gap-2 rounded-xl border border-[#e8e8e8] bg-white py-3 pl-2 pr-3">
            <span className="flex size-[19px] shrink-0 items-center justify-center text-[#707070]">
              <IconSearch className="size-[18px]" aria-hidden />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent font-['Inter',sans-serif] text-[13px] font-normal text-[#333333] outline-none placeholder:text-[#999999]"
              aria-label="Search specialties"
            />
          </div>
        </div>

        <div
          className="mt-0 flex cursor-pointer items-center gap-2 border-b border-[#e8e8e8] px-4 pb-2.5 pt-4"
          role="button"
          tabIndex={0}
          onClick={toggleAllRow}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleAllRow();
            }
          }}
        >
          <span
            className={[
              'flex size-4 shrink-0 items-center justify-center rounded-[3px] border border-solid transition-colors',
              boxStyle(allRowChecked, allRowIndeterminate),
            ].join(' ')}
            aria-hidden
          >
            {allRowIndeterminate ? (
              <span className="block h-px w-2 rounded-full bg-white" />
            ) : allRowChecked ? (
              <IconCheck className="size-2.5 text-white" />
            ) : null}
          </span>
          <span className="min-w-0 flex-1 truncate font-['Inter',sans-serif] text-[13px] font-normal leading-5 text-[#333333]">
            All Speciality
          </span>
        </div>

        <div className="max-h-[220px] min-h-0 overflow-y-auto overflow-x-hidden">
          {filteredSpecialties.map((s) => {
            const checked = draft.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSpecialty(s.id)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-left transition-colors hover:bg-[#f5f5f5]"
              >
                <span
                  className={[
                    'flex size-4 shrink-0 items-center justify-center rounded-[3px] border border-solid transition-colors',
                    boxStyle(checked, false),
                  ].join(' ')}
                  aria-hidden
                >
                  {checked ? <IconCheck className="size-2.5 text-white" /> : null}
                </span>
                <span className="min-w-0 flex-1 truncate font-['Inter',sans-serif] text-[13px] font-normal leading-5 text-[#333333]">
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 pr-1 pt-1">
          <button
            type="button"
            onClick={onResetClick}
            className="flex h-8 w-20 items-center justify-center rounded-xl border border-[#d6d6d6] bg-gradient-to-b from-white to-white/60 font-['Poppins',sans-serif] text-xs font-medium text-[#333333] outline-none transition-colors hover:bg-[#fafafa] focus-visible:ring-2 focus-visible:ring-[#b6bec8]"
          >
            Reset
          </button>
          <button
            type="button"
            disabled={draftNoneSelected}
            onClick={onApplyClick}
            className="flex h-8 w-20 items-center justify-center rounded-xl bg-[#333333] font-['Poppins',sans-serif] text-xs font-medium text-white outline-none transition-colors hover:bg-[#1a1a1a] focus-visible:ring-2 focus-visible:ring-[#b6bec8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(menu, document.body);
}
