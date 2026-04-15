import { useId } from 'react';
import { IconChevronDown, IconLocation } from './Icons';

export type HeaderSelectIcon = typeof IconLocation;

type HeaderSelectProps = {
  label: string;
  icon: HeaderSelectIcon;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  textClass: string;
  /**
   * `toolbar`: sit inline in a wrapping header row (no full-width mobile stretch).
   * `default`: stack-friendly full width on small screens.
   */
  layout?: 'default' | 'toolbar';
};

export function HeaderSelect({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  textClass,
  layout = 'default',
}: HeaderSelectProps) {
  const id = useId();

  const wrapClass =
    layout === 'toolbar'
      ? 'relative w-auto min-w-0 max-w-[min(100%,16rem)] shrink-0 sm:min-w-[11rem]'
      : 'relative w-full min-w-0 shrink-0 sm:w-auto';

  return (
    <div className={wrapClass}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Icon className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-[#1e1e1f]" />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-12 min-w-0 cursor-pointer appearance-none rounded-xl border border-[#e4e4e4] bg-[#FFF] py-0 pl-12 pr-10 font-['Poppins',sans-serif] text-sm font-semibold outline-none ring-[#b6bec8] transition-[background-color,border-color,box-shadow] duration-150 hover:border-[#8a8a8a] hover:bg-[#FFF] hover:shadow-[var(--shadow-focus)] focus-visible:ring-2 sm:min-w-[11rem] ${layout === 'toolbar' ? 'w-full min-w-[11rem]' : 'w-full sm:w-auto'} ${textClass}`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 size-[18px] -translate-y-1/2 text-[#e20074]" />
    </div>
  );
}
