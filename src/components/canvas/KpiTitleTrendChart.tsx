import { useLayoutEffect, useRef, useState } from 'react';
import type { KpiTrendSeries } from '../../data/kpiTrendSeriesFromTimeline';

type KpiTitleTrendChartProps = {
  series: KpiTrendSeries;
  variant?: 'line' | 'bar';
  className?: string;
  /** Overrides `series.yAxisTitle`; default depends on `valueIsPercent`. */
  yAxisTitle?: string;
};

/** Wide coordinate width; height is synced to the flex slot via ResizeObserver so `meet` fills the frame vertically. */
const VB_W = 560;
const VB_H_FALLBACK = 132;
const INSET = { t: 10, b: 30 };
/** Small pad at the viewBox right so strokes are not clipped; plot / grid / series share this edge. */
const PLOT_INSET_R = 8;
/** Left padding before the Y-axis title band. */
const Y_LABEL_X = 4;
/** Horizontal space for the vertical Y-axis title (viewBox units); tick values start to its right. */
const Y_AXIS_TITLE_BAND = 22;
/** X position of Y tick value text (`start` anchor). */
const Y_TICK_TEXT_X = Y_LABEL_X + Y_AXIS_TITLE_BAND;
/** Extra viewBox units between the widest Y label and the plot / horizontal grid lines. */
const Y_LABEL_TO_GRID_GAP = 12;
const FS_Y_AXIS = 11;
const FS_X_AXIS = 11;
/** Bar thickness on screen (px); converted to viewBox width using measured SVG scale. */
const BAR_WIDTH_CSS_PX = 24;
/** Bar corner radius on screen (px); converted with the same horizontal scale as bar width. */
const BAR_CORNER_CSS_PX = 4;
/** Max bar width vs. equidistant tick spacing so neighbors do not overlap (`centerStep * frac`). */
const BAR_MAX_WIDTH_FRAC_OF_STEP = 0.88;

function formatY(v: number, isPercent: boolean): string {
  const x = Number.isFinite(v) ? v : 0;
  return isPercent ? `${x.toFixed(1)}%` : x.toFixed(1);
}

/** Half of estimated x tick label width, viewBox units — for aligning markers with `start` / `end` tick text. */
function approxXTickHalfWidth(label: string): number {
  if (!label) return 9;
  const full = Math.min(42, Math.max(14, label.length * FS_X_AXIS * 0.52));
  return full / 2;
}

/** Half-width of longest x tick (viewBox) so `text-anchor: middle` labels stay inside `[plotLeft, plotRight]`. */
function approxXAxisLabelBandPad(labels: readonly string[], n: number, fontSize: number): number {
  const lens = labels.slice(0, Math.max(0, n)).map((s) => s.length);
  const maxLen = lens.length ? Math.max(...lens) : 5;
  return Math.min(26, Math.max(8, (maxLen * fontSize * 0.52) / 2));
}

export function KpiTitleTrendChart({ series, variant = 'line', className, yAxisTitle: yAxisTitleProp }: KpiTitleTrendChartProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [vbH, setVbH] = useState(VB_H_FALLBACK);
  /** Horizontal CSS px per 1 unit of `viewBox` width (`meet` scaling). */
  const [pxPerVbX, setPxPerVbX] = useState(1);

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
  const yAxisTitleLabel =
    yAxisTitleProp ?? yAxisTitleFromSeries ?? (valueIsPercent ? 'Rate (%)' : 'Value');
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
    62 + Y_TICK_TEXT_X,
    Math.max(36 + Y_TICK_TEXT_X, Y_TICK_TEXT_X + Math.ceil(maxLabelLen * 6 + 1 + Y_LABEL_TO_GRID_GAP)),
  );
  const plotRight = VB_W - PLOT_INSET_R;
  const plotW = plotRight - plotLeft;
  const plotH = vbH - INSET.t - INSET.b;

  const xAt = (i: number) => plotLeft + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  /** Same spacing as `xAt`, inset so month labels (`middle`) fit between grid line endpoints `plotLeft` / `plotRight`. */
  const xLabelPad = approxXAxisLabelBandPad(xLabels, n, FS_X_AXIS);
  const xLabelLo = plotLeft + Math.min(xLabelPad, plotW * 0.22);
  const xLabelHi = plotRight - Math.min(xLabelPad, plotW * 0.22);
  const xLabelSpan = Math.max(xLabelHi - xLabelLo, 1e-3);
  const xLabelAt = (i: number) =>
    xLabelLo + (n <= 1 ? xLabelSpan / 2 : (i / Math.max(n - 1, 1)) * xLabelSpan);
  const yAt = (r: number) => INSET.t + (1 - (r - y0) / ySpan) * plotH;

  /** First tick text stays at `plotLeft` + `start`; nudge first marker to that label’s visual center. */
  const firstTickCenterX =
    n <= 1
      ? xAt(0)
      : Math.min(plotLeft + approxXTickHalfWidth(xLabels[0] ?? ''), xAt(1) - 10);
  /** Last tick text stays at `plotRight` + `end`; nudge last marker to that label’s visual center. */
  const lastTickCenterX =
    n <= 1
      ? xAt(0)
      : Math.max(plotRight - approxXTickHalfWidth(xLabels[n - 1] ?? ''), xAt(n - 2) + 10);
  const xSeries = (i: number) => {
    if (n <= 1) return xAt(i);
    if (i === 0) return firstTickCenterX;
    if (i === n - 1) return lastTickCenterX;
    return xAt(i);
  };

  const linePoints = rates.map((r, i) => `${xSeries(i)},${yAt(r)}`).join(' ');

  /** Bottom of value scale — same y as the lowest horizontal grid line (max y in viewBox). */
  const yPlotBottom = Math.max(...yTicks.map((yt) => yAt(yt)));
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

  return (
    <div
      ref={hostRef}
      className={['flex min-h-0 min-w-0 w-full max-w-none flex-1 basis-0 flex-col', className].filter(Boolean).join(' ')}
    >
      <svg
        className="block h-full min-h-0 w-full max-w-full flex-1 overflow-visible"
        viewBox={`0 0 ${VB_W} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
        overflow="visible"
        role="img"
        aria-label="KPI rate trend (demo data)"
      >
        <title>KPI rate trend</title>
        <text
          x={yTitleMidX}
          y={INSET.t + plotH / 2}
          fill="#707070"
          fontSize={FS_Y_AXIS}
          fontFamily="Inter, system-ui, sans-serif"
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(-90 ${yTitleMidX} ${INSET.t + plotH / 2})`}
        >
          {yAxisTitleLabel}
        </text>
        {yTicks.map((yt, idx) => {
          const yy = yAt(yt);
          return (
            <g key={idx}>
              <line
                x1={plotLeft}
                x2={plotRight}
                y1={yy}
                y2={yy}
                stroke="#e8e8e8"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={Y_TICK_TEXT_X}
                y={yy}
                dominantBaseline="middle"
                textAnchor="start"
                fill="#707070"
                fontSize={FS_Y_AXIS}
                fontFamily="Inter, system-ui, sans-serif"
              >
                {formatY(yt, valueIsPercent)}
              </text>
            </g>
          );
        })}
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
                  fill="#f96c50"
                  opacity={0.85}
                />
              );
            })
          : null}
        {variant === 'line' ? (
          <polyline
            fill="none"
            points={linePoints}
            stroke="#f96c50"
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {variant === 'line'
          ? rates.map((r, i) => (
              <circle key={i} cx={xSeries(i)} cy={yAt(r)} r={3.25} fill="#fff" stroke="#f96c50" strokeWidth={2} />
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
              y={vbH - 6}
              textAnchor="middle"
              fill="#707070"
              fontSize={FS_X_AXIS}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {lab}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
