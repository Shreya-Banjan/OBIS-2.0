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
  { id: 'summary', label: 'Summary' },
  { id: 'nr-traffic', label: 'NR Traffic' },
  { id: 'covered-pops', label: 'Covered Pops (All)' },
  { id: 'gap-competition', label: 'Gap to Competition' },
  { id: 'mbp-score', label: 'MBP Score' },
  { id: 'coverage-5g', label: 'Network Coverage Area (5G)' },
  { id: 'nr-availability', label: 'NR Availability' },
  { id: 'hint-usage', label: 'HINT Usage (per user)' },
  { id: 'mobile-usage', label: 'Mobile Usage (per user)' },
];

export const WIDGET_CATEGORIES: WidgetCategory[] = [
  { id: 'network', title: 'Network Experience', widgets: NETWORK_WIDGETS },
  { id: 'build', title: 'Build', widgets: NETWORK_WIDGETS },
  { id: 'business', title: 'Business', widgets: NETWORK_WIDGETS },
  { id: 'performance', title: 'Performance', widgets: NETWORK_WIDGETS },
];
