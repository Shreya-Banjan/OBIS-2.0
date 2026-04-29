import type { RefObject } from 'react';
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HEADER_SPECIALITY_ALL_LABEL, HEADER_SPECIALITY_PLACEHOLDER } from '../data/headerSelectOptions';
import { QUALITY_NSQIP_SPECIALTIES } from '../data/widgets';
import { IconCheck, IconChevronDown, IconSearch } from './Icons';

const ALL_SPECIALTY_IDS = QUALITY_NSQIP_SPECIALTIES.map((s) => s.id);
const ALL_COUNT = ALL_SPECIALTY_IDS.length;

/** Match `PartnerScopeMenu` width and stacking. */
const SPECIALITY_MENU_MIN_WIDTH_PX = 280;
const SPECIALITY_MENU_VIEWPORT_MARGIN_PX = 16;

function sortSpecialtyIdsInCatalogOrder(ids: ReadonlySet<string>): string[] {
  return QUALITY_NSQIP_SPECIALTIES.filter((s) => ids.has(s.id)).map((s) => s.id);
}

function boxStyle(checked: boolean, indeterminate: boolean) {
  if (indeterminate || checked) {
    return 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white';
  }
  return 'border-[#d6d6d6] bg-white text-transparent';
}

function summarizeSelection(ids: readonly string[]): string {
  const orderedLabels = QUALITY_NSQIP_SPECIALTIES.filter((s) => ids.includes(s.id)).map((s) => s.label);
  if (orderedLabels.length === 0) return '';
  if (orderedLabels.length === ALL_COUNT) return HEADER_SPECIALITY_ALL_LABEL;
  if (orderedLabels.length === 1) return orderedLabels[0]!;
  if (orderedLabels.length === 2) return orderedLabels.join(', ');
  const first = orderedLabels[0]!;
  const extra = orderedLabels.length - 1;
  return `${first} +${extra}`;
}

type Layout = 'default' | 'toolbar';

type SelectionMode = 'single' | 'multi';

type SpecialityMenuProps = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  appliedIds: ReadonlySet<string>;
  onApply: (next: Set<string>) => void;
  selectionMode: SelectionMode;
};

function SpecialityMenu({
  open,
  anchorRef,
  onClose,
  appliedIds,
  onApply,
  selectionMode,
}: SpecialityMenuProps) {
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
    const vw = typeof window !== 'undefined' ? window.innerWidth : r.width;
    const maxW = Math.max(0, vw - SPECIALITY_MENU_VIEWPORT_MARGIN_PX * 2);
    const menuWidth = Math.min(maxW, Math.max(r.width, SPECIALITY_MENU_MIN_WIDTH_PX));
    const anchorCenterX = r.left + r.width / 2;
    const minLeft = SPECIALITY_MENU_VIEWPORT_MARGIN_PX;
    const maxLeft = vw - SPECIALITY_MENU_VIEWPORT_MARGIN_PX - menuWidth;
    const left = Math.max(minLeft, Math.min(maxLeft, anchorCenterX - menuWidth / 2));
    setFixedRect({ top: r.bottom + 6, left, width: menuWidth });
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
    if (!q) return [...QUALITY_NSQIP_SPECIALTIES];
    return QUALITY_NSQIP_SPECIALTIES.filter((s) => s.label.toLowerCase().includes(q));
  }, [query]);

  const showAllRow = selectionMode === 'multi';
  const draftAllSelected = showAllRow && draft.size === ALL_COUNT;
  const draftNoneSelected = draft.size === 0;
  const allRowIndeterminate = showAllRow && !draftAllSelected && !draftNoneSelected;
  const allRowChecked = draftAllSelected;
  const applyBlockedSingle = selectionMode === 'single' && draft.size !== 1;

  const toggleSpecialty = (id: string) => {
    setDraft((prev) => {
      if (selectionMode === 'single') {
        return new Set(prev.has(id) ? [] : [id]);
      }
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllRow = () => {
    if (!showAllRow) return;
    if (draftAllSelected) setDraft(new Set());
    else setDraft(new Set(ALL_SPECIALTY_IDS));
  };

  const onResetClick = () => {
    if (showAllRow) setDraft(new Set(ALL_SPECIALTY_IDS));
    else setDraft(new Set());
  };

  const onApplyClick = () => {
    if (draftNoneSelected || applyBlockedSingle) return;
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
          {HEADER_SPECIALITY_PLACEHOLDER}
        </p>
      </div>

      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-0">
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

        {showAllRow ? (
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
              {HEADER_SPECIALITY_ALL_LABEL}
            </span>
          </div>
        ) : null}

        <div className="max-h-[220px] min-h-0 overflow-y-auto overflow-x-hidden">
          {filteredSpecialties.length === 0 ? (
            <p className="px-4 py-2 font-['Inter',sans-serif] text-[13px] text-[#707070]">
              No specialties match your search.
            </p>
          ) : (
            filteredSpecialties.map((s) => {
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
            })
          )}
        </div>

        <div className="flex w-full min-w-0 shrink-0 items-center justify-end gap-2 px-1 pt-1 sm:gap-3">
          <button
            type="button"
            onClick={onResetClick}
            className="flex h-8 shrink-0 items-center justify-center rounded-xl px-3 font-['Poppins',sans-serif] text-xs font-medium text-[var(--color-brand-primary)] outline-none transition-colors hover:bg-[rgba(249,108,80,0.10)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/30"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-20 shrink-0 items-center justify-center rounded-xl border border-[#d6d6d6] bg-gradient-to-b from-white to-white/60 font-['Poppins',sans-serif] text-xs font-medium text-[#333333] outline-none transition-colors hover:bg-[#fafafa] focus-visible:ring-2 focus-visible:ring-[#b6bec8]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={draftNoneSelected || applyBlockedSingle}
            onClick={onApplyClick}
            className="flex h-8 w-20 shrink-0 items-center justify-center rounded-xl bg-[#333333] font-['Poppins',sans-serif] text-xs font-medium text-white outline-none transition-colors hover:bg-[#1a1a1a] focus-visible:ring-2 focus-visible:ring-[#b6bec8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(menu, document.body);
}

type SpecialityPickerFieldProps = {
  label: string;
  /** Selected `QUALITY_NSQIP_SPECIALTIES` ids (catalog order preserved in summaries / on apply). */
  selectedSpecialties: readonly string[];
  onSpecialitiesChange: (nextIds: string[]) => void;
  /** Multi-partner: exactly one specialty on apply. */
  selectionMode?: SelectionMode;
  layout?: Layout;
  toolbarPair?: boolean;
  /**
   * Renders the trigger like the L3 header scope chips (h-8, 12px radius); the speciality menu is unchanged.
   */
  scopeChipTrigger?: boolean;
  chipLead?: string;
  chipValue?: string;
};

export function SpecialityPickerField({
  label,
  selectedSpecialties,
  onSpecialitiesChange,
  selectionMode = 'multi',
  layout = 'default',
  toolbarPair = false,
  scopeChipTrigger = false,
  chipLead = 'Specialty',
  chipValue: chipValueProp,
}: SpecialityPickerFieldProps) {
  const labelId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const appliedSet = useMemo(() => new Set(selectedSpecialties), [selectedSpecialties]);
  const hasSelection = selectedSpecialties.length > 0;
  const showSelectedLook = hasSelection;
  const orderedSelection = useMemo(
    () => sortSpecialtyIdsInCatalogOrder(new Set(selectedSpecialties)).map((id) => {
      const row = QUALITY_NSQIP_SPECIALTIES.find((s) => s.id === id);
      return row?.label ?? id;
    }),
    [selectedSpecialties],
  );

  const labelSlotRef = useRef<HTMLDivElement>(null);
  const pairFullMeasureRef = useRef<HTMLSpanElement>(null);
  const [pairOverflowCompact, setPairOverflowCompact] = useState(false);

  useLayoutEffect(() => {
    if (scopeChipTrigger) {
      setPairOverflowCompact(false);
      return;
    }
    if (orderedSelection.length !== 2) {
      setPairOverflowCompact(false);
      return;
    }
    const slot = labelSlotRef.current;
    const full = pairFullMeasureRef.current;
    if (!slot || !full) return;
    const measure = () => {
      setPairOverflowCompact(full.offsetWidth > slot.clientWidth + 0.5);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(slot);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [orderedSelection, showSelectedLook, scopeChipTrigger]);

  const wrapClass = scopeChipTrigger
    ? 'relative w-auto min-w-0 max-w-[min(100%,11rem)] shrink-0'
    : layout === 'toolbar'
      ? toolbarPair
        ? 'relative min-w-0 flex-1 basis-0'
        : 'relative w-auto min-w-0 max-w-[min(100%,16rem)] shrink-0 sm:min-w-[11rem]'
      : 'relative w-full min-w-0 shrink-0 sm:w-auto';

  let triggerSummary = summarizeSelection(selectedSpecialties);
  if (orderedSelection.length === 2 && pairOverflowCompact) {
    triggerSummary = `${orderedSelection[0]} +1`;
  }

  const chipDisplayValue =
    chipValueProp ?? (hasSelection ? triggerSummary : HEADER_SPECIALITY_PLACEHOLDER);

  return (
    <div ref={anchorRef} className={wrapClass}>
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={() => setOpen((o) => !o)}
        style={scopeChipTrigger ? undefined : showSelectedLook ? { color: '#333333', fontWeight: 500 } : undefined}
        className={
          scopeChipTrigger
            ? 'inline-flex h-8 w-full min-w-0 max-w-full cursor-pointer items-center justify-between gap-1 rounded-[12px] border border-solid border-[#e8e8e8] bg-white px-3 py-0 text-left outline-none transition-colors hover:bg-[#fafafa] focus-visible:ring-2 focus-visible:ring-[var(--ring-input-focus)]'
            : [
                "flex h-12 min-h-12 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-xl border border-[#e4e4e4] bg-[#FFF] px-4 py-0 text-left font-['Poppins',sans-serif] text-sm outline-none ring-[var(--color-brand-primary)] transition-[background-color,border-color,box-shadow,color] duration-150 hover:border-[var(--color-brand-primary)] hover:bg-[#FFF] hover:shadow-none hover:ring-2 hover:ring-[var(--ring-input-focus)] focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring-input-focus)] active:border-[var(--color-brand-primary)] active:ring-2 active:ring-[var(--ring-input-focus)] sm:min-w-[11rem]",
                layout === 'toolbar' ? (toolbarPair ? 'w-full min-w-0' : 'w-full min-w-[11rem]') : 'w-full sm:w-auto',
                showSelectedLook ? '' : 'font-normal text-[#999999]',
              ].join(' ')
        }
      >
        {scopeChipTrigger ? (
          <>
            <span className="min-w-0 truncate font-['Inter',sans-serif] text-[10px] leading-[15px] text-[#707070]">
              <span className="text-[#707070]">{chipLead}:</span>{' '}
              <span className="font-medium text-[#333333]">{chipDisplayValue}</span>
            </span>
            <IconChevronDown
              className={`pointer-events-none size-4 shrink-0 text-[#333333]/55 transition-transform duration-150 ${
                open ? 'rotate-180' : ''
              }`}
              aria-hidden
            />
          </>
        ) : (
          <>
            <div ref={labelSlotRef} className="relative min-h-0 min-w-0 flex-1">
              <span className="block min-w-0 truncate font-['Poppins',sans-serif] text-sm">
                {hasSelection ? triggerSummary : HEADER_SPECIALITY_PLACEHOLDER}
              </span>
              {orderedSelection.length === 2 ? (
                <span
                  ref={pairFullMeasureRef}
                  aria-hidden
                  className={[
                    'pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap font-[\'Poppins\',sans-serif] text-sm',
                    showSelectedLook ? 'font-medium' : 'font-normal',
                  ].join(' ')}
                >
                  {orderedSelection.join(', ')}
                </span>
              ) : null}
            </div>
            <IconChevronDown
              className={`pointer-events-none size-5 shrink-0 text-[var(--color-brand-primary)] transition-transform duration-150 ${
                open ? 'rotate-180' : ''
              }`}
              aria-hidden
            />
          </>
        )}
      </button>
      <SpecialityMenu
        open={open}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
        appliedIds={appliedSet}
        selectionMode={selectionMode}
        onApply={(next) => {
          onSpecialitiesChange(sortSpecialtyIdsInCatalogOrder(next));
        }}
      />
    </div>
  );
}
