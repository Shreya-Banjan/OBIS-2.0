import { IconMenu } from './Icons';

type AppBurgerButtonProps = {
  onClick: () => void;
  className?: string;
};

/** Standalone nav trigger — sits on the gray canvas, outside the main white header card. Use `className` for `h-16` (fixed) or `h-full self-stretch` (match adjacent `TopBar` height). */
export function AppBurgerButton({ onClick, className = '' }: AppBurgerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-16 w-[60px] shrink-0 items-center justify-center rounded-xl border border-[#e4e4e4] bg-white text-[#1e1e1f] shadow-sm transition-colors hover:bg-[#f5f5f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e1e1f]/20 ${className}`.trim()}
      aria-label="Open menu"
      aria-haspopup="dialog"
    >
      <IconMenu className="size-6" aria-hidden />
    </button>
  );
}
