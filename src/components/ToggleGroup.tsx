import type { ReactNode } from 'react';

export type ToggleSegment<T extends string> = {
  value: T;
  /** Accessible name for this option (tooltip / SR). */
  label: string;
  icon: ReactNode;
};

export type ToggleGroupProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  /** Exactly two segments — layout matches Neuron 2.0 icon toggle. */
  segments: readonly [ToggleSegment<T>, ToggleSegment<T>];
  'aria-label': string;
  className?: string;
};

/**
 * Two-segment icon toggle (pill). Aligned to Neuron 2.0 Figma — Grid/List layout control.
 */
export function ToggleGroup<T extends string>({
  value,
  onValueChange,
  segments,
  'aria-label': ariaLabel,
  className,
}: ToggleGroupProps<T>) {
  const [a, b] = segments;
  const secondSelected = value === b.value;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={[
        'inline-flex h-8 w-[60px] shrink-0 items-center rounded-lg border border-solid border-[#DFDFDF] bg-white p-0.5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="relative flex h-7 w-full min-w-0">
        <div
          aria-hidden
          className={[
            'pointer-events-none absolute inset-y-0 left-0 w-1/2 rounded-md bg-black',
            'transform-gpu transition-transform duration-300 ease-[cubic-bezier(0.34,1.02,0.64,1)] will-change-transform',
            'motion-reduce:transition-none motion-reduce:duration-0',
            secondSelected ? 'translate-x-full' : 'translate-x-0',
          ].join(' ')}
        />
        {[a, b].map((seg) => {
          const selected = value === seg.value;
          return (
            <button
              key={seg.value}
              type="button"
              role="radio"
              aria-checked={selected}
              title={seg.label}
              onClick={() => onValueChange(seg.value)}
              className={[
                'relative z-10 flex min-h-0 flex-1 basis-0 items-center justify-center rounded-md bg-transparent outline-none',
                'transition-colors duration-300 ease-[cubic-bezier(0.34,1.02,0.64,1)]',
                'motion-reduce:transition-none motion-reduce:duration-0',
                selected ? 'text-white' : 'text-black',
                'focus-visible:shadow-[var(--shadow-focus)]',
              ].join(' ')}
            >
              <span className="pointer-events-none flex size-3.5 items-center justify-center [&_svg]:size-3.5">
                {seg.icon}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
