import type { ReactNode } from 'react';

export type ToggleSegment<T extends string> = {
  value: T;
  /** Accessible name for this option (tooltip / SR). */
  label: string;
  icon: ReactNode;
};

const toggleSizeStyles = {
  large: {
    root: 'h-11 w-20 rounded-xl p-1',
    row: 'h-9',
    pill: 'rounded-[10px]',
    segment: 'rounded-[10px]',
    iconWrap: 'size-[18px] [&_svg]:size-[18px]',
  },
  medium: {
    root: 'h-9 w-16 rounded-lg p-1',
    row: 'h-7',
    pill: 'rounded-md',
    segment: 'rounded-md',
    iconWrap: 'size-3.5 [&_svg]:size-3.5',
  },
  small: {
    root: 'h-[30px] w-[52px] rounded-md p-1',
    row: 'h-[22px]',
    pill: 'rounded-[5px]',
    segment: 'rounded-[5px]',
    iconWrap: 'size-2.5 [&_svg]:size-2.5',
  },
} as const;

export type ToggleGroupSize = keyof typeof toggleSizeStyles;

export type ToggleGroupProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  /** Exactly two segments — layout matches Neuron 2.0 icon toggle. */
  segments: readonly [ToggleSegment<T>, ToggleSegment<T>];
  'aria-label': string;
  /** Default `medium`: inner track matches 28×56 Figma frame (outer includes 4px padding). */
  size?: ToggleGroupSize;
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
  size = 'medium',
  className,
}: ToggleGroupProps<T>) {
  const [a, b] = segments;
  const secondSelected = value === b.value;
  const sz = toggleSizeStyles[size];

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={[
        'inline-flex shrink-0 items-center border border-solid border-[#DFDFDF] bg-white',
        sz.root,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={['relative flex w-full min-w-0', sz.row].join(' ')}>
        <div
          aria-hidden
          className={[
            'pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-black',
            sz.pill,
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
                'relative z-10 flex min-h-0 flex-1 basis-0 items-center justify-center bg-transparent outline-none',
                sz.segment,
                'transition-colors duration-300 ease-[cubic-bezier(0.34,1.02,0.64,1)]',
                'motion-reduce:transition-none motion-reduce:duration-0',
                selected
                  ? 'text-white hover:bg-white/10'
                  : 'text-black hover:bg-black/[0.06]',
                'focus-visible:shadow-[var(--shadow-focus)]',
              ].join(' ')}
            >
              <span
                className={[
                  'pointer-events-none flex items-center justify-center',
                  sz.iconWrap,
                ].join(' ')}
              >
                {seg.icon}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
