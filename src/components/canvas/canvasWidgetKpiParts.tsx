import type { DraggableAttributes } from '@dnd-kit/core';
import { IconClose, IconDrag, IconEdit } from '../Icons';

export const CANVAS_WIDGET_OVERLAY_STRIP =
  'pointer-events-none absolute left-0 right-0 top-0 z-20 opacity-0 transition-opacity duration-200 ease-out motion-reduce:transition-none max-sm:pointer-events-auto max-sm:opacity-100 sm:group-hover/widget:pointer-events-auto sm:group-hover/widget:opacity-100 sm:group-focus-within/widget:pointer-events-auto sm:group-focus-within/widget:opacity-100';

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

/** KPI title: full label when the widget is wide enough and viewport is `sm+`; compact on small screens or narrow slots. */
function KpiTileHeading({ displayLabel, displayLabelCompact }: { displayLabel: string; displayLabelCompact?: string }) {
  const h2Class =
    "line-clamp-2 font-['Inter',sans-serif] text-[18px] font-semibold leading-snug text-[var(--color-grey-darkest)]";
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
  /** Second column in the metric row (Figma 716:4258); omitted for a single-line value (e.g. em dash). */
  valueUnit?: string;
  /** Shown after `valueUnit` when both unit and headline row are used (Figma 716:4262). */
  metricDeltaChip?: string;
  /** Trend sparkline to the right of metric value + period line (Figma 716:4264). */
  metricSparkline?: boolean;
  periodContextLabel: string;
  /** Extra classes on the outer column wrapper (padding, flex growth). */
  className?: string;
  /** L2 wide: only title + eyebrow (value + period render in the definition rail). */
  titlesOnly?: boolean;
  /** L2 wide: only value row + period/sparkline (top of definition rail). */
  valuesOnly?: boolean;
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
}: MetricColumnProps) {
  if (titlesOnly) {
    return (
      <div className={['relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden', className].filter(Boolean).join(' ')}>
        <div className="shrink-0">
          <KpiTileHeading displayLabel={displayLabel} displayLabelCompact={displayLabelCompact} />
          <p className="mt-1 line-clamp-2 font-['Inter',sans-serif] text-[13px] font-normal leading-snug text-[#707070]">
            {catalogEyebrow}
          </p>
        </div>
      </div>
    );
  }

  const valueSpan = (
    <span className="shrink-0 font-['Inter',sans-serif] text-[32px] font-semibold leading-none tracking-[-0.02em] text-[var(--color-ink)] tabular-nums">
      {valueDemo}
    </span>
  );
  const unitSpan = (
    <span className="min-w-0 shrink-0 whitespace-nowrap font-['Inter',sans-serif] text-[16px] leading-none [font-weight:400] text-[rgba(0,0,0,0.7)]">
      {valueUnit}
    </span>
  );

  const metricRow =
    valueUnit != null && valueUnit !== '' ? (
      metricDeltaChip ? (
        <div className="flex min-w-0 flex-row flex-nowrap items-center gap-2 whitespace-nowrap">
          <div className="flex min-w-0 flex-row flex-nowrap items-baseline gap-[5px]">
            {valueSpan}
            {unitSpan}
          </div>
          <KpiMetricDeltaChip>{metricDeltaChip}</KpiMetricDeltaChip>
        </div>
      ) : (
        <div className="flex min-w-0 flex-row flex-nowrap items-baseline gap-[5px] whitespace-nowrap">
          {valueSpan}
          {unitSpan}
        </div>
      )
    ) : (
      <p className="font-['Inter',sans-serif] text-[2.5rem] font-semibold leading-none tracking-[-0.02em] text-[var(--color-ink)] tabular-nums">
        {valueDemo}
      </p>
    );

  const valueSection = (railTop: boolean) =>
    metricSparkline ? (
      <div
        className={
          railTop
            ? 'flex min-h-0 min-w-0 flex-col justify-start gap-0 pt-0'
            : 'flex min-h-0 min-w-0 flex-1 flex-col justify-end pt-4'
        }
      >
        {metricRow}
        <div className="mt-px flex min-w-0 flex-row flex-nowrap items-end justify-between gap-2">
          <p className="min-w-0 flex-1 font-['Inter',sans-serif] text-xs font-normal leading-snug text-[#707070]">
            {periodContextLabel}
          </p>
          <div className="shrink-0 pb-px">
            <KpiMetricSparkline />
          </div>
        </div>
      </div>
    ) : (
      <div
        className={
          railTop ? 'flex min-h-0 flex-col justify-start gap-0 pt-0' : 'flex min-h-0 flex-1 flex-col justify-end pt-4'
        }
      >
        {metricRow}
        <p className="mt-px font-['Inter',sans-serif] text-xs font-normal leading-snug text-[#707070]">{periodContextLabel}</p>
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
        <KpiTileHeading displayLabel={displayLabel} displayLabelCompact={displayLabelCompact} />
        <p className="mt-1 line-clamp-2 font-['Inter',sans-serif] text-[13px] font-normal leading-snug text-[#707070]">
          {catalogEyebrow}
        </p>
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
        <div className="relative z-[1] flex flex-row items-center justify-between gap-2">
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
