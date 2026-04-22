import { IconAdd, IconLayoutGrid, IconSearch } from './Icons';
import { PrimaryButton } from './PrimaryButton';

type ReportsListComponentsCtaProps = {
  onOpenComponents: () => void;
};

/**
 * Compact “Components” control for `ViewportSizePresetBar` (matches preset chip styling).
 */
export function ReportsListComponentsCta({ onOpenComponents }: ReportsListComponentsCtaProps) {
  return (
    <div className="min-w-0 shrink-0">
      <button
        type="button"
        onClick={onOpenComponents}
        className="inline-flex h-8 min-w-0 shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-lg border border-[#e4e4e4] bg-white px-2 py-1 font-['Inter',sans-serif] text-[10px] font-medium leading-none text-[#1e1e1f] transition-[color,background-color,scale,border-color,box-shadow] duration-200 ease-out hover:bg-[#f5f5f5] active:scale-[0.97] active:border-[var(--color-brand-primary)] active:bg-[var(--color-brand-press-surface)] active:shadow-[var(--shadow-focus-brand)] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-input-focus)] sm:h-9 sm:gap-2 sm:px-2.5 sm:py-1.5 sm:text-xs w-auto max-w-[10rem] sm:max-w-none"
      >
        <IconLayoutGrid className="size-[14px] shrink-0 text-[#707070] sm:size-4" aria-hidden />
        <span className="truncate">Components</span>
      </button>
    </div>
  );
}

type ReportsListToolbarActionsProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchFocused: boolean;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onNewReport: () => void;
  /** `wide` and `narrow`: search + New Report only (Components is on `ViewportSizePresetBar`). */
  layout: 'wide' | 'narrow';
};

/**
 * Search + New Report CTAs for the reports list toolbar.
 */
export function ReportsListToolbarActions({
  searchQuery,
  onSearchQueryChange,
  searchFocused,
  onSearchFocus,
  onSearchBlur,
  onNewReport,
  layout,
}: ReportsListToolbarActionsProps) {
  const searchExpanded = searchFocused || searchQuery.trim() !== '';
  const wide = layout === 'wide';
  const narrow = !wide;
  const narrowExpanded = narrow && searchExpanded;

  const searchInnerClasses = wide
    ? `relative min-h-12 min-w-12 overflow-hidden rounded-[16px] border border-[#e4e4e4] bg-white shadow-[var(--shadow-card)] transition-[max-width,border-color,box-shadow] duration-300 ease-out motion-reduce:transition-none hover:border-[var(--color-brand-primary)] hover:bg-[#fafafa] hover:ring-2 hover:ring-[var(--ring-input-focus)] focus-within:border-[var(--color-brand-primary)] focus-within:ring-2 focus-within:ring-[var(--ring-input-focus)] focus-within:ring-offset-0 ${
        searchExpanded
          ? 'max-w-[min(100%,28rem)] @min-[768px]:max-w-sm'
          : 'max-w-12 cursor-text'
      }`
    : `relative min-h-12 overflow-hidden rounded-[16px] border border-[#e4e4e4] bg-white shadow-[var(--shadow-card)] transition-[max-width,border-color,box-shadow] duration-300 ease-out motion-reduce:transition-none hover:border-[var(--color-brand-primary)] hover:bg-[#fafafa] hover:ring-2 hover:ring-[var(--ring-input-focus)] focus-within:border-[var(--color-brand-primary)] focus-within:ring-2 focus-within:ring-[var(--ring-input-focus)] focus-within:ring-offset-0 ${
        searchExpanded
          ? 'min-w-0 w-full max-w-none flex-1'
          : 'w-12 max-w-12 shrink-0 cursor-text'
      }`;

  return (
    <div
      className={
        wide
          ? 'flex w-full min-w-0 flex-wrap items-center gap-2 @min-[640px]:contents @min-[640px]:gap-0'
          : 'flex w-full min-w-0 flex-row items-stretch gap-2'
      }
    >
      <div
        className={`flex min-h-12 min-w-0 justify-end ${
          wide
            ? 'flex-1 @min-[640px]:inline-flex @min-[640px]:w-fit @min-[640px]:shrink-0 @min-[640px]:justify-end'
            : narrowExpanded
              ? 'min-w-0 flex-1'
              : 'w-12 shrink-0'
        }`}
      >
        <div className={searchInnerClasses}>
          <label htmlFor="reports-toolbar-search" className="sr-only">
            Search reports
          </label>
          <IconSearch
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#707070]"
            aria-hidden
          />
          <input
            id="reports-toolbar-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            placeholder="Search reports…"
            autoComplete="off"
            spellCheck={false}
            className="box-border h-12 w-full min-w-0 rounded-[16px] border-0 bg-transparent py-0 pl-10 pr-3 font-['Inter',sans-serif] text-sm text-[#1e1e1f] outline-none ring-[var(--color-brand-primary)] placeholder:text-[#707070] transition-[box-shadow] duration-150 active:ring-2 active:ring-[var(--ring-input-focus)]"
          />
        </div>
      </div>
      <div
        className={`min-w-0 ${wide ? 'shrink-0 @min-[640px]:w-auto @min-[640px]:shrink-0' : narrowExpanded ? 'w-12 shrink-0' : 'flex-1'}`}
      >
        <PrimaryButton
          type="button"
          onClick={onNewReport}
          aria-label={narrowExpanded ? 'New report' : undefined}
          className={`h-12 min-h-12 min-w-0 rounded-[16px] ${
            wide
              ? 'w-full gap-2 px-4 @min-[640px]:w-auto'
              : narrowExpanded
                ? 'w-12 min-w-12 shrink-0 justify-center gap-0 px-0'
                : 'w-full gap-2 px-4'
          }`}
        >
          <IconAdd className="size-5 shrink-0" aria-hidden />
          {!narrowExpanded && <span className="truncate">New Report</span>}
        </PrimaryButton>
      </div>
    </div>
  );
}
