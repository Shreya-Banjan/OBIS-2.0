import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { WidgetCategory, WidgetTemplate } from '../data/widgets';
import { QUALITY_NSQIP_SPECIALTY_IDS } from '../data/widgets';
import { NsqipSpecialtyFilterMenu } from './NsqipSpecialtyFilterMenu';
import { IconAdd, IconCheck, IconChevronDown, IconClose, IconDrag, IconFilter, IconSearch, IconTrash } from './Icons';

export type WidgetPickerSectionOption = { id: string; label: string };

const EMPTY_TEMPLATE_IDS = new Set<string>();

type WidgetPickerPanelProps = {
  categories: WidgetCategory[];
  open: boolean;
  onClose: () => void;
  /** Tap the row (or +) to add this widget to the canvas. */
  onPickWidget?: (widget: WidgetTemplate) => void;
  /** Remove all canvas instances of this template (selected rows). */
  onRemoveFromCanvas?: (widget: WidgetTemplate) => void;
  /** Template IDs already placed on the canvas (non-placeholder). */
  selectedTemplateIds?: ReadonlySet<string>;
  /** Instance count per template id on the canvas. */
  templateInstanceCounts?: ReadonlyMap<string, number>;
  /** Canvas sections — drives the “add to section” control. */
  sectionOptions?: readonly WidgetPickerSectionOption[];
  /** `null` = last section (same as insert when target missing). */
  targetSectionId?: string | null;
  onTargetSectionChange?: (sectionId: string | null) => void;
  className?: string;
};

function PaletteRow({
  categoryId,
  subgroupId,
  widget,
  onPick,
  onRemoveFromCanvas,
  isSelected,
  instanceCount,
}: {
  categoryId: string;
  subgroupId: string;
  widget: WidgetTemplate;
  onPick?: () => void;
  onRemoveFromCanvas?: () => void;
  isSelected: boolean;
  instanceCount: number;
}) {
  const id = `palette:${categoryId}:${subgroupId}:${widget.id}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: {
      source: 'palette' as const,
      widget,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onPick?.()}
      className={[
        'group flex min-h-[52px] w-full min-w-0 shrink-0 items-center gap-2 rounded-xl border-[1.5px] border-solid px-2 py-0 text-left transition-colors',
        isSelected ? 'border-transparent bg-[#D7D7D7]' : 'border-[#d7d7d7] bg-white',
        onPick
          ? isSelected
            ? 'cursor-pointer hover:bg-[#cacaca]'
            : 'cursor-pointer hover:border-[var(--color-brand-primary)] hover:bg-[#fafafa]'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <button
          type="button"
          className={[
            'cursor-grab shrink-0 touch-none active:cursor-grabbing',
            isSelected ? 'text-[#1e1e1f]/50' : 'text-[#1e1e1f]/40',
          ].join(' ')}
          aria-label={`Drag ${widget.label}`}
          {...listeners}
          {...attributes}
          onClick={(e) => e.stopPropagation()}
        >
          <IconDrag className="size-[18px]" />
        </button>
        <div className="flex min-w-0 min-h-0 flex-1 items-center justify-between gap-2">
          <span
            className={[
              "min-w-0 flex-1 break-words font-['Poppins',sans-serif] text-sm font-normal leading-snug text-pretty line-clamp-2",
              isSelected ? 'text-[#1e1e1f]' : 'text-[var(--color-grey-darkest)]/70',
            ].join(' ')}
          >
            {widget.label}
            {instanceCount > 0 ? (
              <span className="ml-1.5 font-['Inter',sans-serif] text-[11px] font-semibold normal-case tracking-normal text-[#707070]">
                ({instanceCount})
              </span>
            ) : null}
          </span>
          {isSelected ? (
            <span className="flex shrink-0 items-center gap-0.5">
              <span className="flex size-8 items-center justify-center text-[#1e1e1f]" aria-hidden>
                <IconCheck className="size-[18px]" />
              </span>
              {onRemoveFromCanvas ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFromCanvas();
                  }}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#1e1e1f] outline-none transition-colors hover:bg-[var(--color-grey-darkest)]/10 focus-visible:ring-2 focus-visible:ring-[#b6bec8]"
                  aria-label={`Remove ${widget.label} from canvas`}
                >
                  <IconTrash className="size-[18px]" />
                </button>
              ) : null}
            </span>
          ) : (
            <IconAdd className="size-[18px] shrink-0 text-[#1e1e1f] transition-colors group-hover:text-[var(--color-brand-primary)]" aria-hidden />
          )}
        </div>
      </div>
    </div>
  );
}

function filterCategoriesByQuery(categories: WidgetCategory[], rawQuery: string): WidgetCategory[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return categories;
  return categories
    .map((cat) => ({
      ...cat,
      subgroups: cat.subgroups
        .map((sg) => ({
          ...sg,
          widgets: sg.widgets.filter(
            (w) =>
              w.label.toLowerCase().includes(q) ||
              sg.title.toLowerCase().includes(q) ||
              cat.title.toLowerCase().includes(q)
          ),
        }))
        .filter((sg) => sg.widgets.length > 0),
    }))
    .filter((cat) => cat.subgroups.length > 0);
}

const AUTO_SECTION_VALUE = '__auto__';

function WidgetPickerBody({
  open,
  categories,
  onClose,
  onPickWidget,
  onRemoveFromCanvas,
  selectedTemplateIds,
  templateInstanceCounts,
  sectionOptions,
  targetSectionId,
  onTargetSectionChange,
}: {
  open: boolean;
  categories: WidgetCategory[];
  onClose: () => void;
  onPickWidget?: (widget: WidgetTemplate) => void;
  onRemoveFromCanvas?: (widget: WidgetTemplate) => void;
  selectedTemplateIds: ReadonlySet<string>;
  templateInstanceCounts: ReadonlyMap<string, number>;
  sectionOptions?: readonly WidgetPickerSectionOption[];
  targetSectionId?: string | null;
  onTargetSectionChange?: (sectionId: string | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [qualityNsqipSpecialties, setQualityNsqipSpecialties] = useState<Set<string>>(
    () => new Set(QUALITY_NSQIP_SPECIALTY_IDS)
  );
  const [qualityNsqipFilterOpen, setQualityNsqipFilterOpen] = useState(false);
  const qualityNsqipFilterAnchorRef = useRef<HTMLDivElement>(null);
  const sectionSelectId = useId();

  useEffect(() => {
    if (open) {
      setQuery('');
      setQualityNsqipFilterOpen(false);
    }
  }, [open]);

  const hasSectionPicker = onTargetSectionChange != null;

  const sectionSelectValue = useMemo(() => {
    const opts = sectionOptions ?? [];
    if (!opts.length) return AUTO_SECTION_VALUE;
    if (targetSectionId && opts.some((o) => o.id === targetSectionId)) return targetSectionId;
    return AUTO_SECTION_VALUE;
  }, [sectionOptions, targetSectionId]);

  const filteredCategories = useMemo(() => filterCategoriesByQuery(categories, query), [categories, query]);
  const trimmed = query.trim();
  const emptySearch = trimmed.length > 0 && filteredCategories.length === 0;

  const qualityNsqipFilterActive = useMemo(() => {
    if (qualityNsqipSpecialties.size !== QUALITY_NSQIP_SPECIALTY_IDS.length) return true;
    return QUALITY_NSQIP_SPECIALTY_IDS.some((id) => !qualityNsqipSpecialties.has(id));
  }, [qualityNsqipSpecialties]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-3">
      <div className="flex shrink-0 flex-col gap-3.5 overflow-visible">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-['Poppins',sans-serif] text-lg font-semibold leading-snug text-[#1e1e1f] sm:text-xl sm:leading-6">
              Select a Widget
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-[#1e1e1f] hover:bg-[#f0f0f0]"
            aria-label="Close widget picker"
          >
            <IconClose className="size-6" />
          </button>
        </div>

        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#707070] sm:left-4" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            autoComplete="off"
            aria-label="Search widgets"
            className="h-12 w-full rounded-xl border border-[#d7d7d7] bg-white py-0 pl-10 pr-3 font-['Inter',sans-serif] text-sm text-[#1e1e1f] outline-none ring-[var(--color-brand-primary)] placeholder:text-[#707070] transition-[background-color,border-color,box-shadow] duration-150 hover:border-[var(--color-brand-primary)] hover:bg-white hover:ring-2 hover:ring-[var(--ring-input-focus)] focus:border-[var(--color-brand-primary)] focus:shadow-none focus:ring-2 focus:ring-[var(--ring-input-focus)] focus-visible:border-[var(--color-brand-primary)] focus-visible:shadow-none focus-visible:ring-2 focus-visible:ring-[var(--ring-input-focus)] active:border-[var(--color-brand-primary)] active:ring-2 active:ring-[var(--ring-input-focus)] sm:pl-11"
          />
        </div>

        {hasSectionPicker ? (
          <div className="w-full min-w-0">
            <label
              htmlFor={sectionSelectId}
              className="mb-1.5 block font-['Inter',sans-serif] text-xs font-medium text-[#1e1e1f]"
            >
              Section
            </label>
            <div className="relative">
              <select
                id={sectionSelectId}
                value={sectionSelectValue}
                disabled={(sectionOptions ?? []).length === 0}
                onChange={(e) => {
                  const v = e.target.value;
                  onTargetSectionChange?.(v === AUTO_SECTION_VALUE ? null : v);
                }}
                className="h-12 w-full min-w-0 appearance-none rounded-xl border border-[#d7d7d7] bg-white py-0 pl-4 pr-10 font-['Poppins',sans-serif] text-sm font-normal text-[#1e1e1f] outline-none ring-[var(--color-brand-primary)] transition-[background-color,border-color,box-shadow] duration-150 hover:border-[var(--color-brand-primary)] hover:ring-2 hover:ring-[var(--ring-input-focus)] focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring-input-focus)] disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:text-[#707070]"
              >
                <option value={AUTO_SECTION_VALUE}>Last section (auto)</option>
                {(sectionOptions ?? []).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <IconChevronDown
                className="pointer-events-none absolute right-3 top-1/2 size-7 -translate-y-1/2 text-[#999999]"
                aria-hidden
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3.5 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overflow-x-hidden pr-1">
        {emptySearch ? (
          <p className="pt-2 font-['Inter',sans-serif] text-sm text-[#707070]">No widgets match your search.</p>
        ) : (
          filteredCategories.map((cat) => (
            <section key={cat.id} className="rounded-2xl pt-2 first:pt-0">
              <h3 className="mb-2 pb-1 font-['Poppins',sans-serif] text-base font-semibold leading-normal text-[var(--color-grey-darkest)]">
                {cat.title}
              </h3>
              <div className="flex flex-col gap-5">
                {cat.subgroups.map((sg) => (
                  <div key={`${cat.id}-${sg.id}`} className="flex flex-col gap-2">
                    <div
                      ref={cat.id === 'quality' && sg.id === 'nsqip' ? qualityNsqipFilterAnchorRef : undefined}
                      className="flex min-h-8 min-w-0 items-center justify-between gap-2"
                    >
                      <h4 className="min-w-0 flex-1 truncate font-['Poppins',sans-serif] text-[13px] font-semibold leading-normal text-[var(--color-grey-darkest)]">
                        {sg.title}
                      </h4>
                      {cat.id === 'quality' && sg.id === 'nsqip' ? (
                        <>
                          <button
                            type="button"
                            aria-haspopup="dialog"
                            aria-expanded={qualityNsqipFilterOpen}
                            aria-label={
                              qualityNsqipFilterActive
                                ? 'Filter NSQIP by speciality, filter active'
                                : 'Filter NSQIP by speciality'
                            }
                            onClick={() => setQualityNsqipFilterOpen((v) => !v)}
                            className={[
                              'relative flex size-8 shrink-0 items-center justify-center rounded-lg text-[#333333] outline-none transition-colors hover:bg-[#f3f3f3] focus-visible:ring-2 focus-visible:ring-[#b6bec8]',
                              qualityNsqipFilterOpen ? 'bg-[#ececec]' : '',
                            ].join(' ')}
                          >
                            <IconFilter
                              className={[
                                'size-6 transition-colors',
                                qualityNsqipFilterOpen
                                  ? 'text-[var(--color-brand-primary)]'
                                  : 'text-[#707070]',
                              ].join(' ')}
                            />
                            {qualityNsqipFilterActive ? (
                              <span
                                className="pointer-events-none absolute left-0.5 top-1.5 size-1.5 rounded-full bg-[var(--color-brand-primary)] ring-[1.5px] ring-white"
                                title="Speciality filter active"
                                aria-hidden
                              />
                            ) : null}
                          </button>
                          <NsqipSpecialtyFilterMenu
                            open={qualityNsqipFilterOpen}
                            anchorRef={qualityNsqipFilterAnchorRef}
                            onClose={() => setQualityNsqipFilterOpen(false)}
                            appliedIds={qualityNsqipSpecialties}
                            onApply={setQualityNsqipSpecialties}
                          />
                        </>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-1">
                      {(cat.id === 'quality' && sg.id === 'nsqip'
                        ? sg.widgets.filter((w) => {
                            const keys = w.nsqipSpecialties;
                            if (!keys?.length) return true;
                            return keys.some((id) => qualityNsqipSpecialties.has(id));
                          })
                        : sg.widgets
                      ).map((w) => (
                        <div key={`${cat.id}-${sg.id}-${w.id}`} className="min-h-[52px] w-full min-w-0">
                          <PaletteRow
                            categoryId={cat.id}
                            subgroupId={sg.id}
                            widget={w}
                            isSelected={selectedTemplateIds.has(w.id)}
                            instanceCount={templateInstanceCounts.get(w.id) ?? 0}
                            onPick={onPickWidget ? () => onPickWidget(w) : undefined}
                            onRemoveFromCanvas={
                              onRemoveFromCanvas && selectedTemplateIds.has(w.id)
                                ? () => onRemoveFromCanvas(w)
                                : undefined
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

const EMPTY_INSTANCE_COUNTS = new Map<string, number>();

export function WidgetPickerPanel({
  categories,
  open,
  onClose,
  onPickWidget,
  onRemoveFromCanvas,
  selectedTemplateIds = EMPTY_TEMPLATE_IDS,
  templateInstanceCounts = EMPTY_INSTANCE_COUNTS,
  sectionOptions,
  targetSectionId = null,
  onTargetSectionChange,
  className = '',
}: WidgetPickerPanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  /**
   * Portaled overlay: backdrop + right panel slide (`translate-x`). Stays mounted for enter/exit motion.
   * Panel width `--widget-panel-width` (280px max on mobile, 380px from `sm` up). Vertical insets match viewport minus gutters.
   */
  if (typeof document === 'undefined') {
    return null;
  }

  /**
   * Outer uses `pointer-events-none` while open so clicks reach the canvas (e.g. pick another empty slot).
   * Only the aside uses `pointer-events-auto`. Close via header button or Escape — not a full-screen blocker.
   */
  const layer = (
    <div
      className={['fixed inset-0 z-[88]', 'pointer-events-none'].join(' ')}
      aria-hidden={!open}
    >
      <div
        aria-hidden
        className={[
          'pointer-events-none absolute inset-0 bg-transparent transition-opacity duration-300 ease-out',
          open ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      />
      <aside
        role="dialog"
        aria-modal={open}
        aria-label="Select a Widget"
        className={[
          'pointer-events-auto absolute right-3 top-3 bottom-3 z-[1] flex min-h-0 w-[var(--widget-panel-width)] flex-col overflow-hidden rounded-2xl border border-[#d9d9d9] bg-white shadow-[var(--shadow-panel)] transition-transform duration-300 ease-out sm:right-4 sm:top-4 sm:bottom-4',
          open ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-5 sm:p-8 sm:pl-10">
          <WidgetPickerBody
            open={open}
            categories={categories}
            onClose={onClose}
            onPickWidget={onPickWidget}
            onRemoveFromCanvas={onRemoveFromCanvas}
            selectedTemplateIds={selectedTemplateIds}
            templateInstanceCounts={templateInstanceCounts}
            sectionOptions={sectionOptions}
            targetSectionId={targetSectionId}
            onTargetSectionChange={onTargetSectionChange}
          />
        </div>
      </aside>
    </div>
  );

  return createPortal(layer, document.body);
}
