import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { WidgetCategory, WidgetTemplate } from '../data/widgets';
import { IconAdd, IconCheck, IconClose, IconDrag, IconSearch, IconTrash } from './Icons';

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
  className?: string;
};

function PaletteRow({
  categoryId,
  widget,
  onPick,
  onRemoveFromCanvas,
  isSelected,
  instanceCount,
}: {
  categoryId: string;
  widget: WidgetTemplate;
  onPick?: () => void;
  onRemoveFromCanvas?: () => void;
  isSelected: boolean;
  instanceCount: number;
}) {
  const id = `palette:${categoryId}:${widget.id}`;
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
            : 'cursor-pointer hover:border-[#E20074] hover:bg-[#fafafa]'
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
              "min-w-0 flex-1 break-words font-['Poppins',sans-serif] text-sm uppercase leading-snug tracking-wide text-pretty line-clamp-2",
              isSelected ? 'text-[#1e1e1f]' : 'text-black/70',
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
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#1e1e1f] outline-none transition-colors hover:bg-black/10 focus-visible:ring-2 focus-visible:ring-[#b6bec8]"
                  aria-label={`Remove ${widget.label} from canvas`}
                >
                  <IconTrash className="size-[18px]" />
                </button>
              ) : null}
            </span>
          ) : (
            <IconAdd className="size-[18px] shrink-0 text-[#1e1e1f] transition-colors group-hover:text-[#E20074]" aria-hidden />
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
      widgets: cat.widgets.filter(
        (w) => w.label.toLowerCase().includes(q) || cat.title.toLowerCase().includes(q)
      ),
    }))
    .filter((cat) => cat.widgets.length > 0);
}

function WidgetPickerBody({
  open,
  categories,
  onClose,
  onPickWidget,
  onRemoveFromCanvas,
  selectedTemplateIds,
  templateInstanceCounts,
}: {
  open: boolean;
  categories: WidgetCategory[];
  onClose: () => void;
  onPickWidget?: (widget: WidgetTemplate) => void;
  onRemoveFromCanvas?: (widget: WidgetTemplate) => void;
  selectedTemplateIds: ReadonlySet<string>;
  templateInstanceCounts: ReadonlyMap<string, number>;
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const filteredCategories = useMemo(() => filterCategoriesByQuery(categories, query), [categories, query]);
  const trimmed = query.trim();
  const emptySearch = trimmed.length > 0 && filteredCategories.length === 0;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="flex shrink-0 flex-col gap-3.5 overflow-visible">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-['Poppins',sans-serif] text-lg font-semibold leading-snug text-[#1e1e1f] sm:text-xl sm:leading-6">
              Select a Widget
            </h2>
            <p className="mt-1 font-['Inter',sans-serif] text-xs text-[#707070]">
              Tap to add or drag into a section
            </p>
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
            placeholder="Search widgets"
            autoComplete="off"
            aria-label="Search widgets"
            className="h-12 w-full rounded-xl border border-[#d7d7d7] bg-white py-0 pl-10 pr-3 font-['Inter',sans-serif] text-sm text-[#1e1e1f] outline-none ring-[#b6bec8] placeholder:text-[#707070] transition-[background-color,border-color,box-shadow] duration-150 hover:border-[#8a8a8a] hover:bg-white hover:shadow-[var(--shadow-focus)] focus:border-[#6b7b8c] focus:shadow-none focus:ring-2 focus:ring-[#b6bec8] focus-visible:border-[#6b7b8c] focus-visible:shadow-none focus-visible:ring-2 focus-visible:ring-[#b6bec8] sm:pl-11"
          />
        </div>
      </div>

      <div className="mt-3.5 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overflow-x-hidden pr-1">
        {emptySearch ? (
          <p className="pt-2 font-['Inter',sans-serif] text-sm text-[#707070]">No widgets match your search.</p>
        ) : (
          filteredCategories.map((cat) => (
            <section key={cat.id} className="rounded-2xl pt-4">
              <h3 className="mb-2 font-['Poppins',sans-serif] text-base font-semibold text-black">
                {cat.title}{' '}
                <span className="font-normal text-[#707070]">({cat.widgets.length})</span>
              </h3>
              <div className="flex flex-col gap-1">
                {cat.widgets.map((w) => (
                  <PaletteRow
                    key={`${cat.id}-${w.id}`}
                    categoryId={cat.id}
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
   * Panel width `--widget-panel-width` (380px max). Vertical `inset-y` matches viewport (page) height minus gutters.
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
          />
        </div>
      </aside>
    </div>
  );

  return createPortal(layer, document.body);
}
