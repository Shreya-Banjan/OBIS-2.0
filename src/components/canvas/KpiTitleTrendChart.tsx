import { useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { KpiTrendSeries } from '../../data/kpiTrendSeriesFromTimeline';

type KpiTitleTrendChartProps = {
  series: KpiTrendSeries;
  variant?: 'line' | 'bar';
  className?: string;
  /** Overrides `series.yAxisTitle`; default depends on `valueIsPercent`. */
  yAxisTitle?: string;
  /** When true, skip the lowest horizontal grid line (avoids a hard rule above a stacked L3 detail table). */
  omitBottomGridLine?: boolean;
  /**
   * `l3` — OBIS2.0 L3 modal chart ([Figma 394:2183](https://www.figma.com/design/2Z3gqwUnoKnsm6U5aQ1Xp2/OBIS2.0?node-id=394-2183)): dashed grid,
   * green goal band (days), dark series stroke, muted axis typography.
   */
  presentation?: 'canvas' | 'l3';
};

/** Wide coordinate width; height is synced to the flex slot via ResizeObserver so `meet` fills the frame vertically. */
const VB_W = 560;
const VB_H_FALLBACK = 132;
const INSET = { t: 12, b: 36 };
/** Small pad at the viewBox right so strokes are not clipped; plot / grid / series share this edge. */
const PLOT_INSET_R = 10;
/** Left padding before the Y-axis title band. */
const Y_LABEL_X = 4;
/** Horizontal space for the vertical Y-axis title (viewBox units); tick values start to its right. */
const Y_AXIS_TITLE_BAND = 18;
/** X position of Y tick value text (`start` anchor). */
const Y_TICK_TEXT_X = Y_LABEL_X + Y_AXIS_TITLE_BAND;
/** Extra viewBox units between the widest Y label and the plot / horizontal grid lines. */
const Y_LABEL_TO_GRID_GAP = 5;
/** Minimum viewBox units from chart left edge to Y tick column start (`Y_TICK_TEXT_X`); keeps labels off the grid. */
const Y_TICK_TO_PLOT_MIN_PAD = 20;
/** Target on-screen size (CSS px) for axis tick labels and Y-axis title after `meet` scaling. */
const CHART_LABEL_TARGET_CSS_PX = 11;
/** Bar thickness on screen (px); converted to viewBox width using measured SVG scale. */
const BAR_WIDTH_CSS_PX = 24;
/** Bar corner radius on screen (px); converted with the same horizontal scale as bar width. */
const BAR_CORNER_CSS_PX = 4;
/** Line chart point: outer diameter on screen (px); `r` is derived so fill + non-scaling stroke match this. */
const LINE_MARKER_OUTER_DIAMETER_CSS_PX = 6;
const LINE_MARKER_STROKE_CSS_PX = 2;
/** Max bar width vs. equidistant tick spacing so neighbors do not overlap (`centerStep * frac`). */
const BAR_MAX_WIDTH_FRAC_OF_STEP = 0.88;

/** Vertical hover band width on screen (px); centers on month labels with line markers and axis text. */
const HOVER_BAND_CSS_PX = 32;
/** Hover highlight corner radius on screen (px); converted with `pxPerVbX` like bar corners. */
const HOVER_CORNER_CSS_PX = 8;
/** Extra horizontal slack (px) inside the plot so the hover band clears the grid lines. */
const X_LABEL_HOVER_EXTRA_CSS_PX = 3;
/**
 * Max fraction of plot width used to inset the month band from each edge.
 * Lets us pull months inward (still equidistant on a shorter span) when the 32px hover needs room.
 */
const X_LABEL_BAND_MAX_FRAC_OF_PLOT = 0.36;
/** Vertical hover band fill (plot area). */
const HOVER_BAND_FILL = 'rgb(249 108 80 / 0.08)';

function formatY(v: number, isPercent: boolean): string {
  const x = Number.isFinite(v) ? v : 0;
  return isPercent ? `${x.toFixed(1)}%` : x.toFixed(1);
}

/** Half-width of longest x tick (viewBox) so `text-anchor: middle` labels stay inside `[plotLeft, plotRight]`. */
function approxXAxisLabelBandPad(labels: readonly string[], n: number, fontSize: number): number {
  const lens = labels.slice(0, Math.max(0, n)).map((s) => s.length);
  const maxLen = lens.length ? Math.max(...lens) : 5;
  return Math.min(26, Math.max(8, (maxLen * fontSize * 0.52) / 2));
}

type ChartHoverState = { i: number; px: number; py: number };

export function KpiTitleTrendChart({
  series,
  variant = 'line',
  className,
  yAxisTitle: yAxisTitleProp,
  omitBottomGridLine = false,
  presentation = 'canvas',
}: KpiTitleTrendChartProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [vbH, setVbH] = useState(VB_H_FALLBACK);
  /** Horizontal CSS px per 1 unit of `viewBox` width (`meet` scaling). */
  const [pxPerVbX, setPxPerVbX] = useState(1);
  const [hover, setHover] = useState<ChartHoverState | null>(null);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (el == null) return;

    const apply = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 1 || h < 1) return;
      /** Match viewBox aspect to the slot so uniform `meet` scale uses full width and height (Y uses the frame). */
      const minPlot = 32;
      const next = Math.max(INSET.t + INSET.b + minPlot, (VB_W * h) / w);
      setVbH(next);
      setPxPerVbX(w / VB_W);
    };

    apply();
    const ro = new ResizeObserver(() => apply());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { xLabels, rates, valueIsPercent, yAxisTitle: yAxisTitleFromSeries } = series;
  const isL3 = presentation === 'l3';
  const yAxisTitleLabel =
    yAxisTitleProp ?? yAxisTitleFromSeries ?? (valueIsPercent ? 'Rate (%)' : 'Value');
  const labelTargetCssPx = isL3 ? 9 : CHART_LABEL_TARGET_CSS_PX;
  /** SVG `fontSize` in viewBox units so labels render at ~target px on screen (`meet` scales by `pxPerVbX`). */
  const fsVb = Math.min(26, Math.max(5.5, labelTargetCssPx / Math.max(pxPerVbX, 1e-6)));
  const yTitleMidX = Y_LABEL_X + Y_AXIS_TITLE_BAND / 2;
  const n = Math.max(1, rates.length);
  const minR = Math.min(...rates);
  const maxR = Math.max(...rates);
  const span = Math.max(maxR - minR, 1e-6);
  const y0 = minR - span * 0.08;
  const y1 = maxR + span * 0.08;
  const ySpan = y1 - y0;
  /** Rounded tick values can sit slightly outside `[y0, y1]`; clamp so labels/lines stay in the plot band. */
  const yTicks = [y0, y0 + ySpan / 2, y1]
    .map((v) => Math.round(v * 100) / 100)
    .map((t) => Math.min(y1, Math.max(y0, t)));
  const yTickStrs = yTicks.map((v) => formatY(v, valueIsPercent));
  /** Reserve width after Y-axis title band + tick labels plus gap before the plot / grid. */
  const maxLabelLen = Math.max(...yTickStrs.map((s) => s.length));
  const plotLeft = Math.min(
    56 + Y_TICK_TEXT_X,
    Math.max(
      Y_TICK_TEXT_X + Y_TICK_TO_PLOT_MIN_PAD,
      Y_TICK_TEXT_X + Math.ceil(maxLabelLen * fsVb * 0.52 + Y_LABEL_TO_GRID_GAP),
    ),
  );
  const plotRight = VB_W - PLOT_INSET_R;
  const plotW = plotRight - plotLeft;
  const plotH = vbH - INSET.t - INSET.b;

  /** ViewBox width of hover band (same scale as bars / pxPerVbX). */
  const hoverBandW = HOVER_BAND_CSS_PX / Math.max(pxPerVbX, 1e-6);
  const hoverHalfVb = hoverBandW / 2;
  const xLabelPadText = approxXAxisLabelBandPad(xLabels, n, fsVb);
  /** Inset from plot edges: label half-width + half hover + small slack, capped so the band stays usable. */
  const xLabelPadNeed =
    xLabelPadText +
    hoverHalfVb +
    X_LABEL_HOVER_EXTRA_CSS_PX / Math.max(pxPerVbX, 1e-6);
  const xLabelAppliedPad = Math.min(
    xLabelPadNeed,
    plotW * X_LABEL_BAND_MAX_FRAC_OF_PLOT,
    Math.max(0, plotW / 2 - 4),
  );
  const xLabelLo = plotLeft + xLabelAppliedPad;
  const xLabelHi = plotRight - xLabelAppliedPad;
  const xLabelSpan = Math.max(xLabelHi - xLabelLo, 1e-3);
  const xLabelAt = (i: number) =>
    xLabelLo + (n <= 1 ? xLabelSpan / 2 : (i / Math.max(n - 1, 1)) * xLabelSpan);
  const yAt = (r: number) => INSET.t + (1 - (r - y0) / ySpan) * plotH;

  /** Line markers and polyline share x with axis month labels (`xLabelAt`). */
  const linePoints = rates.map((r, i) => `${xLabelAt(i)},${yAt(r)}`).join(' ');

  /** Bottom of value scale — same y as the lowest horizontal grid line (max y in viewBox). */
  const yPlotBottom = Math.max(...yTicks.map((yt) => yAt(yt)));
  /** L3 “goal” band in **value** space (days); only when not percent. */
  const l3GoalBand =
    isL3 && !valueIsPercent
      ? (() => {
          const lowV = Math.max(y0, Math.min(2.5, 3.5));
          const highV = Math.min(y1, Math.max(2.5, 3.5));
          if (highV <= lowV + 1e-6) return null;
          const yA = yAt(lowV);
          const yB = yAt(highV);
          const top = Math.min(yA, yB);
          const hBand = Math.max(1, Math.abs(yB - yA));
          return { top, h: hBand };
        })()
      : null;
  /** Bars: same x as x-axis month labels (`xLabelAt`); uniform width; centers match label positions (equidistant in i). */
  const plotBand = plotRight - plotLeft;
  const barWTargetUser = BAR_WIDTH_CSS_PX / Math.max(pxPerVbX, 1e-6);
  const labelCenterStep = n <= 1 ? xLabelSpan : xLabelSpan / Math.max(n - 1, 1);
  const wBarMaxByStep = labelCenterStep * BAR_MAX_WIDTH_FRAC_OF_STEP;
  const wBar =
    n < 1
      ? 0
      : Math.max(2, Math.min(barWTargetUser, wBarMaxByStep, plotBand / Math.max(n, 1)));
  const barLeftAt = (i: number) => {
    const cx = xLabelAt(i);
    let left = cx - wBar / 2;
    if (left < plotLeft) left = plotLeft;
    if (left + wBar > plotRight) left = plotRight - wBar;
    return left;
  };
  const barCornerRv = BAR_CORNER_CSS_PX / Math.max(pxPerVbX, 1e-6);
  const hoverCornerRv = HOVER_CORNER_CSS_PX / Math.max(pxPerVbX, 1e-6);
  /** Geometric radius (viewBox) so outer edge ≈ `LINE_MARKER_OUTER_DIAMETER_CSS_PX/2` px with centered non-scaling stroke. */
  const markerRVb =
    (LINE_MARKER_OUTER_DIAMETER_CSS_PX / 2 - LINE_MARKER_STROKE_CSS_PX / 2) / Math.max(pxPerVbX, 1e-6);

  /** Hit targets: midpoints between adjacent month centers; highlight uses fixed `hoverBandW`. */
  const hoverHitLeft = (i: number) => {
    if (n <= 1) return plotLeft;
    if (i <= 0) return plotLeft;
    return (xLabelAt(i - 1) + xLabelAt(i)) / 2;
  };
  const hoverHitRight = (i: number) => {
    if (n <= 1) return plotRight;
    if (i >= n - 1) return plotRight;
    return (xLabelAt(i) + xLabelAt(i + 1)) / 2;
  };
  const hoverIndexFromVbX = (x: number): number | null => {
    if (x < plotLeft || x > plotRight) return null;
    for (let i = 0; i < n; i++) {
      const L = hoverHitLeft(i);
      const R = hoverHitRight(i);
      if (i < n - 1) {
        if (x >= L && x < R) return i;
      } else if (x >= L && x <= R) {
        return i;
      }
    }
    return null;
  };

  const plotTop = INSET.t;
  const plotHitH = Math.max(1, yPlotBottom - plotTop);
  const hoverRxy = Math.min(hoverCornerRv, hoverBandW / 2, plotHitH / 2);

  const updateHoverFromPointer = (e: ReactPointerEvent<Element>) => {
    const svg = svgRef.current;
    const host = hostRef.current;
    if (svg == null || host == null) return;
    const ctm = svg.getScreenCTM();
    if (ctm == null) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const idx = hoverIndexFromVbX(p.x);
    if (idx == null) {
      setHover(null);
      return;
    }
    const hr = host.getBoundingClientRect();
    setHover({ i: idx, px: e.clientX - hr.left, py: e.clientY - hr.top });
  };

  const clearHover = () => setHover(null);

  const tooltipLeft = (() => {
    if (hover == null || hostRef.current == null) return 0;
    const w = hostRef.current.clientWidth;
    const half = 72;
    return Math.min(Math.max(hover.px, half), Math.max(half, w - half));
  })();

  return (
    <div
      ref={hostRef}
      className={['relative flex min-h-0 min-w-0 w-full max-w-none flex-1 basis-0 flex-col', className].filter(Boolean).join(' ')}
    >
      <svg
        ref={svgRef}
        className="block h-full min-h-0 w-full max-w-full flex-1 overflow-visible"
        viewBox={`0 0 ${VB_W} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
        overflow="visible"
        role="img"
        aria-label="KPI trend chart"
        onPointerLeave={clearHover}
      >
        <text
          x={yTitleMidX}
          y={INSET.t + plotH / 2}
          fill={isL3 ? '#999999' : '#707070'}
          fontSize={fsVb}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={isL3 ? 500 : 400}
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(-90 ${yTitleMidX} ${INSET.t + plotH / 2})`}
        >
          {yAxisTitleLabel}
        </text>
        {l3GoalBand ? (
          <rect
            x={plotLeft}
            y={l3GoalBand.top}
            width={Math.max(0, plotRight - plotLeft)}
            height={l3GoalBand.h}
            fill="#ecfcf4"
            pointerEvents="none"
          />
        ) : null}
        {yTicks.map((yt, idx) => {
          const yy = yAt(yt);
          if (omitBottomGridLine && Math.abs(yy - yPlotBottom) < 0.75) return null;
          return (
            <g key={idx}>
              <line
                x1={plotLeft}
                x2={plotRight}
                y1={yy}
                y2={yy}
                stroke="#e8e8e8"
                strokeWidth={1}
                strokeDasharray={isL3 ? '4 4' : undefined}
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={Y_TICK_TEXT_X}
                y={yy}
                dominantBaseline="middle"
                textAnchor="start"
                fill={isL3 ? '#999999' : '#707070'}
                fontSize={fsVb}
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight={isL3 ? 500 : 400}
              >
                {formatY(yt, valueIsPercent)}
              </text>
            </g>
          );
        })}
        {hover != null ? (
          <rect
            x={xLabelAt(hover.i) - hoverBandW / 2}
            y={plotTop}
            width={hoverBandW}
            height={plotHitH}
            rx={hoverRxy}
            ry={hoverRxy}
            fill={HOVER_BAND_FILL}
            pointerEvents="none"
          />
        ) : null}
        {variant === 'bar'
          ? rates.map((r, i) => {
              const yTop = yAt(r);
              const hRaw = yPlotBottom - yTop;
              const h = Math.max(1, hRaw);
              const y = yPlotBottom - h;
              const rxy = Math.min(barCornerRv, wBar / 2, h / 2);
              return (
                <rect
                  key={i}
                  x={barLeftAt(i)}
                  y={y}
                  width={wBar}
                  height={h}
                  rx={rxy}
                  ry={rxy}
                  fill={isL3 ? '#333333' : '#f96c50'}
                  opacity={isL3 ? 0.88 : 0.85}
                />
              );
            })
          : null}
        {variant === 'line' ? (
          <polyline
            fill="none"
            points={linePoints}
            stroke={isL3 ? '#333333' : '#f96c50'}
            strokeWidth={isL3 ? 2 : 2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {variant === 'line'
          ? rates.map((r, i) => (
              <circle
                key={i}
                cx={xLabelAt(i)}
                cy={yAt(r)}
                r={Math.max(1, markerRVb)}
                fill={isL3 ? '#ffffff' : '#fff'}
                stroke={isL3 ? '#333333' : '#f96c50'}
                strokeWidth={isL3 ? 2 : LINE_MARKER_STROKE_CSS_PX}
                vectorEffect="non-scaling-stroke"
              />
            ))
          : null}
        {xLabels.map((lab, i) => {
          /** Show every tick when short enough so spacing stays one month per step; thin only on dense axes. */
          const show = xLabels.length <= 12 || i % 2 === 0 || i === xLabels.length - 1;
          if (!show) return null;
          if (i >= n) return null;
          const x = xLabelAt(i);
          return (
            <text
              key={i}
              x={x}
              y={vbH - 9}
              textAnchor="middle"
              fill={isL3 && i === n - 1 ? '#333333' : isL3 ? '#999999' : '#707070'}
              fontSize={fsVb}
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight={isL3 ? 500 : 400}
            >
              {lab}
            </text>
          );
        })}
        <rect
          x={plotLeft}
          y={plotTop}
          width={Math.max(0, plotRight - plotLeft)}
          height={plotHitH}
          fill="transparent"
          className="cursor-crosshair"
          pointerEvents="all"
          onPointerMove={updateHoverFromPointer}
          onPointerDown={updateHoverFromPointer}
          onPointerCancel={clearHover}
        />
      </svg>
      {hover != null && xLabels[hover.i] != null ? (
        <div
          className="pointer-events-none absolute z-20 min-w-[5rem] rounded-lg border border-solid border-[#e6e6e6] bg-white px-2.5 py-1.5 shadow-[var(--shadow-subtle)]"
          style={{
            left: tooltipLeft,
            top: hover.py,
            transform: hover.py < 56 ? 'translate(-50%, 8px)' : 'translate(-50%, calc(-100% - 8px))',
          }}
        >
          <p className="font-['Inter',sans-serif] text-[11px] font-normal leading-snug text-[#707070]">
            {xLabels[hover.i]}
          </p>
          <p className="mt-1 font-['Inter',sans-serif] text-[11px] font-semibold leading-snug tabular-nums text-[var(--color-grey-darkest)]">
            {formatY(rates[hover.i] ?? 0, valueIsPercent)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
