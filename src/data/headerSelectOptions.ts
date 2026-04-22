/** Shown as the closed `<select>` label until the user picks a scope (not listed in the menu). */
export const HEADER_SCOPE_PLACEHOLDER = 'Select Partner(s)';

/** Shown as the closed `<select>` label until the user picks a timeline (not listed in the menu). */
export const HEADER_TIMELINE_PLACEHOLDER = 'Timeline';

/** Partner organizations (header partner control + publish scope). */
export const PARTNER_SCOPE_OPTIONS = [
  'Banner',
  'Baptist',
  'CHN',
  'Cooper',
  'MDACC',
  'Ochsner MD Anderson',
  'Rush',
] as const;

/** @alias `PARTNER_SCOPE_OPTIONS` — kept for existing `SCOPE_OPTIONS` imports. */
export const SCOPE_OPTIONS = PARTNER_SCOPE_OPTIONS;

/** Editor header: concrete timeline rows (placeholder is separate). */
export const TIMELINE_OPTIONS = ["Feb '26", 'Jan 31, 2026', 'Dec 15, 2025', 'Nov 1, 2025'] as const;

export const MONTH_OPTIONS = [
  "Jan '26",
  "Feb '26",
  "Mar '26",
  "Apr '26",
  "May '26",
  "Jun '26",
  "Jul '26",
  "Aug '26",
  "Sep '26",
  "Oct '26",
  "Nov '26",
  "Dec '26",
] as const;
