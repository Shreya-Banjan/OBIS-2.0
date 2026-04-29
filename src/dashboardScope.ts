import { PARTNER_SCOPE_OPTIONS } from './data/headerSelectOptions';
import { QUALITY_NSQIP_SPECIALTY_IDS } from './data/widgets';
import { locationsForPartner } from './data/partnerLocations';
import type { DashboardGlobalState } from './types';

export type { DashboardGlobalState } from './types';

/** Canonical partner catalog size (header scope). */
export const DASHBOARD_PARTNER_CATALOG_COUNT = PARTNER_SCOPE_OPTIONS.length;

export const DASHBOARD_NSQIP_SPECIALTY_COUNT = QUALITY_NSQIP_SPECIALTY_IDS.length;

export type ResolvedPartnerLocation = {
  partner: string;
  location: string;
};

export function isAllPartnersSelected(partners: readonly string[]): boolean {
  if (partners.length !== DASHBOARD_PARTNER_CATALOG_COUNT) return false;
  const set = new Set(partners);
  return PARTNER_SCOPE_OPTIONS.every((p) => set.has(p));
}

/** True when more than one distinct partner scope is active (multi-select or full catalog). */
export function isMultiPartnerMode(partners: readonly string[]): boolean {
  if (partners.length === 0) return false;
  return partners.length > 1 || isAllPartnersSelected(partners);
}

export function isSinglePartnerMode(partners: readonly string[]): boolean {
  return partners.length === 1;
}

export function hasPartnerScope(partners: readonly string[]): boolean {
  return partners.length > 0;
}

export function isSpecialtyNarrowed(specialtyIds: readonly string[]): boolean {
  const n = specialtyIds.length;
  return n > 0 && n < DASHBOARD_NSQIP_SPECIALTY_COUNT;
}

export function hasLocationSelection(locationLabels: readonly string[]): boolean {
  return locationLabels.length > 0;
}

/**
 * Resolve `(Partner, Location)` pairs. Same location label is repeated per partner when it exists for that partner.
 * Omits partners that do not list the chosen location(s) — no throw (partial data).
 */
export function resolvePartnerLocations(
  partners: readonly string[],
  locationLabels: readonly string[],
): ResolvedPartnerLocation[] {
  if (partners.length === 0 || locationLabels.length === 0) return [];
  const partnerList = isAllPartnersSelected(partners) ? [...PARTNER_SCOPE_OPTIONS] : [...partners];
  const out: ResolvedPartnerLocation[] = [];
  for (const p of partnerList) {
    const locs = locationsForPartner(p);
    const locSet = new Set(locs);
    for (const lab of locationLabels) {
      if (locSet.has(lab)) out.push({ partner: p, location: lab });
    }
  }
  return out;
}

export type L3BreakdownDimension = 'Partner' | 'Location' | 'Specialty' | 'Surgeon';

/**
 * Ordered L3 breakdown dimensions from current scope (spec §6, predicates made explicit).
 */
export function getL3BreakdownDimensions(state: DashboardGlobalState): L3BreakdownDimension[] {
  const hp = hasPartnerScope(state.partners);
  const hl = hasLocationSelection(state.locationLabels);
  const ns = isSpecialtyNarrowed(state.specialtyIds);

  if (!hp && !hl && !ns) return ['Partner', 'Location', 'Specialty', 'Surgeon'];
  if (hp && !hl && !ns) return ['Location', 'Specialty', 'Surgeon'];
  if (hp && hl && !ns) return ['Specialty', 'Surgeon'];
  if (hp && !hl && ns) return ['Location', 'Surgeon'];
  if (hp && hl && ns) return ['Surgeon'];
  if (!hp && hl && !ns) return ['Partner', 'Specialty', 'Surgeon'];
  if (!hp && !hl && ns) return ['Partner', 'Location', 'Surgeon'];
  if (!hp && hl && ns) return ['Partner', 'Surgeon'];
  return ['Partner', 'Location', 'Specialty', 'Surgeon'];
}

/**
 * Primary dimension for L3 **chart** legend chips / multi-line trends.
 *
 * Table columns follow `getL3BreakdownDimensions` (spec §6) verbatim. When partner scope is **multi**
 * (`isMultiPartnerMode`), the chart still compares **by partner** (one series per partner), even though
 * Partner may be omitted from the table order (e.g. `hp && !hl && !ns` → Location is the first drill column).
 */
export function getL3ChartLegendPrimaryDimension(state: DashboardGlobalState): L3BreakdownDimension {
  const dims = getL3BreakdownDimensions(state);
  const first = dims[0] ?? 'Partner';
  if (isMultiPartnerMode(state.partners)) {
    return 'Partner';
  }
  return first;
}

export function defaultDashboardGlobalState(timeline: string): DashboardGlobalState {
  return {
    partners: [],
    timeline,
    specialtyIds: [],
    locationLabels: [],
  };
}

/** Location labels common to every selected partner (intersection); empty if none. */
export function locationOptionsForPartners(partners: readonly string[]): string[] {
  if (partners.length === 0) return [];
  const partnerNames = isAllPartnersSelected(partners) ? [...PARTNER_SCOPE_OPTIONS] : [...partners];
  const lists = partnerNames.map((p) => [...locationsForPartner(p)]);
  if (lists.length === 0) return [];
  return lists.reduce((acc, locs) => acc.filter((x) => locs.includes(x)), lists[0]!);
}
