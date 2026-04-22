import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { SectionLayoutPreset } from '../types';
import { IconClose } from './Icons';

type AddSectionLayoutModalProps = {
  open: boolean;
  onClose: () => void;
  /** Called when the user picks a layout; parent should add the section and close the modal. */
  onConfirmLayout: (layout: SectionLayoutPreset) => void;
};

const BAR = 'h-10 rounded-[10px] bg-[#e2e4e5]';

const LAYOUT_OPTIONS: {
  id: 'three-column' | 'three-column-right' | 'three-column-middle' | 'four-small';
  label: string;
}[] = [
  { id: 'three-column', label: 'Three column layout' },
  { id: 'three-column-right', label: 'Three column layout — pair on right' },
  { id: 'three-column-middle', label: 'Three column layout — large in center' },
  { id: 'four-small', label: 'Four equal widgets' },
];

/** Matches Figma [Actions / Select Layout](https://www.figma.com/design/aeQeZHeULUG3dyZQaU1S9y/Neuron-2.0?node-id=5670-95642). */
export function AddSectionLayoutModal({ open, onClose, onConfirmLayout }: AddSectionLayoutModalProps) {
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

  if (!open) return null;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-[var(--color-ink)]/45" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-section-layout-title"
        className="relative z-10 w-full max-w-[280px] rounded-xl bg-white p-5 shadow-[var(--shadow-panel)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <p
            id="add-section-layout-title"
            className="font-['Inter',sans-serif] text-sm font-semibold text-[var(--color-grey-darkest)]"
          >
            Select Layout
          </p>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 -mt-0.5 shrink-0 rounded-lg p-1 text-[#1e1e1f] hover:bg-[#f0f0f0]"
            aria-label="Close"
          >
            <IconClose className="size-5" />
          </button>
        </div>

        <div
          className="flex flex-col gap-2"
          role="group"
          aria-labelledby="add-section-layout-title"
        >
          {LAYOUT_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onConfirmLayout(id)}
              className="w-full rounded-[10px] p-1 text-left outline-none transition-[box-shadow,opacity] hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#b6bec8]"
              aria-label={label}
            >
              <div className="flex w-full gap-1.5">
                {id === 'three-column' ? (
                  <>
                    <div className="flex min-w-0 flex-1 gap-1.5">
                      <div className={`min-w-0 flex-1 ${BAR}`} />
                      <div className={`min-w-0 flex-1 ${BAR}`} />
                    </div>
                    <div className={`min-w-0 flex-1 ${BAR}`} />
                  </>
                ) : id === 'three-column-right' ? (
                  <>
                    <div className={`min-w-0 flex-1 ${BAR}`} />
                    <div className="flex min-w-0 flex-1 gap-1.5">
                      <div className={`min-w-0 flex-1 ${BAR}`} />
                      <div className={`min-w-0 flex-1 ${BAR}`} />
                    </div>
                  </>
                ) : id === 'three-column-middle' ? (
                  <>
                    <div className={`min-w-0 flex-[1_1_0%] ${BAR}`} />
                    <div className={`min-w-0 flex-[2_1_0%] ${BAR}`} />
                    <div className={`min-w-0 flex-[1_1_0%] ${BAR}`} />
                  </>
                ) : (
                  <>
                    <div className={`min-w-0 flex-1 ${BAR}`} />
                    <div className={`min-w-0 flex-1 ${BAR}`} />
                    <div className={`min-w-0 flex-1 ${BAR}`} />
                    <div className={`min-w-0 flex-1 ${BAR}`} />
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
