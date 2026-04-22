import { ReportsListComponentsCta } from './ReportsListToolbarActions';

/**
 * Dev / preview toolbar: constrain the reports page to common viewport widths.
 */
export const VIEWPORT_SIZE_PRESETS = [
  { id: 'mobile', label: 'Mobile', width: 390 },
  { id: 'laptop', label: 'Laptop', width: 1366 },
  { id: 'd1440', label: 'Desktop (1440)', width: 1440 },
  { id: 'd1920', label: 'Desktop (1920)', width: 1920 },
  { id: 'uw3000', label: 'Ultra wide screen (3000)', width: 3000 },
  { id: 'k4', label: '4K displays (3200)', width: 3200 },
  { id: 'k5', label: '5K display (3840)', width: 3840 },
  { id: 'suw5120', label: 'Super ultra-wide (5120)', width: 5120 },
] as const;

type ViewportSizePresetBarProps = {
  selectedWidth: number | null;
  onSelectWidth: (width: number | null) => void;
  /** When set, shows a Components CTA on the start side of the bar (e.g. reports list). */
  onOpenComponents?: () => void;
};

export function ViewportSizePresetBar({
  selectedWidth,
  onSelectWidth,
  onOpenComponents,
}: ViewportSizePresetBarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Preview viewport width"
      className={`mb-3 flex w-full min-w-0 flex-wrap items-center gap-y-2 sm:mb-4 ${
        onOpenComponents ? 'justify-between gap-x-2' : 'justify-end'
      }`}
    >
      {onOpenComponents ? (
        <ReportsListComponentsCta onOpenComponents={onOpenComponents} />
      ) : null}
      <div className="flex max-w-full flex-wrap items-center justify-end gap-1 sm:gap-1.5">
        <span className="mr-1 hidden font-['Inter',sans-serif] text-[10px] font-medium uppercase tracking-wide text-[#707070] sm:inline sm:mr-2">
          Screen size
        </span>
        <button
          type="button"
          onClick={() => onSelectWidth(null)}
          aria-pressed={selectedWidth === null}
          title="Use full browser width"
          className={`shrink-0 rounded-lg border px-2 py-1 font-['Inter',sans-serif] text-[10px] font-medium leading-none transition-colors sm:px-2.5 sm:py-1.5 sm:text-xs ${
            selectedWidth === null
              ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white'
              : 'border-[#e4e4e4] bg-white text-[#1e1e1f] hover:bg-[#f5f5f5]'
          }`}
        >
          Full
        </button>
        {VIEWPORT_SIZE_PRESETS.map((p) => {
          const active = selectedWidth === p.width;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectWidth(p.width)}
              aria-pressed={active}
              title={p.label}
              className={`max-w-[10rem] shrink-0 truncate rounded-lg border px-2 py-1 font-['Inter',sans-serif] text-[10px] font-medium leading-none transition-colors sm:max-w-none sm:px-2.5 sm:py-1.5 sm:text-xs ${
                active
                  ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white'
                  : 'border-[#e4e4e4] bg-white text-[#1e1e1f] hover:bg-[#f5f5f5]'
              }`}
            >
              <span className="sm:hidden">{p.width}</span>
              <span className="hidden sm:inline">{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
