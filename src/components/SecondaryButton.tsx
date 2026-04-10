import { forwardRef, type ComponentPropsWithoutRef } from 'react';

const secondarySizeClasses = {
  large:
    'h-12 gap-2 rounded-xl px-4 text-sm tracking-[-0.28px]',
  medium:
    'h-10 gap-1.5 rounded-lg px-3.5 text-sm tracking-[-0.28px]',
  small:
    'h-8 gap-1.5 rounded-lg px-3 text-xs tracking-[-0.24px]',
} as const;

export type SecondaryButtonProps = ComponentPropsWithoutRef<'button'> & {
  size?: keyof typeof secondarySizeClasses;
};

export const SecondaryButton = forwardRef<HTMLButtonElement, SecondaryButtonProps>(
  function SecondaryButton(
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
          secondarySizeClasses[size],
          "font-['Inter',sans-serif] font-medium text-black",
          'box-border border-[1.5px] border-solid border-black bg-white outline-none [border-image:none]',
          'transition-[border-color,box-shadow] duration-150',
          'hover:border-black/75 hover:shadow-[var(--shadow-focus)]',
          'focus-visible:border-black/75 focus-visible:shadow-[var(--shadow-focus)]',
          'active:border-black',
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
