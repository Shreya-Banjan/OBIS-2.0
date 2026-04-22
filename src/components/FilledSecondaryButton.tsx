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
          'border-0 bg-[var(--color-cta-primary)] outline-none transition-[box-shadow,filter,scale,background-color] duration-200 ease-out',
          'hover:shadow-[var(--shadow-focus-cta)] hover:brightness-[1.06]',
          'focus-visible:shadow-[var(--shadow-focus-cta)] focus-visible:brightness-[1.06]',
          'active:scale-[0.97] active:bg-[var(--color-brand-primary)] active:shadow-[var(--shadow-button-active-filled)] active:brightness-100',
          'motion-reduce:transition-[box-shadow,filter,background-color] motion-reduce:active:scale-100',
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
