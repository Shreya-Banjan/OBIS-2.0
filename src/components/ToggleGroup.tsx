import type { ReactNode } from 'react';

export type ToggleSegment<T extends string> = {
  value: T;
  /** Accessible name for this option (tooltip / SR). */
  label: string;
  icon: ReactNode;
};

const toggleSizeStyles = {
  large: {
    root: 'h-11 w-20 shrink-0 overflow-hidden rounded-[12px] p-0',
    row: 'relative flex h-full min-h-0 w-full min-w-0',
    pill: 'rounded-[12px]',
    segment: 'rounded-[12px]',
    iconWrap: 'size-5 [&_svg]:size-5',
  },
  medium: {
    root: 'h-8 w-16 shrink-0 overflow-hidden rounded-[12px] p-0',
    row: 'relative flex h-full min-h-0 w-full min-w-0',
    pill: 'rounded-[12px]',
    segment: 'rounded-[12px]',
    iconWrap: 'size-4 [&_svg]:size-4',
  },
  small: {
    root: 'h-[30px] w-[52px] shrink-0 overflow-hidden rounded-[12px] p-0',
    row: 'relative flex h-full min-h-0 w-full min-w-0',
    pill: 'rounded-[12px]',
    segment: 'rounded-[12px]',
    iconWrap: 'size-3 [&_svg]:size-3',
  },
} as const;

export type ToggleGroupSize = keyof typeof toggleSizeStyles;

/**
 * - **`default`** — white field + `#e8e8e8` shell stroke (toolbar / design-system preview).
 * - **`kpiTitle`** — in-card OBIS2.0 KPI header ([Figma `209-1393`](https://www.figma.com/design/2Z3gqwUnoKnsm6U5aQ1Xp2/OBIS2.0?node-id=209-1393&m=dev)): `#f5f5f5` track, `#e8e8e8` stroke; icons **#333333** selected, **#999999** inactive.
 */
export type ToggleGroupVariant = 'default' | 'kpiTitle';

export type ToggleGroupProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  /** Exactly two segments — layout matches OBIS 2.0 icon toggle. */
  segments: readonly [ToggleSegment<T>, ToggleSegment<T>];
  'aria-label': string;
  /** Default `medium`: 32×64 outer frame (`h-8`), 12px corners, no inner gutter (thumb flush to the shell). */
  size?: ToggleGroupSize;
  /** Surface treatment; use `kpiTitle` on L2 KPI title row to match OBIS2.0 card chrome. */
  variant?: ToggleGroupVariant;
  className?: string;
};

/**
 * Two-segment icon toggle (pill). Aligned to OBIS 2.0 Figma — Grid/List layout control.
 */
export function ToggleGroup<T extends string>({
  value,
  onValueChange,
  segments,
  'aria-label': ariaLabel,
  size = 'medium',
  variant = 'default',
  className,
}: ToggleGroupProps<T>) {
  const [a, b] = segments;
  const secondSelected = value === b.value;
  const sz = toggleSizeStyles[size];
  const rootSurface =
    variant === 'kpiTitle' ? 'border-[#e8e8e8] bg-[#f5f5f5]' : 'border-[#e8e8e8] bg-white';
  const unselectedSegment = 'text-[#999999] hover:bg-[rgb(30_30_31/0.06)]';

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={[
        'inline-flex shrink-0 border border-solid',
        rootSurface,
        sz.root,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={sz.row}>
        <div
          aria-hidden
          className={[
            /* Bleed 1px past the shell so the thumb stroke aligns with the outer border — no double line. */
            'pointer-events-none absolute top-[-1px] h-[calc(100%+2px)] bg-white',
            'border border-solid border-[#e8e8e8]',
            sz.pill,
            /* Right segment: +2px width so the thumb meets the inner right edge (50%+1 can leave a 1px gap). */
            secondSelected ? 'left-[calc(50%-1px)] w-[calc(50%+2px)]' : 'left-[-1px] w-[calc(50%+1px)]',
            'transition-[left,width] duration-300 ease-[cubic-bezier(0.34,1.02,0.64,1)] will-change-[left,width]',
            'motion-reduce:transition-none motion-reduce:duration-0',
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
                selected ? 'text-[#333333] hover:bg-[rgb(30_30_31/0.04)]' : unselectedSegment,
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
