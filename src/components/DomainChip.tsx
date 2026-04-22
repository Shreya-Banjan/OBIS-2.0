import { domainChipToneClasses } from '../data/domainChipStyles';

type DomainChipProps = {
  label: string;
  className?: string;
};

/** Domain label chip — vertical metrics match `ReportStatusBadge` (py-1 px-1.5, 10px / leading-none). */
export function DomainChip({ label, className = '' }: DomainChipProps) {
  return (
    <span
      className={`inline-flex w-max max-w-[min(100%,14rem)] shrink-0 items-center truncate rounded-md py-1 px-1.5 font-['Inter',sans-serif] text-[10px] font-medium leading-none ${domainChipToneClasses(label)} ${className}`.trim()}
    >
      {label}
    </span>
  );
}
