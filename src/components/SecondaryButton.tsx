import { forwardRef, type ComponentPropsWithoutRef } from 'react';

export type SecondaryButtonProps = ComponentPropsWithoutRef<'button'>;

export const SecondaryButton = forwardRef<HTMLButtonElement, SecondaryButtonProps>(
  function SecondaryButton(
    { className, children, disabled, type = 'button', ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={[
          'inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4',
          "font-['Inter',sans-serif] text-sm font-medium tracking-[-0.28px] text-black",
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
