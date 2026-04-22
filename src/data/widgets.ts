import type { CanvasKpiWidgetTier } from '../types';

export type WidgetCanvasPresentation = 'row' | 'kpi';

export type WidgetTemplate = {
  id: string;
  label: string;
  /**
   * Optional shorter KPI tile title when the slot is narrow or the viewport is small
   * (see `KpiTileHeading` in `canvasWidgetKpiParts` + `@container/kpi` on the canvas widget shell).
   */
  kpiLabelCompact?: string;
  /**
   * Quality → NSQIP only: row is shown when the active specialty filter includes any of these ids
   * (OBIS2.0 “Filter by Speciality”, Figma node 687-13120).
   */
  nsqipSpecialties?: readonly string[];
  /** Canvas: `kpi` uses OBIS KPI card (Figma 716-4250) in the fixed slot. */
  canvasPresentation?: WidgetCanvasPresentation;
  /** KPI definition copy for canvas tiles; L2 rail clips to `KPI_DEFINITION_CANVAS_L2_MAX_CHARS`. */
  kpiDefinition?: string;
  /**
   * L1 (narrow) KPI footer copy (≤ `KPI_DEFINITION_CANVAS_L1_MAX_CHARS`), full text with no ellipsis.
   * Required when `kpiDefinition` exceeds that length so the L1 rail never mid-sentence truncates.
   */
  kpiDefinitionL1?: string;
  /** Canvas KPI headline metric + unit row (Figma 716:4258). */
  kpiDemoValue?: string;
  kpiDemoUnit?: string;
  /** Optional delta chip after the unit (Figma 716:4262). */
  kpiDemoDeltaChip?: string;
  /** Canvas KPI trend sparkline beside metric + period (Figma 716:4264). */
  kpiDemoSparkline?: boolean;
};

/** Program / registry under a clinical section (e.g. NSQIP, CQM) — OBIS2.0 widget picker (Figma node 401:7723). */
export type WidgetSubgroup = {
  id: string;
  title: string;
  widgets: WidgetTemplate[];
};

/** Top-level section in the picker (e.g. Quality, Research). */
export type WidgetCategory = {
  id: string;
  title: string;
  subgroups: WidgetSubgroup[];
};

/** Specialties for the Quality NSQIP filter dropdown (Figma 687-13120). */
export const QUALITY_NSQIP_SPECIALTIES = [
  { id: 'general-surgery', label: 'General Surgery' },
  { id: 'gynecology', label: 'Gynecology' },
  { id: 'neurosurgery', label: 'Neurosurgery' },
  { id: 'orthopedics', label: 'Orthopedics' },
  { id: 'otolaryngology', label: 'Otolaryngology' },
] as const;

export const QUALITY_NSQIP_SPECIALTY_IDS: readonly string[] = QUALITY_NSQIP_SPECIALTIES.map((s) => s.id);

const QUALITY_NSQIP: WidgetTemplate[] = [
  {
    id: 'quality-nsqip-length-of-stay',
    label: 'Avg. Length of Stay',
    nsqipSpecialties: ['general-surgery', 'orthopedics', 'otolaryngology'],
    canvasPresentation: 'kpi',
    kpiDemoValue: '2.9',
    kpiDemoUnit: 'days',
    kpiDemoDeltaChip: '+0.2↑',
    kpiDemoSparkline: true,
    kpiDefinition:
      'Average hospital days from admission through discharge for NSQIP-eligible surgical patients. Compared with expected length of stay for matched severity to highlight efficient care without compromising safety, using standard NSQIP cohort rules.',
    kpiDefinitionL1:
      'Average days in hospital for NSQIP surgeries, admission to discharge.',
  },
  {
    id: 'quality-nsqip-reoperations',
    label: '30 days Unplanned RTOR',
    kpiLabelCompact: '30d Unplanned RTOR',
    nsqipSpecialties: ['general-surgery', 'gynecology'],
    canvasPresentation: 'kpi',
    kpiDefinition:
      'Return to the operating room for a related procedure within the NSQIP post-operative window. Captures unplanned reoperations tied to the index surgery for peer comparison, trending, and quality improvement reviews across specialties and sites.',
    kpiDefinitionL1:
      'Return to OR for related procedures during NSQIP post-operative follow-up.',
  },
  {
    id: 'quality-nsqip-readmissions',
    label: 'Readmissions',
    nsqipSpecialties: ['gynecology', 'neurosurgery'],
    canvasPresentation: 'kpi',
    kpiDefinition:
      'Unplanned readmission within 30 days of index discharge for the same principal problem. Helps identify transitions-of-care gaps, post-discharge complications, and opportunities to strengthen discharge planning across cohorts and facilities.',
    kpiDefinitionL1:
      'Unplanned readmit within 30 days for the same problem after discharge.',
  },
  {
    id: 'quality-nsqip-mortality',
    label: 'Mortality',
    nsqipSpecialties: ['gynecology', 'neurosurgery', 'otolaryngology'],
    canvasPresentation: 'kpi',
    kpiDefinition:
      'All-cause mortality during the index admission or in NSQIP-captured post-discharge follow-up. Risk-adjusted views compare observed deaths to expected mortality for similar severity, procedure mix, and comorbidity burden across reporting hospitals.',
    kpiDefinitionL1:
      'Mortality in hospital or NSQIP follow-up, risk-adjusted vs matched peers.',
  },
  {
    id: 'quality-nsqip-infections',
    label: 'Infections',
    nsqipSpecialties: ['neurosurgery', 'otolaryngology'],
    canvasPresentation: 'kpi',
    kpiDefinition:
      'Surgical site infections and other tracked infectious complications per NSQIP specifications for the index procedure. Supports prevention bundles, antimicrobial stewardship review, and benchmarking of infection rates against national expectations.',
    kpiDefinitionL1:
      'Tracked infections after the index surgery vs NSQIP national benchmarks.',
  },
  {
    id: 'quality-nsqip-utilization',
    label: 'Utilization',
    nsqipSpecialties: ['neurosurgery', 'orthopedics'],
    canvasPresentation: 'kpi',
    kpiDefinition:
      'Observed versus expected resource use for risk-matched peers, anchored on length-of-stay signals. Highlights outliers that may warrant clinical documentation review, care pathway refinement, or operational follow-up without implying causality alone.',
    kpiDefinitionL1:
      'Observed vs expected resource use among NSQIP risk-matched peer hospitals.',
  },
  {
    id: 'quality-nsqip-risk-adjustment',
    label: 'Risk Adjustment',
    nsqipSpecialties: ['orthopedics', 'general-surgery'],
    canvasPresentation: 'kpi',
    kpiDefinition:
      'Expected outcomes adjusted for NSQIP-logged comorbidities, acuity, and procedure mix. Enables fair comparison across hospitals and specialties with different case complexity while staying interpretable for surgical quality teams.',
    kpiDefinitionL1:
      'Expected outcomes adjusted for NSQIP case mix to compare hospitals fairly.',
  },
];

const QUALITY_CQM: WidgetTemplate[] = [
  { id: 'quality-cqm-treatment-compliance', label: 'Treatment Compliance' },
  { id: 'quality-cqm-surgical-quality', label: 'Surgical Quality' },
  { id: 'quality-cqm-communication', label: 'Communication' },
  { id: 'quality-cqm-care-coordination', label: 'Care Coordination' },
  { id: 'quality-cqm-infections', label: 'Infections' },
  { id: 'quality-cqm-harm-events', label: 'Harm Events' },
];

const RESEARCH_NSQIP: WidgetTemplate[] = [
  { id: 'research-nsqip-length-of-stay', label: 'Length of Stay' },
  { id: 'research-nsqip-reoperations', label: '30 days Unplanned RTOR' },
  { id: 'research-nsqip-readmissions', label: 'Readmissions' },
  { id: 'research-nsqip-mortality', label: 'Mortality' },
  { id: 'research-nsqip-ssi', label: 'SSI' },
  { id: 'research-nsqip-transfusions', label: 'Transfusions' },
  { id: 'research-nsqip-risk-adjustment', label: 'Risk Adjustment' },
];

const RESEARCH_CQM: WidgetTemplate[] = [
  { id: 'research-cqm-nr-traffic', label: 'NR Traffic' },
  { id: 'research-cqm-covered-pops-all', label: 'Covered Pops (All)' },
  { id: 'research-cqm-gap-to-competition', label: 'Gap to Competition' },
  { id: 'research-cqm-mbp-score', label: 'MBP Score' },
];

export const WIDGET_CATEGORIES: WidgetCategory[] = [
  {
    id: 'quality',
    title: 'Quality',
    subgroups: [
      { id: 'nsqip', title: 'NSQIP', widgets: QUALITY_NSQIP },
      { id: 'cqm', title: 'CQM', widgets: QUALITY_CQM },
    ],
  },
  {
    id: 'research',
    title: 'Research',
    subgroups: [
      { id: 'nsqip', title: 'NSQIP', widgets: RESEARCH_NSQIP },
      { id: 'cqm', title: 'CQM', widgets: RESEARCH_CQM },
    ],
  },
];

const widgetById = new Map<string, WidgetTemplate>();
for (const cat of WIDGET_CATEGORIES) {
  for (const sg of cat.subgroups) {
    for (const w of sg.widgets) {
      widgetById.set(w.id, w);
    }
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

/** Optional compact KPI headline when `kpiLabelCompact` is set on the template (responsive in the tile). */
export function widgetKpiLabelCompact(templateId: string): string | undefined {
  const c = getWidgetTemplateById(templateId)?.kpiLabelCompact?.trim();
  return c || undefined;
}

export function widgetUsesKpiCanvasPresentation(templateId: string): boolean {
  return getWidgetTemplateById(templateId)?.canvasPresentation === 'kpi';
}

/** Canvas KPI placeholder metric (Figma 716:4258 — value + unit; optional delta chip 716:4262). */
export function widgetKpiDemoMetric(templateId: string): {
  value: string;
  unit?: string;
  metricDeltaChip?: string;
  metricSparkline?: boolean;
} {
  const t = getWidgetTemplateById(templateId);
  const value = t?.kpiDemoValue?.trim();
  if (!value) return { value: '2.1', unit: '%', metricDeltaChip: '+0.2↑' };
  const unit = t?.kpiDemoUnit?.trim();
  const metricDeltaChip = t?.kpiDemoDeltaChip?.trim() || undefined;
  const metricSparkline = Boolean(t?.kpiDemoSparkline);
  if (!unit) return { value };
  return {
    value,
    unit,
    ...(metricDeltaChip ? { metricDeltaChip } : {}),
    ...(metricSparkline ? { metricSparkline: true } : {}),
  };
}

/** Eyebrow for KPI tile from template id (e.g. `quality-nsqip-*` → `Quality · NSQIP`). */
export function widgetCatalogEyebrow(templateId: string): string {
  if (templateId.startsWith('quality-nsqip-')) return 'Quality · NSQIP';
  if (templateId.startsWith('quality-cqm-')) return 'Quality · CQM';
  if (templateId.startsWith('research-nsqip-')) return 'Research · NSQIP';
  if (templateId.startsWith('research-cqm-')) return 'Research · CQM';
  return 'Metric';
}

/** L1 (narrow) KPI footer — copy budget for `kpiDefinitionL1` / short `kpiDefinition`. */
export const KPI_DEFINITION_CANVAS_L1_MAX_CHARS = 75;

/** L2 (wide) KPI definition rail. */
export const KPI_DEFINITION_CANVAS_L2_MAX_CHARS = 250;

/** @deprecated Use `KPI_DEFINITION_CANVAS_L1_MAX_CHARS`. */
export const KPI_DEFINITION_CANVAS_COMPACT_MAX_CHARS = KPI_DEFINITION_CANVAS_L1_MAX_CHARS;

/** @deprecated Use `KPI_DEFINITION_CANVAS_L2_MAX_CHARS`. */
export const KPI_DEFINITION_CANVAS_WIDE_MAX_CHARS = KPI_DEFINITION_CANVAS_L2_MAX_CHARS;

/** @deprecated Use `KPI_DEFINITION_CANVAS_L1_MAX_CHARS`. */
export const KPI_DEFINITION_CANVAS_MAX_CHARS = KPI_DEFINITION_CANVAS_L1_MAX_CHARS;

function clipKpiDefinitionWithEllipsis(raw: string, maxChars: number): string {
  if (raw.length <= maxChars) return raw;
  return `${raw.slice(0, maxChars - 1).trimEnd()}…`;
}

function kpiDefinitionForCanvasL1(template: WidgetTemplate | undefined): string {
  if (!template) return '';
  const raw = template.kpiDefinition?.trim() ?? '';
  const l1 = template.kpiDefinitionL1?.trim();
  if (l1) return l1;
  if (raw.length <= KPI_DEFINITION_CANVAS_L1_MAX_CHARS) return raw;
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console -- surfacing authoring mistakes during development
    console.error(
      `[widgets] Missing kpiDefinitionL1 for "${template.id}" (${raw.length} chars; L1 max ${KPI_DEFINITION_CANVAS_L1_MAX_CHARS}).`,
    );
  }
  return raw.slice(0, KPI_DEFINITION_CANVAS_L1_MAX_CHARS).trimEnd();
}

/** Definition blurb for the KPI card footer; L1 uses `kpiDefinitionL1` when the long blurb exceeds the L1 budget. */
export function widgetKpiDefinitionForCanvas(templateId: string, tier: CanvasKpiWidgetTier): string {
  const template = getWidgetTemplateById(templateId);
  if (tier === 'l1') {
    return kpiDefinitionForCanvasL1(template);
  }
  const raw = template?.kpiDefinition?.trim() ?? '';
  if (!raw) return '';
  return clipKpiDefinitionWithEllipsis(raw, KPI_DEFINITION_CANVAS_L2_MAX_CHARS);
}

function assertKpiDefinitionL1LengthInDev(): void {
  if (!import.meta.env.DEV) return;
  for (const w of widgetById.values()) {
    const c = w.kpiDefinitionL1?.trim();
    if (!c) continue;
    if (c.length > KPI_DEFINITION_CANVAS_L1_MAX_CHARS) {
      // eslint-disable-next-line no-console -- authoring guard
      console.warn(
        `[widgets] kpiDefinitionL1 is ${c.length} chars (max ${KPI_DEFINITION_CANVAS_L1_MAX_CHARS}): ${w.id}`,
      );
    }
  }
}

assertKpiDefinitionL1LengthInDev();
