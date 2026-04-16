import { forwardRef, type ComponentPropsWithoutRef } from 'react';

const primarySizeClasses = {
  large:
    'h-12 rounded-xl px-4 text-sm tracking-[-0.28px]',
  medium:
    'h-10 rounded-lg px-3.5 text-sm tracking-[-0.28px]',
  small:
    'h-8 rounded-lg px-3 text-xs tracking-[-0.24px]',
} as const;

export type PrimaryButtonProps = ComponentPropsWithoutRef<'button'> & {
  size?: keyof typeof primarySizeClasses;
};

export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  function PrimaryButton(
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
          primarySizeClasses[size],
          "font-['Inter',sans-serif] font-medium text-white",
          'bg-[#e20074] outline-none transition-[box-shadow,filter,scale] duration-200 ease-out',
          'hover:shadow-[var(--shadow-focus-brand)] hover:brightness-[0.95]',
          'focus-visible:shadow-[var(--shadow-focus-brand)] focus-visible:brightness-[0.95]',
          'active:scale-[0.97] active:brightness-[0.9]',
          'motion-reduce:transition-[box-shadow,filter] motion-reduce:active:scale-100',
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
