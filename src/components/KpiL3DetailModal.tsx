import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { getKpiTrendSeriesFromTimeline, monthYearFromTrendXLabel } from '../data/kpiTrendSeriesFromTimeline';
import {
  IconChartBar,
  IconChartLine,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
} from './Icons';
import { KpiL3TrendTable, type KpiL3TrendTableColumnKey, type KpiL3TrendTableRow } from './KpiL3TrendTable';
import type { DashboardGlobalState } from '../types';
import { getL3BreakdownDimensions, resolvePartnerLocations, type L3BreakdownDimension } from '../dashboardScope';
import { PARTNER_SCOPE_OPTIONS } from '../data/headerSelectOptions';
import { QUALITY_NSQIP_SPECIALTIES } from '../data/widgets';
import { KpiTitleTrendChart } from './canvas/KpiTitleTrendChart';
import { splitKpiValueAndUnit } from './canvas/canvasWidgetKpiParts';
import { ToggleGroup } from './ToggleGroup';

/** Demo total aligned to OBIS2.0 L3 Figma ([394:2214](https://www.figma.com/design/2Z3gqwUnoKnsm6U5aQ1Xp2/OBIS2.0?node-id=394-2214)). */
const DEMO_RECORD_TOTAL = 2518;

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

const L3_CHART_LEGEND = [
  { label: 'Plastics', dot: 'bg-[#e85d9a]' },
  { label: 'General', dot: 'bg-[#f96c50]' },
  { label: 'Neurosurgery', dot: 'bg-[#e6332a]' },
  { label: 'Orthopedics', dot: 'bg-[#9ca3af]' },
] as const;

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
 * Full-viewport KPI detail (L3) — OBIS2.0 layout from Figma
 * ([394:2183](https://www.figma.com/design/2Z3gqwUnoKnsm6U5aQ1Xp2/OBIS2.0?node-id=394-2183)):
 * header + filters + legend + chart, metric rail, then table toolbar + grid.
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
}: KpiL3DetailModalProps) {
  const headingId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [chartVariant, setChartVariant] = useState<'line' | 'bar'>('line');

  const definitionTrimmed = definition.trim();
  const eyebrowShown = (catalogEyebrow || 'NSQIP').trim();

  const breakdownDimensions = useMemo(
    () => getL3BreakdownDimensions(dashboardScope),
    [dashboardScope],
  );
  const trendColumns = useMemo(() => trendColumnsForBreakdown(breakdownDimensions), [breakdownDimensions]);
  const breakdownToolbarLead = useMemo(
    () => `Drilldown: ${breakdownDimensions.join(' → ')}`,
    [breakdownDimensions],
  );

  const resolvedPairs = useMemo(
    () => resolvePartnerLocations(dashboardScope.partners, dashboardScope.locationLabels),
    [dashboardScope.partners, dashboardScope.locationLabels],
  );

  const scopedSpecialtyLabel = useMemo(() => {
    if (dashboardScope.specialtyIds.length !== 1) return undefined;
    return QUALITY_NSQIP_SPECIALTIES.find((s) => s.id === dashboardScope.specialtyIds[0])?.label;
  }, [dashboardScope.specialtyIds]);

  const { value: valueDisplay, unit: unitDisplay } = useMemo(
    () => splitKpiValueAndUnit(valueDemo, valueUnit),
    [valueDemo, valueUnit],
  );

  const trendTableSeries = useMemo(() => {
    const anchorParsed = parseFloat(String(valueDisplay).replace(/,/g, ''));
    const anchorRate = Number.isFinite(anchorParsed) ? anchorParsed : 2.1;
    const valueIsPercent = unitDisplay === '%' || valueDemo.trim().endsWith('%');
    return getKpiTrendSeriesFromTimeline(kpiTimelineValue, { anchorRate, valueIsPercent });
  }, [valueDemo, valueUnit, kpiTimelineValue, valueDisplay]);

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
        className="relative z-10 flex min-h-[min(480px,78dvh)] max-h-[min(96dvh,1040px)] w-full max-w-7xl flex-col overflow-hidden rounded-[24px] bg-white shadow-[var(--shadow-panel)]"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 w-full min-w-0 shrink-0 flex-col border-b border-solid border-[#ebebeb] sm:min-h-[min(480px,54dvh)] sm:flex-row">
            <div className="flex min-h-[min(260px,42dvh)] min-w-0 flex-1 flex-col gap-3.5 overflow-hidden p-6 sm:min-h-0 sm:p-[30px]">
              <header className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h2
                    id={headingId}
                    className="font-['Poppins',sans-serif] text-2xl font-semibold leading-normal text-[#333333]"
                  >
                    {titleShown}
                  </h2>
                  <div className="mt-1 inline-flex items-center rounded-md bg-white px-1 py-0.5">
                    <span className="font-['Inter',sans-serif] text-[10px] font-medium leading-3 text-[#707070]">
                      {eyebrowShown}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-row flex-wrap items-center gap-2.5" data-kpi-title-toggle>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2.5 rounded-xl border border-solid border-[#e8e8e8] bg-white px-3 py-2 font-['Inter',sans-serif] text-xs text-[#333333] hover:bg-[#fafafa]"
                    aria-haspopup="listbox"
                    aria-label="Filter by Speciality"
                  >
                    <span className="whitespace-nowrap">
                      <span className="font-normal">Speciality: </span>
                      <span className="font-medium">All</span>
                    </span>
                    <IconChevronDown className="size-4 shrink-0 opacity-80" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2.5 rounded-xl border border-solid border-[#e8e8e8] bg-white px-3 py-2 font-['Inter',sans-serif] text-xs text-[#333333] hover:bg-[#fafafa]"
                    aria-haspopup="listbox"
                    aria-label="Filter by surgeons"
                  >
                    <span className="whitespace-nowrap">
                      <span className="font-normal">Surgeons: </span>
                      <span className="font-medium">All</span>
                    </span>
                    <IconChevronDown className="size-4 shrink-0 opacity-80" />
                  </button>
                  <ToggleGroup
                    aria-label="KPI chart view"
                    variant="kpiTitle"
                    value={chartVariant}
                    onValueChange={setChartVariant}
                    segments={[
                      { value: 'line' as const, label: 'Line chart', icon: <IconChartLine className="shrink-0" aria-hidden /> },
                      { value: 'bar' as const, label: 'Bar chart', icon: <IconChartBar className="shrink-0" aria-hidden /> },
                    ]}
                  />
                </div>
              </header>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
                <div className="flex shrink-0 flex-row flex-wrap items-center justify-end gap-2 font-['Inter',sans-serif] text-[11px] font-normal leading-3 tracking-tight text-[#777777]">
                  {L3_CHART_LEGEND.map((item) => (
                    <span key={item.label} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <span className={`size-2 shrink-0 rounded-full ${item.dot}`} aria-hidden />
                      {item.label}
                    </span>
                  ))}
                </div>
                <div className="min-h-[min(200px,32dvh)] min-w-0 flex-1 sm:min-h-0" data-kpi-expand-skip-interaction>
                  <KpiTitleTrendChart
                    series={trendTableSeries}
                    variant={chartVariant}
                    presentation="l3"
                    className="min-h-0 w-full min-w-0 flex-1"
                    yAxisTitle={trendTableSeries.valueIsPercent ? `${displayLabel} (%)` : 'Days'}
                  />
                </div>
              </div>
            </div>

            <aside className="box-border flex w-full min-w-0 shrink-0 flex-col border-t border-solid border-[#ebebeb] p-3.5 sm:w-[300px] sm:border-l sm:border-t-0 sm:border-[#ebebeb]">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-[#f5f5f5] sm:rounded-2xl">
                <div className="flex min-h-0 flex-1 flex-col justify-between gap-6 px-6 py-6 sm:px-[30px] sm:py-6">
                  <div className="shrink-0">
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-end gap-1.5">
                        <span className="font-['Poppins',sans-serif] text-[2rem] font-semibold leading-none tracking-tight text-[#333333] tabular-nums sm:text-[32px]">
                          {valueDisplay}
                        </span>
                        {unitDisplay ? (
                          <span className="font-['Poppins',sans-serif] pb-0.5 text-base font-normal leading-none text-[#333333]/70">
                            {unitDisplay}
                          </span>
                        ) : null}
                      </div>
                      {metricDeltaChip ? (
                        <div className="inline-flex h-6 shrink-0 items-center justify-center rounded-lg bg-[#ffe0e0] px-2">
                          <span className="font-['Inter',sans-serif] text-[10px] font-semibold leading-none text-[#db4949]">
                            {metricDeltaChip}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-2 font-['Inter',sans-serif] text-[10px] font-medium leading-3 text-[#707070]">
                      {periodContextLabel}
                    </p>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <p className="font-['Inter',sans-serif] text-base font-normal leading-[23px] tracking-tight text-[#333333] break-words">
                      {definitionTrimmed ||
                        'This metric measures the average number of days patients stay in the hospital after surgery, reflecting recovery speed and efficiency. Lower values are preferred, typically ~2–4 days depending on procedure.'}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div
            className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 px-6 pb-6 pt-4 sm:px-8 sm:pb-8 sm:pt-3"
            data-kpi-l3-trend-table
          >
            <KpiL3TableToolbar
              recordTotal={DEMO_RECORD_TOTAL}
              pageStart={1}
              pageEnd={pageEnd}
              breakdownLead={breakdownToolbarLead}
            />
            <KpiL3TrendTable
              caption={`${displayLabel} detail rows for the selected timeline`}
              rows={trendTableRows}
              columns={trendColumns}
              visualVariant="figma"
              scrollAreaClassName="max-h-[min(240px,30dvh)]"
              className="min-h-0 flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
