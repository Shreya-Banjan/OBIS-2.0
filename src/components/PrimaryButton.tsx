import { forwardRef, type ComponentPropsWithoutRef } from 'react';

export type PrimaryButtonProps = ComponentPropsWithoutRef<'button'>;

export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  function PrimaryButton(
    { className, children, disabled, type = 'button', ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={[
          'inline-flex h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-4',
          "font-['Inter',sans-serif] text-sm font-medium tracking-[-0.28px] text-white",
          'bg-[#e20074] outline-none transition-[box-shadow,filter] duration-150',
          'hover:shadow-[0_0_0_3px_rgba(226,0,116,0.2)] hover:brightness-[0.95]',
          'focus-visible:shadow-[0_0_0_3px_rgba(226,0,116,0.2)] focus-visible:brightness-[0.95]',
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
