import { forwardRef, type ComponentPropsWithoutRef } from 'react';

const filledSecondarySizeClasses = {
  large:
    'h-12 rounded-xl px-4 text-sm tracking-[-0.28px]',
  medium:
    'h-10 rounded-lg px-3.5 text-sm tracking-[-0.28px]',
  small:
    'h-8 rounded-lg px-3 text-xs tracking-[-0.24px]',
} as const;

export type FilledSecondaryButtonProps = ComponentPropsWithoutRef<'button'> & {
  size?: keyof typeof filledSecondarySizeClasses;
};

export const FilledSecondaryButton = forwardRef<HTMLButtonElement, FilledSecondaryButtonProps>(
  function FilledSecondaryButton(
    { className, children, disabled, type = 'button', size = 'large', ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={[
          'inline-flex shrink-0 items-center justify-center whitespace-nowrap',
          filledSecondarySizeClasses[size],
          "font-['Inter',sans-serif] font-medium text-white",
          'border-0 bg-[rgba(69,69,69,0.92)] outline-none transition-[box-shadow,filter] duration-150',
          'hover:shadow-[var(--shadow-focus)] hover:brightness-[0.95]',
          'focus-visible:shadow-[var(--shadow-focus)] focus-visible:brightness-[0.95]',
          'active:brightness-[0.9]',
          'disabled:pointer-events-none disabled:opacity-50',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
