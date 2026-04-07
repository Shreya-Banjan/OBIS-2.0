import { useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { WidgetCategory, WidgetTemplate } from '../data/widgets';
import { IconAdd, IconClose, IconDrag, IconChevronDown } from './Icons';

type WidgetPickerPanelProps = {
  categories: WidgetCategory[];
  open: boolean;
  onClose: () => void;
  /** Tap the row (or +) to add this widget to the canvas. */
  onPickWidget?: (widget: WidgetTemplate) => void;
  className?: string;
  /** Centered dialog when filling a layout slot; right drawer otherwise. */
  variant?: 'drawer' | 'modal';
};

function PaletteRow({
  categoryId,
  widget,
  onPick,
}: {
  categoryId: string;
  widget: WidgetTemplate;
  onPick?: () => void;
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
      className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-[#d7d7d7] bg-white px-2 py-3.5"
    >
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <button
          type="button"
          className="cursor-grab shrink-0 touch-none text-[#1e1e1f]/40 active:cursor-grabbing"
          {...listeners}
          {...attributes}
          aria-label={`Drag ${widget.label}`}
        >
          <IconDrag className="size-[18px]" />
        </button>
        <button
          type="button"
          disabled={!onPick}
          onClick={() => onPick?.()}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-0.5 text-left outline-none transition-colors hover:bg-[#f5f5f5] disabled:pointer-events-none disabled:opacity-100"
          aria-label={`Add ${widget.label} to report`}
        >
          <span className="min-w-0 truncate font-['Poppins',sans-serif] text-sm leading-[14px] text-black/70">
            {widget.label}
          </span>
          <IconAdd className="size-[18px] shrink-0 text-[#1e1e1f]" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function WidgetPickerBody({
  categories,
  onClose,
  onPickWidget,
  closeLabel,
}: {
  categories: WidgetCategory[];
  onClose: () => void;
  onPickWidget?: (widget: WidgetTemplate) => void;
  closeLabel: string;
}) {
  return (
    <>
      <div className="flex flex-col gap-3.5 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-['Poppins',sans-serif] text-lg font-semibold leading-snug text-[#1e1e1f] sm:text-xl sm:leading-6">
              Select a Widget
            </h2>
            <p className="mt-1 font-['Inter',sans-serif] text-xs text-[#707070]">
              Tap a widget to add it, or drag into a section
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-[#1e1e1f] hover:bg-[#f0f0f0]"
            aria-label={closeLabel}
          >
            <IconClose className="size-6" />
          </button>
        </div>

        <button
          type="button"
          className="flex h-12 w-full cursor-default items-center justify-between rounded-xl border border-[#d7d7d7] bg-white px-3 text-left font-['Poppins',sans-serif] text-sm font-semibold text-[#333] sm:px-4 sm:text-base"
        >
          All Widgets
          <span className="inline-flex rotate-180">
            <IconChevronDown className="size-6 text-[#333]" />
          </span>
        </button>
      </div>

      <div className="mt-3.5 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
        {categories.map((cat) => (
          <section key={cat.id} className="rounded-2xl pt-4">
            <h3 className="mb-2 font-['Poppins',sans-serif] text-base font-semibold text-black">{cat.title}</h3>
            <div className="flex flex-col gap-1">
              {cat.widgets.map((w) => (
                <PaletteRow
                  key={`${cat.id}-${w.id}`}
                  categoryId={cat.id}
                  widget={w}
                  onPick={onPickWidget ? () => onPickWidget(w) : undefined}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

export function WidgetPickerPanel({
  categories,
  open,
  onClose,
  onPickWidget,
  className = '',
  variant = 'drawer',
}: WidgetPickerPanelProps) {
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

  const closeLabel = variant === 'modal' ? 'Close dialog' : 'Close panel';

  return (
    <div
      className={`fixed inset-0 z-[66] ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        role="presentation"
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {variant === 'drawer' ? (
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Select a Widget"
          className={[
            'fixed right-0 top-0 z-[67] flex h-dvh w-full max-w-[min(100vw,22.5rem)] flex-col bg-white shadow-[var(--shadow-panel)]',
            'rounded-l-2xl p-5 sm:rounded-l-[30px] sm:p-10',
            'transition-transform duration-300 ease-out',
            open ? 'translate-x-0' : 'translate-x-full',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <WidgetPickerBody
            categories={categories}
            onClose={onClose}
            onPickWidget={onPickWidget}
            closeLabel={closeLabel}
          />
        </aside>
      ) : (
        <div className="pointer-events-none fixed inset-0 z-[67] flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Select a Widget"
            className={[
              'pointer-events-auto flex max-h-[min(85dvh,40rem)] w-full max-w-lg flex-col rounded-2xl bg-white p-5 shadow-[var(--shadow-panel)] sm:p-8',
              'transition-all duration-300 ease-out',
              open
                ? 'translate-y-0 scale-100 opacity-100'
                : 'pointer-events-none translate-y-2 scale-95 opacity-0',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <WidgetPickerBody
              categories={categories}
              onClose={onClose}
              onPickWidget={onPickWidget}
              closeLabel={closeLabel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
