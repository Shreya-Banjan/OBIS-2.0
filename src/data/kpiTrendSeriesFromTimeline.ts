/** Keep in sync with `TimelinePickerField` custom-range parsing (OBIS date chip format). */
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/**
 * Maps chart x-axis labels (`monthKeyAxis` like `Jan'24`, or short custom `Apr 12`) to full month + calendar year
 * for L3 tabular display.
 */
export function monthYearFromTrendXLabel(label: string): { monthOfYear: string; year: string } {
  const t = label.trim();
  const prime = /^([A-Za-z]{3})'(\d{2})$/.exec(t);
  if (prime) {
    const si = MONTH_SHORT.findIndex((x) => x.toLowerCase() === prime[1]!.toLowerCase());
    if (si >= 0) return { monthOfYear: MONTH_LONG[si]!, year: String(2000 + Number(prime[2])) };
  }
  const dayChunk = /^([A-Za-z]{3})\s+(\d{1,2})$/.exec(t);
  if (dayChunk) {
    const si = MONTH_SHORT.findIndex((x) => x.toLowerCase() === dayChunk[1]!.toLowerCase());
    if (si >= 0) {
      const y = new Date().getFullYear();
      return { monthOfYear: `${MONTH_LONG[si]!} ${dayChunk[2]}`, year: String(y) };
    }
  }
  return { monthOfYear: t, year: '—' };
}

function parseObisDate(s: string): Date | null {
  const m = /^([A-Za-z]{3}) (\d{1,2})' (\d{2})$/.exec(s.trim());
  if (!m) return null;
  const mi = MONTH_SHORT.findIndex((x) => x.toLowerCase() === m[1]!.toLowerCase());
  if (mi < 0) return null;
  const day = Number(m[2]);
  const yr = 2000 + Number(m[3]);
  if (!Number.isFinite(day) || !Number.isFinite(yr)) return null;
  return new Date(yr, mi, day);
}

type ParsedTimeline =
  | { kind: 'preset'; preset: 'mom' | 'yoy' | 'ytd' }
  | { kind: 'custom'; start: Date; end: Date }
  | null;

function parseTimelineValue(value: string): ParsedTimeline {
  const t = value.trim();
  if (t === 'MoM') return { kind: 'preset', preset: 'mom' };
  if (t === 'YoY') return { kind: 'preset', preset: 'yoy' };
  if (t === 'YTD') return { kind: 'preset', preset: 'ytd' };
  const parts = t.split(/\s*[–—-]\s*/);
  if (parts.length === 2) {
    const a = parseObisDate(parts[0]!);
    const b = parseObisDate(parts[1]!);
    if (a && b) {
      const start = a <= b ? a : b;
      const end = a <= b ? b : a;
      return { kind: 'custom', start, end };
    }
  }
  return null;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export type KpiTrendSeries = {
  xLabels: string[];
  rates: number[];
  valueIsPercent: boolean;
  /** Shown vertically to the left of Y tick labels (optional; chart has its own default). */
  yAxisTitle?: string;
};

/** Trims a series to the last `maxPoints` buckets (e.g. L2 title chart = 6 months). */
export function sliceKpiTrendSeriesEnd(series: KpiTrendSeries, maxPoints: number): KpiTrendSeries {
  if (maxPoints <= 0 || series.xLabels.length <= maxPoints) return series;
  const start = series.xLabels.length - maxPoints;
  return {
    ...series,
    xLabels: series.xLabels.slice(start),
    rates: series.rates.slice(start),
  };
}

function monthKeyAxis(d: Date): string {
  return `${MONTH_SHORT[d.getMonth()]}'${String(d.getFullYear()).slice(-2)}`;
}

function buildDemoRates(len: number, anchor: number, salt: number): number[] {
  if (len <= 0) return [];
  return Array.from({ length: len }, (_, i) => {
    const t = len <= 1 ? 0.5 : i / (len - 1);
    const wave = Math.sin((i + 1) * 0.85 + salt * 0.003) * anchor * 0.12;
    const drift = (t - 0.5) * anchor * 0.06;
    return Math.max(0.02, anchor * 0.88 + wave + drift + (i / Math.max(len - 1, 1)) * anchor * 0.08);
  });
}

/**
 * X axis follows the editor timeline: **custom range** (dense ticks for short spans, else by month),
 * **YTD** (Jan → current month), **YoY** (12 trailing months), or default **MoM** (12 trailing months
 * ending current month when nothing / MoM is selected). Y values are demo rates anchored near `anchorRate`.
 * Optional `demoSalt` replaces the default time-based salt so callers (e.g. L3 modal partner scope) can shift the demo curve.
 */
export function getKpiTrendSeriesFromTimeline(
  timelineValue: string,
  opts: { anchorRate: number; valueIsPercent: boolean; demoSalt?: number }
): KpiTrendSeries {
  const parsed = parseTimelineValue(timelineValue.trim());
  const now = new Date();
  const { anchorRate, valueIsPercent, demoSalt } = opts;
  const salt = (fallback: number) => (demoSalt !== undefined ? demoSalt : fallback);

  const pack = (xLabels: string[], rates: number[]): KpiTrendSeries => ({
    xLabels,
    rates,
    valueIsPercent,
  });

  const momTwelve = (): KpiTrendSeries => {
    const xLabels: string[] = [];
    for (let k = 11; k >= 0; k -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
      xLabels.push(monthKeyAxis(d));
    }
    return pack(xLabels, buildDemoRates(12, anchorRate, salt(now.getTime())));
  };

  if (!parsed || parsed.kind === 'preset') {
    if (!parsed || parsed.preset === 'mom') return momTwelve();
    if (parsed.preset === 'ytd') {
      const y = now.getFullYear();
      const m0 = now.getMonth();
      const xLabels: string[] = [];
      for (let m = 0; m <= m0; m += 1) xLabels.push(monthKeyAxis(new Date(y, m, 1)));
      return pack(xLabels, buildDemoRates(xLabels.length, anchorRate, salt(y)));
    }
    if (parsed.preset === 'yoy') {
      const xLabels: string[] = [];
      for (let k = 11; k >= 0; k -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
        xLabels.push(monthKeyAxis(d));
      }
      return pack(xLabels, buildDemoRates(12, anchorRate, salt(now.getFullYear() * 13)));
    }
  }

  if (parsed?.kind === 'custom') {
    const lo = startOfDay(parsed.start);
    const hi = startOfDay(parsed.end);
    const diffMs = hi.getTime() - lo.getTime();
    const diffDays = Math.floor(diffMs / 86400000) + 1;

    if (diffDays <= 45) {
      const n = Math.min(8, Math.max(3, Math.ceil(diffDays / 6)));
      const xLabels: string[] = [];
      for (let i = 0; i < n; i += 1) {
        const t = n <= 1 ? lo.getTime() : lo.getTime() + (i / (n - 1)) * diffMs;
        const d = new Date(t);
        xLabels.push(`${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`);
      }
      return pack(xLabels, buildDemoRates(n, anchorRate, salt(lo.getTime())));
    }

    const xLabels: string[] = [];
    let cy = lo.getFullYear();
    let cm = lo.getMonth();
    const endY = hi.getFullYear();
    const endM = hi.getMonth();
    while (cy < endY || (cy === endY && cm <= endM)) {
      xLabels.push(monthKeyAxis(new Date(cy, cm, 1)));
      cm += 1;
      if (cm > 11) {
        cm = 0;
        cy += 1;
      }
    }
    if (xLabels.length === 0) xLabels.push(monthKeyAxis(lo));
    return pack(xLabels, buildDemoRates(xLabels.length, anchorRate, salt(lo.getTime())));
  }

  return momTwelve();
}
