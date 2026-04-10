import { IconMenu } from './Icons';

/** Width matches content `pl-[var(--app-menu-rail)]` in index.css */
export const APP_MENU_RAIL_CLASS = 'pl-[var(--app-menu-rail)]';

type PageMenuRailProps = {
  onMenuOpen: () => void;
  className?: string;
};

/** Hamburger fixed to the viewport left edge (outside the main content column). */
export function PageMenuRail({ onMenuOpen, className = '' }: PageMenuRailProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[40] flex w-[var(--app-menu-rail)] flex-col items-center border-r border-[#e4e4e4] bg-[#ebebeb] pt-4 ${className}`.trim()}
      aria-label="App menu"
    >
      <div className="flex h-16 w-fit items-center justify-center rounded-2xl bg-white p-3 shadow-[var(--shadow-card)]">
        <button
          type="button"
          onClick={onMenuOpen}
          className="flex size-10 items-center justify-center rounded-lg bg-white text-[#1e1e1f] hover:bg-[#f5f5f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e1e1f]/20"
          aria-label="Open menu"
          aria-haspopup="dialog"
        >
          <IconMenu className="size-6" />
        </button>
      </div>
    </aside>
  );
}
