import { PARTNER_SCOPE_OPTIONS } from './headerSelectOptions';

/** Demo catalog: locations per partner name (not globally unique). */
export const PARTNER_LOCATION_OPTIONS: { readonly partner: string; readonly locations: readonly string[] }[] =
  PARTNER_SCOPE_OPTIONS.map((partner) => ({
    partner,
    locations:
      partner === 'Banner'
        ? ['North', 'South', 'Central']
        : partner === 'Baptist'
          ? ['Main Campus', 'North']
          : partner === 'CHN'
            ? ['Regional', 'North']
            : partner === 'Cooper'
              ? ['Camden', 'South']
              : partner === 'MDACC'
                ? ['Houston Main', 'League City']
                : partner === 'Ochsner MD Anderson'
                  ? ['New Orleans', 'North Shore']
                  : partner === 'Rush'
                    ? ['Chicago', 'Oak Park']
                    : ['Main'],
  }));

export function locationsForPartner(partnerName: string): readonly string[] {
  const row = PARTNER_LOCATION_OPTIONS.find((p) => p.partner === partnerName);
  return row?.locations ?? [];
}
