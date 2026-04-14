export type WidgetTemplate = {
  id: string;
  label: string;
};

export type WidgetCategory = {
  id: string;
  title: string;
  widgets: WidgetTemplate[];
};

const NETWORK_WIDGETS: WidgetTemplate[] = [
  { id: 'covered-pops', label: 'Covered Pops (All)' },
  { id: 'gap-competition', label: 'GAP to competition' },
  { id: 'coverage-5g', label: 'Network Coverage Area (5G)' },
  { id: 'nr-availability', label: 'NR Availability' },
  { id: 'nr-congestion', label: 'NR Congestion' },
  { id: 'hint-usage', label: 'Usage Hint (Per User)' },
  { id: 'mobile-usage', label: 'Usage Mobile (Per User)' },
];

const OPERATIONS_WIDGETS: WidgetTemplate[] = [
  { id: 'all-in-ran-availability', label: 'All In RAN Availability' },
  { id: 'alm-at-risk', label: 'ALM At Risk' },
  { id: 'eme-signage-compliance', label: 'EME Signage Compliance' },
  { id: 'extended-outage', label: 'Extended Outage' },
  { id: 'outage-impact-index', label: 'Outage Impact Index' },
  { id: 'preventive-maintenance-visits', label: 'Preventive Maintenance Visits' },
];

const BUILD_WIDGETS: WidgetTemplate[] = [
  { id: 'hardened', label: 'Hardened' },
  { id: 'on-air-sites', label: 'On Air Sites' },
  { id: 'sites-with-10g-backhaul', label: 'Sites with 10G backhaul' },
  { id: 'small-cells', label: 'Small Cells' },
];

const CUSTOMER_EXPERIENCE_WIDGETS: WidgetTemplate[] = [
  { id: 'calls-to-care', label: 'Calls to care' },
  { id: 'mbp-score', label: 'MBP Score' },
  { id: 'nex-score', label: 'Nex Score' },
];

const BUSINESS_WIDGETS: WidgetTemplate[] = [
  { id: 'capex', label: 'CAPEX' },
  { id: 'churn-postpaid', label: 'CHURN(Postpaid)' },
  { id: 'market-share', label: 'Market Share' },
  { id: 'net-adds', label: 'NET Adds' },
  { id: 'share-of-households', label: 'Share of Households' },
];

const PERFORMANCE_WIDGETS: WidgetTemplate[] = [
  { id: 'clv-macro-cdc', label: 'CLV (Macro CDC)' },
  { id: 'market-penetration', label: 'Market Penetration' },
  { id: 'market-score', label: 'Market Score' },
  { id: 'subs-cagr', label: 'Subs CAGR' },
];

export const WIDGET_CATEGORIES: WidgetCategory[] = [
  { id: 'network', title: 'Network Experience', widgets: NETWORK_WIDGETS },
  { id: 'operations', title: 'Operations', widgets: OPERATIONS_WIDGETS },
  { id: 'customer-experience', title: 'Customer Experience', widgets: CUSTOMER_EXPERIENCE_WIDGETS },
  { id: 'business', title: 'Business', widgets: BUSINESS_WIDGETS },
  { id: 'performance', title: 'Performance', widgets: PERFORMANCE_WIDGETS },
  { id: 'build', title: 'Build', widgets: BUILD_WIDGETS },
];

const widgetById = new Map<string, WidgetTemplate>();
for (const cat of WIDGET_CATEGORIES) {
  for (const w of cat.widgets) {
    widgetById.set(w.id, w);
  }
}

/** Resolve catalog label for a template id (canvas rows should show catalog names, not stale stored labels). */
export function getWidgetTemplateById(templateId: string): WidgetTemplate | undefined {
  return widgetById.get(templateId);
}

export function getWidgetDisplayLabel(templateId: string, storedLabel: string): string {
  if (templateId === '__placeholder__') return storedLabel;
  return getWidgetTemplateById(templateId)?.label ?? storedLabel;
}
