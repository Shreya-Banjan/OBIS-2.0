import { IconNavDrawerListMark } from './Icons';

type AppBurgerButtonProps = {
  onClick: () => void;
  /** When set, the brand mark navigates home; the list icon still calls `onClick` (e.g. open menu). */
  onLogoClick?: () => void;
  className?: string;
};

const NAV_LOGO_SRC = `${import.meta.env.BASE_URL}figma-obis/nav-logo.png`;

const outerShellClass = `-ml-0.5 group inline-flex min-h-16 shrink-0 items-center justify-center gap-2.5 rounded-2xl border border-[#e4e4e4] bg-white py-2 pl-3 pr-2 text-[var(--color-grey-darkest)] shadow-sm transition-[border-color,box-shadow] sm:-ml-1 sm:gap-2.5 sm:py-3 sm:pl-4 sm:pr-3`;

const focusRingClass =
  'outline-none transition-[border-color,box-shadow,background-color] focus-visible:ring-2 focus-visible:ring-[var(--ring-input-focus)] active:border-[var(--color-brand-primary)] active:shadow-[var(--shadow-focus-brand)]';

/**
 * Standalone nav trigger — OBIS 2.0 header control (Figma node 395:5745): brand mark + list menu icon.
 * Sits on the gray canvas beside the main white header card. Use `className` for height / shadow overrides.
 */
export function AppBurgerButton({ onClick, onLogoClick, className = '' }: AppBurgerButtonProps) {
  if (onLogoClick == null) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${outerShellClass} ${focusRingClass} ${className}`.trim()}
        aria-label="Open menu"
        aria-haspopup="dialog"
      >
        <span className="relative size-8 shrink-0 overflow-hidden rounded-lg bg-white">
          <img
            alt=""
            src={NAV_LOGO_SRC}
            width={32}
            height={32}
            className="size-full scale-[1.12] object-cover object-center"
            draggable={false}
          />
        </span>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white p-2 transition-[background-color] group-hover:bg-[#f5f5f5] group-active:bg-[var(--color-brand-press-surface)]">
          <IconNavDrawerListMark className="size-6" />
        </span>
      </button>
    );
  }

  return (
    <div className={`${outerShellClass} ${className}`.trim()}>
      <button
        type="button"
        onClick={onLogoClick}
        className={`${focusRingClass} -m-0.5 inline-flex shrink-0 items-center justify-center rounded-lg p-0.5 hover:bg-[#f5f5f5]/60 active:bg-[var(--color-brand-press-surface)] sm:-m-1`}
        aria-label="Go to home"
      >
        <span className="relative size-8 shrink-0 overflow-hidden rounded-lg bg-white">
          <img
            alt=""
            src={NAV_LOGO_SRC}
            width={32}
            height={32}
            className="size-full scale-[1.12] object-cover object-center"
            draggable={false}
          />
        </span>
      </button>
      <button
        type="button"
        onClick={onClick}
        className={`${focusRingClass} flex size-10 shrink-0 items-center justify-center rounded-lg bg-white p-2 transition-[background-color] group-hover:bg-[#f5f5f5] group-active:bg-[var(--color-brand-press-surface)]`}
        aria-label="Open menu"
        aria-haspopup="dialog"
      >
        <IconNavDrawerListMark className="size-6" />
      </button>
    </div>
  );
}
