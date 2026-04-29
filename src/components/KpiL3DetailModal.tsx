import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  buildAlignedExtraLineRates,
  getKpiTrendSeriesFromTimeline,
  monthYearFromTrendXLabel,
} from '../data/kpiTrendSeriesFromTimeline';
import {
  IconChartBar,
  IconChartLine,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconDownload,
  IconLayoutGrid,
} from './Icons';
import { KpiL3TrendTable, type KpiL3TrendTableColumnKey, type KpiL3TrendTableRow } from './KpiL3TrendTable';
import type { DashboardGlobalState } from '../types';
import {
  DASHBOARD_NSQIP_SPECIALTY_COUNT,
  getL3BreakdownDimensions,
  isAllPartnersSelected,
  isMultiPartnerMode,
  isSpecialtyNarrowed,
  locationOptionsForPartners,
  resolvePartnerLocations,
  type L3BreakdownDimension,
} from '../dashboardScope';
import { PARTNER_SCOPE_OPTIONS } from '../data/headerSelectOptions';
import { QUALITY_NSQIP_SPECIALTIES } from '../data/widgets';
import { KpiTitleTrendChart } from './canvas/KpiTitleTrendChart';
import { splitKpiValueAndUnit } from './canvas/canvasWidgetKpiParts';
import { PartnerScopePickerField } from './PartnerScopePickerField';
import { SpecialityPickerField } from './SpecialityPickerField';
import { ToggleGroup } from './ToggleGroup';

/** L3 shell — [OBIS2.0 · 1899:5341](https://www.figma.com/design/2Z3gqwUnoKnsm6U5aQ1Xp2/OBIS2.0?node-id=1899-5341). */
const DEMO_RECORD_TOTAL = 2518;

/** Left-rail metric suffix: shorten word units for space (full word kept for assistive tech). */
function l3RailUnitDisplay(unit: string): string {
  const t = unit.trim().toLowerCase();
  if (t === 'days' || t === 'day') return 'd';
  return unit;
}

/** Demo salt from modal partner + specialty scope (L3-only; does not write back to the editor). */
function demoSaltFromModalScope(partners: readonly string[], specialtyIds: readonly string[]): number {
  const s = `${[...partners].sort().join('\u0000')}\u0001${[...specialtyIds].sort().join('\u0000')}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)!;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h || 1;
}

function L3MiniSparkline({ values, className }: { values: readonly number[]; className?: string }) {
  const w = 32;
  const h = 16;
  const pad = 1;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const n = values.length;
  const points = values
    .map((v, i) => {
      const x = pad + (n <= 1 ? w / 2 : (i / (n - 1)) * (w - pad * 2));
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={32}
      height={16}
      className={['shrink-0 text-[#f96c50]', className].filter(Boolean).join(' ')}
      aria-hidden
    >
      <polyline fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

/** Demo surgical service lines — not KPI catalog / domain labels. */
const DEMO_SURGICAL_SPECIALTIES = [
  'Orthopedics',
  'Gynecology',
  'Urology',
  'General Surgery',
  'Cardiothoracic Surgery',
  'Neurosurgery',
  'Vascular Surgery',
  'Colorectal Surgery',
  'Plastic Surgery',
  'Otolaryngology',
] as const;

function trendColumnsForBreakdown(
  breakdown: L3BreakdownDimension[],
): { key: KpiL3TrendTableColumnKey; label: string; align: 'left' | 'right' }[] {
  const lead: { key: KpiL3TrendTableColumnKey; label: string; align: 'left' | 'right' }[] = [];
  for (const d of breakdown) {
    if (d === 'Partner') lead.push({ key: 'partnerScope', label: 'Partner', align: 'left' });
    if (d === 'Location') lead.push({ key: 'facilityLocation', label: 'Location', align: 'left' });
    if (d === 'Specialty') lead.push({ key: 'surgicalSpeciality', label: 'Specialty', align: 'left' });
    if (d === 'Surgeon') lead.push({ key: 'attendingStaffSurgeon', label: 'Attending / Staff Surgeon', align: 'left' });
  }
  return [
    ...lead,
    { key: 'lmrn', label: 'Lmrn', align: 'left' },
    { key: 'monthOfYear', label: 'Month of the Year', align: 'left' },
    { key: 'year', label: 'Year', align: 'left' },
    { key: 'avgLengthOfStay', label: 'Avg. Length of Stay', align: 'right' },
  ];
}

const DEMO_ATTENDING_SURGEONS = [
  'A. Chen, MD',
  'M. I. Patel, MD',
  'J. R. Olsen, MD',
  'S. N. Garcia, MD',
  'K. Williams, MD',
  'R. Nguyen, MD',
] as const;

/** Series chip colors — cycle when more than four labels. */
const L3_LEGEND_DOT_CLASSES = [
  'bg-[#e85d9a]',
  'bg-[#e6332a]',
  'bg-[#9ca3af]',
  'bg-[#f96c50]',
  'bg-[#6366f1]',
  'bg-[#22c55e]',
] as const;

/** SVG / polyline strokes aligned with `L3_LEGEND_DOT_CLASSES`. */
const L3_LEGEND_STROKES = ['#e85d9a', '#e6332a', '#9ca3af', '#f96c50', '#6366f1', '#22c55e'] as const;

function partnerLegendLabels(partners: readonly string[]): string[] {
  if (partners.length === 0) return [...PARTNER_SCOPE_OPTIONS].slice(0, 4);
  if (isAllPartnersSelected(partners)) return [...PARTNER_SCOPE_OPTIONS].slice(0, 4);
  return [...partners].slice(0, 6);
}

function locationLegendLabels(scope: DashboardGlobalState, partners: readonly string[]): string[] {
  if (scope.locationLabels.length > 0) return [...scope.locationLabels].slice(0, 6);
  return locationOptionsForPartners(partners).slice(0, 6);
}

function specialtyLegendLabels(specialtyIds: readonly string[]): string[] {
  if (specialtyIds.length === 0 || specialtyIds.length >= DASHBOARD_NSQIP_SPECIALTY_COUNT) {
    return QUALITY_NSQIP_SPECIALTIES.slice(0, 4).map((s) => s.label);
  }
  return specialtyIds
    .map((id) => QUALITY_NSQIP_SPECIALTIES.find((s) => s.id === id)?.label ?? id)
    .slice(0, 6);
}

/**
 * Dimension used for L3 chart legend chips. Follows `getL3BreakdownDimensions` order except:
 * exactly one partner (not “all partners”) and 2+ specific specialties (not full catalog) → show **Specialty**
 * series instead of **Location**, so multi-specialty under one partner is visible in the legend.
 */
function chartLegendPrimaryDimension(scope: DashboardGlobalState): L3BreakdownDimension | undefined {
  const dims = getL3BreakdownDimensions(scope);
  const primary = dims[0];
  const singleConcretePartner =
    scope.partners.length === 1 && !isAllPartnersSelected(scope.partners);
  const multiSpecialtyPick =
    scope.specialtyIds.length >= 2 && scope.specialtyIds.length < DASHBOARD_NSQIP_SPECIALTY_COUNT;

  if (singleConcretePartner && multiSpecialtyPick) {
    return 'Specialty';
  }
  return primary;
}

/** Chart series labels (and matching stroke) for the chosen primary dimension. */
function chartLegendForPrimaryDimension(
  primary: L3BreakdownDimension | undefined,
  scope: DashboardGlobalState,
): { label: string; dot: string; stroke: string }[] {
  let labels: string[] = [];
  if (primary === 'Partner') labels = partnerLegendLabels(scope.partners);
  else if (primary === 'Location') labels = locationLegendLabels(scope, scope.partners);
  else if (primary === 'Specialty') labels = specialtyLegendLabels(scope.specialtyIds);
  else if (primary === 'Surgeon') labels = [...DEMO_ATTENDING_SURGEONS].slice(0, 6);
  if (labels.length === 0) {
    labels = QUALITY_NSQIP_SPECIALTIES.slice(0, 3).map((s) => s.label);
  }
  return labels.map((label, i) => ({
    label,
    dot: L3_LEGEND_DOT_CLASSES[i % L3_LEGEND_DOT_CLASSES.length]!,
    stroke: L3_LEGEND_STROKES[i % L3_LEGEND_STROKES.length]!,
  }));
}

function formatAvgLengthOfStayCell(n: number, valueIsPercent: boolean): string {
  if (valueIsPercent) return `${n.toFixed(1)}%`;
  return `${n.toFixed(1)} days`;
}

function losMetricFromRates(rate: number, prevRate: number, valueIsPercent: boolean): KpiL3TrendTableRow['losMetric'] {
  const text = valueIsPercent ? `${rate.toFixed(1)}%` : `${rate.toFixed(1)} days`;
  const d = rate - prevRate;
  if (Math.abs(d) < 0.04) return { trend: 'neutral', text };
  return d > 0 ? { trend: 'up', text } : { trend: 'down', text };
}

/** One canvas KPI tile placed on the dashboard — drives L3 left-rail list. */
export type KpiL3DashboardKpiRailItem = {
  sectionId: string;
  instanceId: string;
  label: string;
  /** Left-rail primary line; when set (e.g. `30d …`), preferred over `label` in the sidebar. */
  labelCompact?: string;
  /** Catalog line under the KPI title (e.g. "Quality · NSQIP"). */
  catalogEyebrow: string;
  valueDemo: string;
  valueUnit?: string;
};

export type KpiL3DetailModalProps = {
  open: boolean;
  onClose: () => void;
  displayLabel: string;
  displayLabelCompact?: string;
  catalogEyebrow: string;
  definition: string;
  valueDemo: string;
  valueUnit?: string;
  metricDeltaChip?: string;
  periodContextLabel: string;
  kpiTimelineValue: string;
  /** Editor header filters — drives L3 breakdown column order (mock rows v1). */
  dashboardScope: DashboardGlobalState;
  /** KPI canvas widgets on this dashboard (section order, then slot order). */
  dashboardKpiRail: readonly KpiL3DashboardKpiRailItem[];
  activeDashboardKpi: { sectionId: string; instanceId: string };
  onSelectDashboardKpi: (sectionId: string, instanceId: string) => void;
};

function useModalFocusTrap(active: boolean, rootRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    if (!active) return;
    const root = rootRef.current;
    if (!root) return;
    const prevActive = document.activeElement as HTMLElement | null;

    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const listFocusables = () =>
      [...root.querySelectorAll<HTMLElement>(selector)].filter(
        (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'),
      );

    const focusables = listFocusables();
    (focusables[0] ?? root).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !root) return;
      const nodes = listFocusables();
      if (nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      prevActive?.focus?.();
    };
  }, [active, rootRef]);
}

function KpiL3TableToolbar({
  recordTotal,
  pageStart,
  pageEnd,
  breakdownLead,
}: {
  recordTotal: number;
  pageStart: number;
  pageEnd: number;
  breakdownLead: string;
}) {
  return (
    <div className="flex w-full min-w-0 flex-row flex-nowrap items-center justify-between gap-3">
      <p className="min-w-0 truncate font-['Poppins',sans-serif] text-base font-semibold leading-normal text-[#333333]">
        <span>
          {breakdownLead} — {recordTotal.toLocaleString()}{' '}
        </span>
        <span className="font-['Poppins',sans-serif] font-normal text-[#707070]">Records</span>
      </p>
      <div className="flex shrink-0 flex-row flex-nowrap items-center gap-2">
        <button
          type="button"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-solid border-[#e8e8e8] bg-white text-[#333333] hover:bg-[#fafafa]"
          aria-label="Column visibility"
        >
          <IconLayoutGrid className="size-[18px]" aria-hidden />
        </button>
        <button
          type="button"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-solid border-[#e8e8e8] bg-white text-[#333333] hover:bg-[#fafafa]"
          aria-label="Download table"
        >
          <IconDownload className="size-[18px]" />
        </button>
        <button
          type="button"
          className="inline-flex h-8 shrink-0 items-center gap-2 rounded-xl border border-solid border-[#e8e8e8] bg-white px-3 font-['Inter',sans-serif] text-xs font-normal text-[#333333] hover:bg-[#fafafa]"
          aria-haspopup="listbox"
          aria-label="Rows per page"
        >
          10 Rows/Pg
          <IconChevronDown className="size-4 shrink-0 opacity-70" />
        </button>
        <div className="inline-flex h-8 shrink-0 items-center gap-0.5 rounded-xl border border-solid border-[#e8e8e8] bg-white px-1.5">
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-md text-[#333333] hover:bg-[rgb(30_30_31/0.06)]"
            aria-label="Previous page"
          >
            <IconChevronLeft className="size-4" />
          </button>
          <span className="min-w-[7.5rem] px-1 text-center font-['Inter',sans-serif] text-xs font-normal tabular-nums text-[#333333]">
            {pageStart}–{pageEnd} of {recordTotal.toLocaleString()}
          </span>
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-md text-[#333333] hover:bg-[rgb(30_30_31/0.06)]"
            aria-label="Next page"
          >
            <IconChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Full-viewport KPI detail (L3) — OBIS2.0 layout
 * ([1899:5341](https://www.figma.com/design/2Z3gqwUnoKnsm6U5aQ1Xp2/OBIS2.0?node-id=1899-5341)):
 * sidebar specialty list; main column with chart header (title + scope filters + close), grouped chart+metric card, table.
 */
export function KpiL3DetailModal({
  open,
  onClose,
  displayLabel,
  displayLabelCompact,
  catalogEyebrow,
  definition,
  valueDemo,
  valueUnit,
  metricDeltaChip,
  periodContextLabel,
  kpiTimelineValue,
  dashboardScope,
  dashboardKpiRail,
  activeDashboardKpi,
  onSelectDashboardKpi,
}: KpiL3DetailModalProps) {
  const headingId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [chartVariant, setChartVariant] = useState<'line' | 'bar'>('line');

  const partnersEditorKey = useMemo(() => dashboardScope.partners.join('\u0000'), [dashboardScope.partners]);
  const [l3ModalPartners, setL3ModalPartners] = useState<string[]>(() => [...dashboardScope.partners]);

  useEffect(() => {
    setL3ModalPartners([...dashboardScope.partners]);
  }, [partnersEditorKey, dashboardScope.partners]);

  const specialtyIdsEditorKey = useMemo(
    () => [...dashboardScope.specialtyIds].sort().join('\u0000'),
    [dashboardScope.specialtyIds],
  );
  const [l3ModalSpecialtyIds, setL3ModalSpecialtyIds] = useState<string[]>(() => [...dashboardScope.specialtyIds]);

  useEffect(() => {
    setL3ModalSpecialtyIds([...dashboardScope.specialtyIds]);
  }, [specialtyIdsEditorKey, dashboardScope.specialtyIds]);

  const l3DashboardScope = useMemo(
    (): DashboardGlobalState => ({
      ...dashboardScope,
      partners: l3ModalPartners,
      specialtyIds: l3ModalSpecialtyIds,
    }),
    [dashboardScope, l3ModalPartners, l3ModalSpecialtyIds],
  );

  const definitionTrimmed = definition.trim();
  const eyebrowShown = (catalogEyebrow || 'NSQIP').trim();

  const breakdownDimensions = useMemo(
    () => getL3BreakdownDimensions(l3DashboardScope),
    [l3DashboardScope],
  );
  const chartLegendPrimary = useMemo(
    () => chartLegendPrimaryDimension(l3DashboardScope),
    [l3DashboardScope],
  );
  const chartLegendChips = useMemo(
    () => chartLegendForPrimaryDimension(chartLegendPrimary, l3DashboardScope),
    [chartLegendPrimary, l3DashboardScope],
  );
  const trendColumns = useMemo(() => trendColumnsForBreakdown(breakdownDimensions), [breakdownDimensions]);
  const breakdownToolbarLead = useMemo(
    () => `Drilldown: ${breakdownDimensions.join(' → ')}`,
    [breakdownDimensions],
  );

  const scopePills = useMemo(() => {
    const p = l3ModalPartners;
    const partnerLabel =
      p.length === 0 ? 'All' : isAllPartnersSelected(p) ? 'All' : p.length === 1 ? p[0]! : `${p.length} partners`;
    const ids = l3ModalSpecialtyIds;
    const specialtyLabel =
      ids.length === 0 || ids.length >= DASHBOARD_NSQIP_SPECIALTY_COUNT
        ? 'All'
        : ids.length === 1
          ? QUALITY_NSQIP_SPECIALTIES.find((s) => s.id === ids[0])?.label ?? '1'
          : `${ids.length}+`;
    const locLabel =
      dashboardScope.locationLabels.length === 0
        ? 'All'
        : dashboardScope.locationLabels.join(', ');
    const timeLabel =
      kpiTimelineValue.trim().length > 0
        ? periodContextLabel.replace(/^As of\s+/i, '') || periodContextLabel
        : 'MoM';
    return [
      { id: 'partner' as const, label: 'Partner', value: partnerLabel },
      { id: 'specialty' as const, label: 'Specialty', value: specialtyLabel },
      { id: 'locations' as const, label: 'Locations', value: locLabel },
      { id: 'surgeons' as const, label: 'Surgeons', value: 'All' },
      { id: 'timeline' as const, label: 'Timeline', value: timeLabel },
    ];
  }, [l3ModalPartners, l3ModalSpecialtyIds, dashboardScope, kpiTimelineValue, periodContextLabel]);

  const resolvedPairs = useMemo(
    () => resolvePartnerLocations(l3ModalPartners, dashboardScope.locationLabels),
    [l3ModalPartners, dashboardScope.locationLabels],
  );

  const scopedSpecialtyLabel = useMemo(() => {
    if (l3ModalSpecialtyIds.length !== 1) return undefined;
    return QUALITY_NSQIP_SPECIALTIES.find((s) => s.id === l3ModalSpecialtyIds[0])?.label;
  }, [l3ModalSpecialtyIds]);

  const tableToolbarLead = useMemo(() => {
    if (!isSpecialtyNarrowed(l3ModalSpecialtyIds)) return 'All Specialities';
    const n = l3ModalSpecialtyIds.length;
    if (n === 1 && scopedSpecialtyLabel) return scopedSpecialtyLabel;
    if (n > 1) return `${n} specialities`;
    return breakdownToolbarLead.replace(/^Drilldown:\s*/, '') || 'Selected scope';
  }, [l3ModalSpecialtyIds, scopedSpecialtyLabel, breakdownToolbarLead]);

  const { value: valueDisplay, unit: unitDisplay } = useMemo(
    () => splitKpiValueAndUnit(valueDemo, valueUnit),
    [valueDemo, valueUnit],
  );

  const l3DemoSalt = useMemo(
    () => demoSaltFromModalScope(l3ModalPartners, l3ModalSpecialtyIds),
    [l3ModalPartners, l3ModalSpecialtyIds],
  );

  const trendTableSeries = useMemo(() => {
    const anchorParsed = parseFloat(String(valueDisplay).replace(/,/g, ''));
    const anchorRate = Number.isFinite(anchorParsed) ? anchorParsed : 2.1;
    const valueIsPercent = unitDisplay === '%' || valueDemo.trim().endsWith('%');
    return getKpiTrendSeriesFromTimeline(kpiTimelineValue, {
      anchorRate,
      valueIsPercent,
      demoSalt: l3DemoSalt,
    });
  }, [valueDemo, valueUnit, kpiTimelineValue, valueDisplay, l3DemoSalt]);

  const trendSeriesForL3Chart = useMemo(() => {
    const k = chartLegendChips.length;
    if (k <= 1) return trendTableSeries;
    const n = trendTableSeries.rates.length;
    const anchorParsed = parseFloat(String(valueDisplay).replace(/,/g, ''));
    const anchorRate = Number.isFinite(anchorParsed) ? anchorParsed : 2.1;
    const extras = buildAlignedExtraLineRates(n, anchorRate, l3DemoSalt, k - 1);
    return {
      ...trendTableSeries,
      extraLineRates: extras,
      lineStrokes: chartLegendChips.map((c) => c.stroke),
      lineLabels: chartLegendChips.map((c) => c.label),
    };
  }, [trendTableSeries, chartLegendChips, l3DemoSalt, valueDisplay]);

  const trendTableRows = useMemo((): KpiL3TrendTableRow[] => {
    const fallbackPartners =
      PARTNER_SCOPE_OPTIONS.length > 0 ? PARTNER_SCOPE_OPTIONS : (['Demo Partner'] as const);
    return trendTableSeries.xLabels.map((label, i) => {
      const { monthOfYear, year } = monthYearFromTrendXLabel(label);
      const rate = trendTableSeries.rates[i] ?? 0;
      const prevRate = i > 0 ? (trendTableSeries.rates[i - 1] ?? rate) : rate;
      const seed = Math.round(rate * 1000) + i * 7919;
      const lmrn = `LMRN-${String(1000000 + (seed % 8999999)).padStart(7, '0')}`;
      const pair =
        resolvedPairs.length > 0
          ? resolvedPairs[i % resolvedPairs.length]!
          : {
              partner: fallbackPartners[i % fallbackPartners.length]!,
              location: 'Main Campus',
            };
      return {
        lmrn,
        partnerScope: pair.partner,
        facilityLocation: pair.location,
        surgicalSpeciality:
          scopedSpecialtyLabel ?? DEMO_SURGICAL_SPECIALTIES[i % DEMO_SURGICAL_SPECIALTIES.length]!,
        attendingStaffSurgeon: DEMO_ATTENDING_SURGEONS[i % DEMO_ATTENDING_SURGEONS.length]!,
        monthOfYear,
        year,
        avgLengthOfStay: formatAvgLengthOfStayCell(rate, trendTableSeries.valueIsPercent),
        losMetric: losMetricFromRates(rate, prevRate, trendTableSeries.valueIsPercent),
      };
    });
  }, [trendTableSeries, resolvedPairs, scopedSpecialtyLabel]);

  const pageEnd = Math.min(20, trendTableRows.length);

  useModalFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!open) return null;

  const titleShown = displayLabelCompact ?? displayLabel;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="presentation"
    >
      <div
        className="absolute inset-0 z-0 cursor-pointer bg-[var(--color-ink)]/50"
        aria-hidden
        onClick={handleBackdropClick}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative z-10 flex w-full max-w-[min(1392px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[24px] bg-white shadow-[var(--shadow-panel)] max-lg:max-h-[min(96dvh,1040px)] max-lg:min-h-[min(520px,88dvh)] lg:h-[min(814px,calc(100dvh-3rem))] lg:max-h-[min(814px,calc(100dvh-3rem))] lg:min-h-[min(640px,calc(100dvh-3rem))] lg:flex-row"
      >
        {/* Left rail — Figma `sidebar` 316px, inset content x=8 */}
        <aside className="hidden shrink-0 border-b border-solid border-[#ebebeb] bg-white lg:flex lg:w-[316px] lg:flex-col lg:border-b-0 lg:border-r">
          <div className="pb-6 pl-6 pr-6 pt-6">
            <p className="font-['Poppins',sans-serif] text-[18px] font-semibold leading-snug tracking-tight text-[#333333]">
              Report name
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
            <ul className="flex list-none flex-col gap-2 p-0">
              {dashboardKpiRail.length === 0 ? (
                <li className="rounded-xl px-2 py-3 font-['Inter',sans-serif] text-[13px] leading-5 text-[#707070]">
                  No KPI metrics on this dashboard yet.
                </li>
              ) : (
                dashboardKpiRail.map((item, i) => {
                  const selected =
                    item.sectionId === activeDashboardKpi.sectionId &&
                    item.instanceId === activeDashboardKpi.instanceId;
                  const { value: rowValue, unit: rowUnit } = splitKpiValueAndUnit(item.valueDemo, item.valueUnit);
                  const rowParsed = parseFloat(String(rowValue).replace(/,/g, ''));
                  const rowMetricShown = Number.isFinite(rowParsed) ? rowParsed.toFixed(1) : rowValue;
                  const sparkVals = Array.from({ length: 6 }, (_, j) => {
                    const idx = (j + i * 2) % Math.max(1, trendTableSeries.rates.length);
                    return trendTableSeries.rates[idx] ?? 2 + i * 0.08;
                  });
                  return (
                    <li key={`${item.sectionId}-${item.instanceId}`}>
                      <button
                        type="button"
                        onClick={() => onSelectDashboardKpi(item.sectionId, item.instanceId)}
                        className={[
                          'flex min-h-[52px] w-full items-center gap-3 rounded-xl px-4 py-2 text-left transition-colors',
                          selected ? 'bg-[#f5f5f5]' : 'bg-white hover:bg-[#fafafa]',
                        ].join(' ')}
                      >
                        <div className="min-w-0 flex-1">
                          <span
                            className={[
                              "block min-w-0 truncate font-['Inter',sans-serif] text-[13px] leading-5 text-[#333333]",
                              selected ? 'font-medium' : 'font-normal',
                            ].join(' ')}
                          >
                            {item.labelCompact ?? item.label}
                          </span>
                          <span className="mt-0.5 block min-w-0 truncate font-['Inter',sans-serif] text-[10px] font-normal leading-[15px] text-[#707070]">
                            {(item.catalogEyebrow || '').trim() || eyebrowShown}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-baseline gap-0.5 tabular-nums">
                          <span
                            className={[
                              "font-['Inter',sans-serif] text-[13px] leading-5 text-[#333333]",
                              selected ? 'font-medium' : 'font-normal',
                            ].join(' ')}
                          >
                            {rowMetricShown}
                          </span>
                          {rowUnit ? (
                            <span
                              className={[
                                "font-['Inter',sans-serif] text-[13px] leading-5 text-[#333333]",
                                selected ? 'font-medium' : 'font-normal',
                              ].join(' ')}
                              aria-label={rowUnit}
                            >
                              {l3RailUnitDisplay(rowUnit)}
                            </span>
                          ) : null}
                        </div>
                        <L3MiniSparkline values={sparkVals} />
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </aside>

        {/* Main column — Figma `content area` (~1064px) */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-visible bg-white">
          {/* Title row spans full main column; chart + metric sit in one grouped panel below */}
          <header className="flex shrink-0 flex-col gap-3 border-b border-solid border-[#ebebeb] px-[24px] pb-4 pt-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="shrink-0">
              <h2
                id={headingId}
                className="whitespace-nowrap font-['Poppins',sans-serif] text-[24px] font-semibold leading-[28px] tracking-tight text-[#333333]"
              >
                {titleShown}
              </h2>
              <p className="mt-1 font-['Inter',sans-serif] text-xs font-normal leading-3 text-[#707070]">{eyebrowShown}</p>
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-start gap-2 sm:justify-end">
              {/* Same control as TopBar; scope is read from editor — Apply here does not persist (no-op handler). */}
              <PartnerScopePickerField
                layout="toolbar"
                label="Report scope"
                selectedPartners={l3ModalPartners}
                onPartnersChange={setL3ModalPartners}
                scopeChipTrigger
                chipLead={scopePills.find((pill) => pill.id === 'partner')?.label}
                chipValue={scopePills.find((pill) => pill.id === 'partner')?.value}
              />
              <SpecialityPickerField
                layout="toolbar"
                label="Speciality"
                selectedSpecialties={l3ModalSpecialtyIds}
                onSpecialitiesChange={setL3ModalSpecialtyIds}
                selectionMode={isMultiPartnerMode(l3ModalPartners) ? 'single' : 'multi'}
                scopeChipTrigger
                chipLead={scopePills.find((pill) => pill.id === 'specialty')?.label}
                chipValue={scopePills.find((pill) => pill.id === 'specialty')?.value}
              />
              {scopePills
                .filter((pill) => pill.id !== 'partner' && pill.id !== 'specialty')
                .map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    className="inline-flex h-8 max-w-[min(100%,11rem)] shrink-0 items-center gap-1 rounded-[12px] border border-solid border-[#e8e8e8] bg-white px-3 text-left transition-colors hover:bg-[#fafafa]"
                  >
                    <span className="min-w-0 truncate font-['Inter',sans-serif] text-[10px] leading-[15px] text-[#707070]">
                      <span className="text-[#707070]">{pill.label}:</span>{' '}
                      <span className="font-medium text-[#333333]">{pill.value}</span>
                    </span>
                    <IconChevronDown className="size-4 shrink-0 text-[#333333]/55" aria-hidden />
                  </button>
                ))}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-transparent text-[#333333] transition-colors hover:bg-[#f5f5f5]"
                aria-label="Close detail"
              >
                <IconClose className="size-[18px]" aria-hidden />
              </button>
            </div>
          </header>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-visible px-6 pb-5 pt-4">
            {/* White chart band + grey metric rail — avoid overflow-hidden so SVG strokes / axis labels are not clipped */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-visible rounded-xl lg:flex-row lg:items-stretch lg:gap-6">
              <div className="flex min-h-[min(280px,42dvh)] min-w-0 flex-1 flex-col gap-3 overflow-visible bg-white lg:min-h-0 lg:h-full">
                {/* Figma `chart legend container` 32px + chart; px-0 — outer chart wrapper supplies horizontal gutter */}
                <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 px-0 pb-2 pt-1" data-kpi-title-toggle>
                  <div className="flex min-h-8 shrink-0 flex-wrap items-start justify-between gap-2">
                    <div
                      className="flex min-w-0 flex-1 flex-wrap items-start gap-2"
                      aria-label={`Chart series by ${chartLegendPrimary ?? 'scope'}`}
                    >
                      {chartLegendChips.map((item, chipIdx) => (
                        <button
                          key={`${item.label}-${chipIdx}`}
                          type="button"
                          className="inline-flex h-6 max-w-full shrink-0 items-center gap-1.5 rounded-full border border-solid border-[#e8e8e8] bg-white py-0 pl-2.5 pr-1 font-['Inter',sans-serif] text-[11px] font-medium leading-3 text-[#333333]"
                        >
                          <span className={`size-2 shrink-0 rounded-full ${item.dot}`} aria-hidden />
                          <span className="max-w-[6.5rem] truncate">{item.label}</span>
                          <span
                            className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[12px] leading-none text-[#707070] hover:bg-[#f0f0f0]"
                            aria-hidden
                          >
                            ×
                          </span>
                        </button>
                      ))}
                    </div>
                    <ToggleGroup
                      aria-label="KPI chart view"
                      variant="kpiTitle"
                      value={chartVariant}
                      onValueChange={setChartVariant}
                      className="shrink-0"
                      segments={[
                        { value: 'line' as const, label: 'Line chart', icon: <IconChartLine className="shrink-0" aria-hidden /> },
                        { value: 'bar' as const, label: 'Bar chart', icon: <IconChartBar className="shrink-0" aria-hidden /> },
                      ]}
                    />
                  </div>
                  <div
                    className="flex min-h-0 min-w-0 flex-1 overflow-visible"
                    data-kpi-expand-skip-interaction
                  >
                    <KpiTitleTrendChart
                      series={trendSeriesForL3Chart}
                      variant={chartVariant}
                      presentation="l3"
                      className="h-full min-h-0 max-h-full w-full min-w-0 flex-1"
                      yAxisTitle={
                        trendTableSeries.valueIsPercent ? `${displayLabel} (%)` : `${displayLabel} (Days)`
                      }
                    />
                  </div>
                </div>
              </div>

              <aside className="box-border flex w-full shrink-0 flex-col overflow-hidden rounded-[16px] bg-[#f5f5f5] lg:h-full lg:w-[240px]">
                <div className="flex min-h-0 flex-1 flex-col p-6">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-end gap-1">
                      <span className="font-['Poppins',sans-serif] text-[1.75rem] font-semibold leading-none tracking-tight text-[#333333] tabular-nums sm:text-[30px]">
                        {valueDisplay}
                      </span>
                      {unitDisplay ? (
                        <span className="font-['Poppins',sans-serif] pb-0.5 text-sm font-normal leading-none text-[#333333]/70">
                          {unitDisplay}
                        </span>
                      ) : null}
                    </div>
                    {metricDeltaChip ? (
                      <div className="inline-flex h-6 shrink-0 items-center justify-center rounded-md bg-[#ffe0e0] px-2">
                        <span className="font-['Inter',sans-serif] text-[10px] font-semibold leading-none text-[#db4949]">
                          {metricDeltaChip}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-2 font-['Inter',sans-serif] text-[10px] font-medium leading-3 text-[#707070]">
                    {periodContextLabel}
                  </p>
                  <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
                    <p className="font-['Inter',sans-serif] text-[13px] font-normal leading-snug tracking-tight text-[#333333] break-words">
                      {definitionTrimmed ||
                        'This metric measures the average number of days patients stay in the hospital after surgery, reflecting recovery speed and efficiency. Lower values are preferred, typically ~2–4 days depending on procedure.'}
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          <div
            className="flex min-h-0 min-w-0 max-h-[min(360px,46dvh)] shrink-0 flex-col gap-3 overflow-hidden px-[24px] pb-6 pt-5"
            data-kpi-l3-trend-table
          >
            <KpiL3TableToolbar
              recordTotal={DEMO_RECORD_TOTAL}
              pageStart={1}
              pageEnd={pageEnd}
              breakdownLead={tableToolbarLead}
            />
            <KpiL3TrendTable
              caption={`${displayLabel} detail rows for the selected timeline`}
              rows={trendTableRows}
              columns={trendColumns}
              visualVariant="figma"
              scrollAreaClassName="max-h-[min(240px,32dvh)]"
              className="min-h-0 flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
