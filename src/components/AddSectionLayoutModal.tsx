import { useEffect, useState } from 'react';
import type { SectionLayoutPreset } from '../types';
import { IconClose } from './Icons';
import { PrimaryButton } from './PrimaryButton';

type AddSectionLayoutModalProps = {
  open: boolean;
  onClose: () => void;
  /** Called when the user confirms the highlighted layout. */
  onConfirmLayout: (layout: SectionLayoutPreset) => void;
};

const BAR = 'h-10 rounded-[10px] bg-[#e2e4e5]';

const LAYOUT_OPTIONS: { id: SectionLayoutPreset; label: string }[] = [
  { id: 'full', label: 'Full width layout' },
  { id: 'sidebar-left', label: 'Sidebar left layout' },
  { id: 'sidebar-right', label: 'Sidebar right layout' },
  { id: 'three-column', label: 'Three column layout' },
];

/** Matches Figma [Actions / Select Layout](https://www.figma.com/design/aeQeZHeULUG3dyZQaU1S9y/Neuron-2.0?node-id=5670-95642). */
export function AddSectionLayoutModal({ open, onClose, onConfirmLayout }: AddSectionLayoutModalProps) {
  const [selected, setSelected] = useState<SectionLayoutPreset>('full');

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

  return (
    <div
      className="fixed inset-0 z-[72] flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-section-layout-title"
        className="relative z-10 w-full max-w-[280px] rounded-xl bg-white p-5 shadow-[0_4px_4px_rgba(0,0,0,0.1)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <p
            id="add-section-layout-title"
            className="font-['Inter',sans-serif] text-sm font-semibold text-black"
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
          role="radiogroup"
          aria-labelledby="add-section-layout-title"
        >
          {LAYOUT_OPTIONS.map(({ id, label }) => {
            const isSelected = selected === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(id)}
                className={`w-full rounded-[10px] p-1 text-left outline-none transition-[box-shadow,opacity] hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#b6bec8] ${
                  isSelected ? 'ring-2 ring-[#e20074] ring-offset-2 ring-offset-white' : 'ring-0 ring-offset-0'
                }`}
                aria-label={label}
              >
                {id === 'full' ? (
                  <div className={`w-full ${BAR}`} />
                ) : null}
                {id === 'sidebar-left' ? (
                  <div className="flex w-full gap-1.5">
                    <div className={`w-[70px] shrink-0 ${BAR}`} />
                    <div className={`min-w-0 flex-1 ${BAR}`} />
                  </div>
                ) : null}
                {id === 'sidebar-right' ? (
                  <div className="flex w-full gap-1.5">
                    <div className={`min-w-0 flex-1 ${BAR}`} />
                    <div className={`w-[70px] shrink-0 ${BAR}`} />
                  </div>
                ) : null}
                {id === 'three-column' ? (
                  <div className="flex w-full gap-1.5">
                    <div className={`w-[70px] shrink-0 ${BAR}`} />
                    <div className={`w-[70px] shrink-0 ${BAR}`} />
                    <div className={`min-w-0 flex-1 ${BAR}`} />
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <PrimaryButton
            type="button"
            className="w-full"
            onClick={() => {
              onConfirmLayout(selected);
            }}
          >
            Add section
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
