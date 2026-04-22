import { useId } from 'react';
import { IconChevronDown } from './Icons';

type HeaderSelectProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  textClass: string;
  /** When set, shown as the closed control only; `hidden` keeps it out of the opened list. */
  placeholder?: string;
  /**
   * `toolbar`: sit inline in a wrapping header row (no full-width mobile stretch).
   * `default`: stack-friendly full width on small screens.
   */
  layout?: 'default' | 'toolbar';
  /** When two `toolbar` selects share a row, split width evenly (e.g. scope + date). */
  toolbarPair?: boolean;
};

export function HeaderSelect({
  label,
  value,
  onChange,
  options,
  textClass,
  placeholder,
  layout = 'default',
  toolbarPair = false,
}: HeaderSelectProps) {
  const id = useId();
  const hasValue = typeof value === 'string' && value.trim() !== '';
  /** Native `<select>` often ignores utility color/weight on the closed control; inline style fixes both partner + timeline. */
  const showSelectedLook = Boolean(placeholder && hasValue);
  const typographyClass = showSelectedLook ? '' : textClass;

  const wrapClass =
    layout === 'toolbar'
      ? toolbarPair
        ? 'relative min-w-0 flex-1 basis-0'
        : 'relative w-auto min-w-0 max-w-[min(100%,16rem)] shrink-0 sm:min-w-[11rem]'
      : 'relative w-full min-w-0 shrink-0 sm:w-auto';

  return (
    <div className={wrapClass}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={placeholder ? (value || '') : value}
        onChange={(e) => onChange(e.target.value)}
        style={
          showSelectedLook
            ? { color: '#333333', fontWeight: 500 }
            : undefined
        }
        className={`h-12 min-w-0 max-w-full cursor-pointer appearance-none truncate rounded-xl border border-[#e4e4e4] bg-[#FFF] px-4 py-0 font-['Poppins',sans-serif] text-sm outline-none ring-[var(--color-brand-primary)] transition-[background-color,border-color,box-shadow,color] duration-150 hover:border-[var(--color-brand-primary)] hover:bg-[#FFF] hover:shadow-none hover:ring-2 hover:ring-[var(--ring-input-focus)] focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring-input-focus)] active:border-[var(--color-brand-primary)] active:ring-2 active:ring-[var(--ring-input-focus)] sm:min-w-[11rem] ${layout === 'toolbar' ? (toolbarPair ? 'w-full min-w-0' : 'w-full min-w-[11rem]') : 'w-full sm:w-auto'} ${typographyClass}`}
      >
        {placeholder ? (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        ) : null}
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <IconChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-brand-primary)]" aria-hidden />
    </div>
  );
}
