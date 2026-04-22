import type { ReportDomain } from './reportDomains';
import { REPORT_DOMAIN_OPTIONS } from './reportDomains';

/**
 * Light pastel fills per domain — soft backgrounds with deeper (still readable) text.
 * Hues are spread so neighbors read as different at a glance.
 */
export const DOMAIN_CHIP_TONE: Record<ReportDomain, string> = {
  Capacity: 'bg-sky-100 text-sky-900',
  Competition: 'bg-rose-100 text-rose-900',
  Conversion: 'bg-violet-100 text-violet-900',
  'Market Intelligence': 'bg-cyan-100 text-cyan-900',
  Operations: 'bg-amber-100 text-amber-950',
  Program: 'bg-indigo-100 text-indigo-900',
  'Provider Access': 'bg-teal-100 text-teal-900',
  Quality: 'bg-emerald-100 text-emerald-900',
  Referral: 'bg-fuchsia-100 text-fuchsia-900',
  Registry: 'bg-slate-100 text-slate-800',
  Research: 'bg-blue-100 text-blue-900',
  Scheduling: 'bg-yellow-100 text-yellow-950',
  Timeliness: 'bg-orange-100 text-orange-950',
  Utilization: 'bg-lime-100 text-lime-900',
};

const DEFAULT_TONE = 'bg-slate-100 text-slate-800';

function isReportDomain(value: string): value is ReportDomain {
  return (REPORT_DOMAIN_OPTIONS as readonly string[]).includes(value);
}

export function domainChipToneClasses(label: string): string {
  if (isReportDomain(label)) return DOMAIN_CHIP_TONE[label];
  return DEFAULT_TONE;
}
