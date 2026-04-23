import type { DraggableAttributes } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import { IconClose, IconDrag, IconEdit } from '../Icons';

/** Opacity only on the shell — pointer events stay on the toolbar row so the L2 title toggle stays clickable. */
export const CANVAS_WIDGET_OVERLAY_STRIP =
  'pointer-events-none absolute left-0 right-0 top-0 z-20 opacity-0 transition-opacity duration-200 ease-out motion-reduce:transition-none max-sm:opacity-100 sm:group-hover/widget:opacity-100 sm:group-focus-within/widget:opacity-100 group-has-[[data-kpi-title-toggle]:hover]/widget:opacity-0 group-has-[[data-kpi-title-toggle]:hover]/widget:pointer-events-none';

/** Drag / edit / remove — only this row captures hovers (not the full strip width), so the chart toggle is not blocked. */
const CANVAS_WIDGET_OVERLAY_TOOLBAR =
  'relative z-[1] flex flex-row items-center justify-between gap-2 pointer-events-auto max-sm:pointer-events-auto sm:group-hover/widget:pointer-events-auto sm:group-focus-within/widget:pointer-events-auto group-has-[[data-kpi-title-toggle]:hover]/widget:pointer-events-none';

const OVERLAY_TOOL_BTN =
  'inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md bg-white text-[#4a4a4c] active:cursor-grabbing';

/** 5px inner stroke (white) + 16px corners; used by L1 footer and L2 definition rail. */
export const KPI_DEFINITION_FOOTER_SURFACE =
  'overflow-hidden rounded-[16px] bg-[#f5f5f5] shadow-[inset_0_0_0_5px_rgb(255_255_255/1)]';

/** Six-point KPI sparkline — wide shallow plot, proportional stroke (Figma 716:4264). */
function KpiMetricSparkline() {
  const vb = { w: 100, h: 40 };
  const pad = { x: 6, y: 7 };
  const inner = { w: vb.w - 2 * pad.x, h: vb.h - 2 * pad.y };
  /** Normalized level 0 = chart bottom, 1 = chart top (six samples, left → right). */
  const levels = [0.18, 0.22, 0.88, 0.48, 0.35, 0.95] as const;
  const points = levels
    .map((t, i) => {
      const x = pad.x + (inner.w * i) / (levels.length - 1);
      const y = pad.y + (1 - t) * inner.h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      className="pointer-events-none block h-[22px] w-[55px] shrink-0 drop-shadow-[0_1px_2px_rgba(249,108,80,0.32)] sm:h-6 sm:w-[60px]"
      viewBox={`0 0 ${vb.w} ${vb.h}`}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Trend"
    >
      <title>Trend</title>
      <polyline
        points={points}
        stroke="#f96c50"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Delta / trend chip after KPI unit — Figma 716:4262. */
function KpiMetricDeltaChip({ children }: { children: string }) {
  return (
    <span
      className="inline-flex h-[24px] min-h-[24px] shrink-0 items-center justify-center rounded-[8px] bg-[#ffe0e0] px-2 font-['Inter',sans-serif] text-[10px] font-semibold leading-none text-[#db4949] whitespace-nowrap"
      aria-hidden
    >
      {children}
    </span>
  );
}

/** Letter-based units (e.g. `days`) stay at 16px; symbols and mixed glyphs use 20px next to the headline value. */
function isKpiUnitWordOnly(unit: string | undefined): boolean {
  if (unit == null || unit.trim() === '') return false;
  const s = unit.trim();
  return /^[\p{L}\s-]+$/u.test(s) && /\p{L}/u.test(s);
}

/**
 * When no explicit `kpiDemoUnit`, treat a trailing `%` as the unit so the glyph sits in the secondary column
 * instead of the large metric type.
 */
function splitKpiValueAndUnit(valueDemo: string, valueUnit?: string): { value: string; unit?: string } {
  const explicit = valueUnit?.trim();
  if (explicit) return { value: valueDemo, unit: explicit };

  const trimmed = valueDemo.trimEnd();
  if (trimmed.endsWith('%')) {
    const base = trimmed.slice(0, -1).trimEnd();
    if (base.length > 0) return { value: base, unit: '%' };
  }
  return { value: valueDemo };
}

/** KPI title: full label when the widget is wide enough and viewport is `sm+`; compact on small screens or narrow slots. */
function KpiTileHeading({ displayLabel, displayLabelCompact }: { displayLabel: string; displayLabelCompact?: string }) {
  const h2Class =
    "line-clamp-1 font-['Inter',sans-serif] text-[18px] font-semibold leading-snug text-[var(--color-grey-darkest)]";
  if (!displayLabelCompact) {
    return <h2 className={h2Class}>{displayLabel}</h2>;
  }
  return (
    <h2 className={h2Class}>
      <span className="max-sm:inline sm:hidden @max-[22rem]/kpi:sm:inline @min-[22rem]/kpi:sm:hidden">{displayLabelCompact}</span>
      <span className="hidden max-sm:hidden sm:hidden @min-[22rem]/kpi:sm:inline">{displayLabel}</span>
    </h2>
  );
}

type MetricColumnProps = {
  displayLabel: string;
  displayLabelCompact?: string;
  catalogEyebrow: string;
  valueDemo: string;
  /** Second column in the metric row (Figma 716:4258); omitted for a single-line value with no unit. */
  valueUnit?: string;
  /** Shown after `valueUnit` when both unit and headline row are used (Figma 716:4262). */
  metricDeltaChip?: string;
  /** Trend sparkline to the right of metric value + period line (Figma 716:4264); canvas enables this for L1 only. */
  metricSparkline?: boolean;
  periodContextLabel: string;
  /** Extra classes on the outer column wrapper (padding, flex growth). */
  className?: string;
  /** L2 wide: only title + eyebrow (value + period render in the definition rail). */
  titlesOnly?: boolean;
  /** L2 wide: only value row + period/sparkline (top of definition rail). */
  valuesOnly?: boolean;
  /** L2: trailing control on the title row (e.g. layout toggle). */
  titleRowEnd?: ReactNode;
};

export function CanvasWidgetKpiMetricColumn({
  displayLabel,
  displayLabelCompact,
  catalogEyebrow,
  valueDemo,
  valueUnit,
  metricDeltaChip,
  metricSparkline,
  periodContextLabel,
  className,
  titlesOnly,
  valuesOnly,
  titleRowEnd,
}: MetricColumnProps) {
  const { value: valueDisplay, unit: unitDisplay } = splitKpiValueAndUnit(valueDemo, valueUnit);
  const hasUnit = unitDisplay != null && unitDisplay !== '';

  if (titlesOnly) {
    return (
      <div className={['relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden', className].filter(Boolean).join(' ')}>
        <div className="shrink-0">
          {titleRowEnd != null ? (
            <div className="flex min-w-0 flex-row flex-nowrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-col">
                <KpiTileHeading displayLabel={displayLabel} displayLabelCompact={displayLabelCompact} />
                <p className="mt-1 line-clamp-1 font-['Inter',sans-serif] text-[13px] font-normal leading-snug text-[#707070]">
                  {catalogEyebrow}
                </p>
              </div>
              <div className="shrink-0" data-kpi-title-toggle>
                {titleRowEnd}
              </div>
            </div>
          ) : (
            <>
              <KpiTileHeading displayLabel={displayLabel} displayLabelCompact={displayLabelCompact} />
              <p className="mt-1 line-clamp-1 font-['Inter',sans-serif] text-[13px] font-normal leading-snug text-[#707070]">
                {catalogEyebrow}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const valueSpan = (
    <span className="shrink-0 font-['Inter',sans-serif] text-[32px] font-semibold leading-none tracking-[-0.02em] text-[var(--color-ink)] tabular-nums">
      {valueDisplay}
    </span>
  );
  const unitSpan = (
    <span
      className={[
        "min-w-0 shrink-0 whitespace-nowrap font-['Inter',sans-serif]",
        isKpiUnitWordOnly(unitDisplay) ? 'text-[16px]' : 'text-[20px]',
        'leading-none [font-weight:400] text-[rgba(0,0,0,0.7)]',
      ].join(' ')}
    >
      {unitDisplay}
    </span>
  );

  const valueOnlyLarge = (
    <p className="font-['Inter',sans-serif] text-[2.5rem] font-semibold leading-none tracking-[-0.02em] text-[var(--color-ink)] tabular-nums">
      {valueDisplay}
    </p>
  );

  /** L2 definition rail: chip at trailing (top-right) edge of the rail, same row as the headline metric. */
  const l2RailChipTrailing = Boolean(valuesOnly && metricDeltaChip);
  const deltaChipEl = metricDeltaChip ? <KpiMetricDeltaChip>{metricDeltaChip}</KpiMetricDeltaChip> : null;

  const metricRow = hasUnit ? (
    deltaChipEl ? (
      l2RailChipTrailing ? (
        <div className="flex min-h-0 min-w-0 w-full max-w-full flex-row flex-nowrap items-center justify-between gap-2">
          <div className="flex min-h-0 min-w-0 flex-1 flex-row flex-nowrap items-baseline gap-[5px] overflow-hidden whitespace-nowrap">
            {valueSpan}
            {unitSpan}
          </div>
          <div className="shrink-0">{deltaChipEl}</div>
        </div>
      ) : (
        <div className="flex min-w-0 flex-row flex-nowrap items-center gap-2 whitespace-nowrap">
          <div className="flex min-w-0 flex-row flex-nowrap items-baseline gap-[5px]">
            {valueSpan}
            {unitSpan}
          </div>
          {deltaChipEl}
        </div>
      )
    ) : (
      <div className="flex min-w-0 flex-row flex-nowrap items-baseline gap-[5px] whitespace-nowrap">
        {valueSpan}
        {unitSpan}
      </div>
    )
  ) : deltaChipEl ? (
    l2RailChipTrailing ? (
      <div className="flex min-h-0 min-w-0 w-full max-w-full flex-row flex-nowrap items-center justify-between gap-2">
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{valueOnlyLarge}</div>
        <div className="shrink-0">{deltaChipEl}</div>
      </div>
    ) : (
      <div className="flex min-w-0 flex-row flex-nowrap items-center gap-2 whitespace-nowrap">
        {valueOnlyLarge}
        {deltaChipEl}
      </div>
    )
  ) : (
    valueOnlyLarge
  );

  const valueSection = (railTop: boolean) =>
    metricSparkline ? (
      <div
        className={
          railTop
            ? 'flex min-h-0 min-w-0 w-full max-w-full flex-col justify-start pt-0'
            : 'flex min-h-0 min-w-0 flex-1 flex-col justify-end pt-4'
        }
      >
        <div className="flex min-h-0 w-full min-w-0 flex-row flex-nowrap items-end justify-between gap-2">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1">
            {metricRow}
            <p className="min-w-0 font-['Inter',sans-serif] text-xs font-normal leading-snug text-[#707070]">
              {periodContextLabel}
            </p>
          </div>
          <div className="shrink-0 pb-px">
            <KpiMetricSparkline />
          </div>
        </div>
      </div>
    ) : (
      <div
        className={
          railTop
            ? 'flex min-h-0 w-full max-w-full flex-col justify-start gap-1 pt-0'
            : 'flex min-h-0 flex-1 flex-col justify-end gap-1 pt-4'
        }
      >
        {metricRow}
        <p className="font-['Inter',sans-serif] text-xs font-normal leading-snug text-[#707070]">{periodContextLabel}</p>
      </div>
    );

  const valueStack = valueSection(false);

  if (valuesOnly) {
    return (
      <div className={['relative z-0 flex min-h-0 min-w-0 flex-col overflow-hidden', className].filter(Boolean).join(' ')}>
        {valueSection(true)}
      </div>
    );
  }

  return (
    <div className={['relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden', className].filter(Boolean).join(' ')}>
      <div className="shrink-0">
        {titleRowEnd != null ? (
          <div className="flex min-w-0 flex-row flex-nowrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col">
              <KpiTileHeading displayLabel={displayLabel} displayLabelCompact={displayLabelCompact} />
              <p className="mt-1 line-clamp-1 font-['Inter',sans-serif] text-[13px] font-normal leading-snug text-[#707070]">
                {catalogEyebrow}
              </p>
            </div>
            <div className="shrink-0" data-kpi-title-toggle>
              {titleRowEnd}
            </div>
          </div>
        ) : (
          <>
            <KpiTileHeading displayLabel={displayLabel} displayLabelCompact={displayLabelCompact} />
            <p className="mt-1 line-clamp-1 font-['Inter',sans-serif] text-[13px] font-normal leading-snug text-[#707070]">
              {catalogEyebrow}
            </p>
          </>
        )}
      </div>
      {valueStack}
    </div>
  );
}

type OverlayProps = {
  displayLabel: string;
  attributes: DraggableAttributes;
  listeners: Record<string, unknown> | undefined;
  onChangeClick: (e: React.MouseEvent) => void;
  onRemoveClick: () => void;
};

export function CanvasWidgetKpiOverlayChrome({
  displayLabel,
  attributes,
  listeners,
  onChangeClick,
  onRemoveClick,
}: OverlayProps) {
  return (
    <div className={CANVAS_WIDGET_OVERLAY_STRIP}>
      <div className="relative px-2.5 pb-2 pt-2">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white to-white/70"
          aria-hidden
        />
        <div className={CANVAS_WIDGET_OVERLAY_TOOLBAR}>
          <button
            type="button"
            className={[OVERLAY_TOOL_BTN, 'touch-none text-[#1e1e1f]/45'].join(' ')}
            {...listeners}
            {...attributes}
            aria-label={`Reorder ${displayLabel}`}
          >
            <IconDrag className="block size-[18px] shrink-0" aria-hidden />
          </button>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onChangeClick}
              className={OVERLAY_TOOL_BTN}
              aria-label={`Change ${displayLabel}`}
              title={`Change ${displayLabel}`}
            >
              <IconEdit className="block size-[18px] shrink-0" aria-hidden />
            </button>
            <button
              type="button"
              onClick={onRemoveClick}
              className={OVERLAY_TOOL_BTN}
              aria-label={`Clear ${displayLabel}`}
              title={`Clear ${displayLabel}`}
            >
              <IconClose className="block size-[18px] shrink-0" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
