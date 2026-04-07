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
};

export function HeaderSelect({ label, icon: Icon, value, onChange, options, textClass }: HeaderSelectProps) {
  const id = useId();

  return (
    <div className="relative w-full min-w-0 shrink-0 sm:w-auto">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Icon className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-[#1e1e1f]" />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-12 w-full min-w-0 cursor-pointer appearance-none rounded-xl border border-[#e4e4e4] bg-[#FFF] py-0 pl-12 pr-10 font-['Poppins',sans-serif] text-sm font-semibold outline-none ring-[#b6bec8] transition-[background-color,border-color,box-shadow] duration-150 hover:border-[#8a8a8a] hover:bg-[#FFF] hover:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] focus-visible:ring-2 sm:min-w-[11rem] sm:w-auto ${textClass}`}
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
