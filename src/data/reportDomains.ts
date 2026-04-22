export const REPORT_DOMAIN_OPTIONS = [
  'Capacity',
  'Competition',
  'Conversion',
  'Market Intelligence',
  'Operations',
  'Program',
  'Provider Access',
  'Quality',
  'Referral',
  'Registry',
  'Research',
  'Scheduling',
  'Timeliness',
  'Utilization',
] as const;

export type ReportDomain = (typeof REPORT_DOMAIN_OPTIONS)[number];

export const DEFAULT_REPORT_DOMAIN: ReportDomain = 'Quality';
