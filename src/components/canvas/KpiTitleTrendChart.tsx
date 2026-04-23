import { useLayoutEffect, useRef, useState } from 'react';
import type { KpiTrendSeries } from '../../data/kpiTrendSeriesFromTimeline';

type KpiTitleTrendChartProps = {
  series: KpiTrendSeries;
  variant?: 'line' | 'bar';
  className?: string;
};

/** Wide coordinate width; height is synced to the flex slot via ResizeObserver so `meet` fills the frame vertically. */
const VB_W = 560;
const VB_H_FALLBACK = 132;
const INSET = { r: 10, t: 6, b: 30 };
/** Y tick labels are `text-anchor: start` at x=0 (flush to frame); this is the plot / grid start. */
const Y_LABEL_X = 0;

function formatY(v: number, isPercent: boolean): string {
  const x = Number.isFinite(v) ? v : 0;
  return isPercent ? `${x.toFixed(1)}%` : x.toFixed(1);
}

export function KpiTitleTrendChart({ series, variant = 'line', className }: KpiTitleTrendChartProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [vbH, setVbH] = useState(VB_H_FALLBACK);

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
    };

    apply();
    const ro = new ResizeObserver(() => apply());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { xLabels, rates, valueIsPercent } = series;
  const n = Math.max(1, rates.length);
  const minR = Math.min(...rates);
  const maxR = Math.max(...rates);
  const span = Math.max(maxR - minR, 1e-6);
  const y0 = minR - span * 0.08;
  const y1 = maxR + span * 0.08;
  const ySpan = y1 - y0;
  const yTicks = [y0, y0 + ySpan / 2, y1].map((v) => Math.round(v * 100) / 100);
  const yTickStrs = yTicks.map((v) => formatY(v, valueIsPercent));
  /** Reserve width after flush-left labels (~fontSize 10); plot begins here. */
  const plotLeft = Math.min(48, Math.max(24, Math.ceil(Math.max(...yTickStrs.map((s) => s.length))) * 5.5 + 1));
  const plotW = VB_W - plotLeft - INSET.r;
  const plotH = vbH - INSET.t - INSET.b;

  const xAt = (i: number) => plotLeft + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (r: number) => INSET.t + (1 - (r - y0) / ySpan) * plotH;

  const linePoints = rates.map((r, i) => `${xAt(i)},${yAt(r)}`).join(' ');

  const barW = n > 0 ? (plotW / n) * 0.5 : 0;
  const yBase = INSET.t + plotH;

  return (
    <div
      ref={hostRef}
      className={['flex min-h-0 min-w-0 w-full max-w-none flex-1 basis-0 flex-col', className].filter(Boolean).join(' ')}
    >
      <svg
        className="block h-full min-h-0 w-full max-w-full flex-1"
        viewBox={`0 0 ${VB_W} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="KPI rate trend (demo data)"
      >
        <title>KPI rate trend</title>
        {yTicks.map((yt, idx) => {
          const yy = yAt(yt);
          return (
            <g key={idx}>
              <line
                x1={plotLeft}
                x2={VB_W - INSET.r}
                y1={yy}
                y2={yy}
                stroke="#e8e8e8"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={Y_LABEL_X}
                y={yy}
                dominantBaseline="middle"
                textAnchor="start"
                fill="#707070"
                fontSize={10}
                fontFamily="Inter, system-ui, sans-serif"
              >
                {formatY(yt, valueIsPercent)}
              </text>
            </g>
          );
        })}
        {variant === 'bar'
          ? rates.map((r, i) => {
              const cx = xAt(i);
              const yTop = yAt(r);
              const h = Math.max(1, yBase - yTop);
              return (
                <rect
                  key={i}
                  x={cx - barW / 2}
                  y={yTop}
                  width={barW}
                  height={h}
                  rx={2}
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
              <circle key={i} cx={xAt(i)} cy={yAt(r)} r={3.25} fill="#fff" stroke="#f96c50" strokeWidth={2} />
            ))
          : null}
        {xLabels.map((lab, i) => {
          const show = xLabels.length <= 7 || i % 2 === 0 || i === xLabels.length - 1;
          if (!show) return null;
          return (
            <text
              key={i}
              x={xAt(i)}
              y={vbH - 6}
              textAnchor="middle"
              fill="#707070"
              fontSize={8.5}
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
