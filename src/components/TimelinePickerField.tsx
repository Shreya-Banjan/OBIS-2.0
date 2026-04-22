import type { RefObject } from 'react';
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HEADER_TIMELINE_PLACEHOLDER } from '../data/headerSelectOptions';
import { IconCalendar, IconChevronDown, IconChevronLeft } from './Icons';

/** Popover width: wide enough for four presets + custom chrome without crowding. */
const MENU_MIN_WIDTH_PX = 380;
const MENU_MAX_WIDTH_PX = 448;
const VIEWPORT_MARGIN_PX = 16;

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

type TimelinePreset = 'mom' | 'yoy' | 'ytd' | 'custom';
type Segment = 'month' | 'day' | 'year';

type Layout = 'default' | 'toolbar';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatObisDate(d: Date): string {
  const mon = MONTH_SHORT[d.getMonth()];
  return `${mon} ${pad2(d.getDate())}' ${String(d.getFullYear()).slice(-2)}`;
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

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function todayStart(): Date {
  return startOfDay(new Date());
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

function calendarWeeks(visibleMonth: Date): (Date | null)[][] {
  const y = visibleMonth.getFullYear();
  const m = visibleMonth.getMonth();
  const first = new Date(y, m, 1);
  const startPad = first.getDay();
  const total = daysInMonth(y, m);
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(new Date(y, m, d));
  while (cells.length < 42) cells.push(null);
  const rows: (Date | null)[][] = [];
  for (let r = 0; r < 6; r++) {
    rows.push(cells.slice(r * 7, r * 7 + 7));
  }
  return rows;
}

function presetLabel(p: TimelinePreset): string {
  if (p === 'mom') return 'MoM';
  if (p === 'yoy') return 'YoY';
  if (p === 'ytd') return 'YTD';
  return 'Custom';
}

function serializeApplied(preset: TimelinePreset, start: Date | null, end: Date | null): string {
  if (preset !== 'custom') return presetLabel(preset);
  if (!start || !end) return '';
  return `${formatObisDate(start)} – ${formatObisDate(end)}`;
}

/** Canonical inclusive range (start-of-day), always lo <= hi. */
function orderedRangeEnds(a: Date, b: Date): readonly [Date, Date] {
  const x = startOfDay(a);
  const y = startOfDay(b);
  return x <= y ? ([x, y] as const) : ([y, x] as const);
}

/** “As of …” line under the KPI headline: end month of a custom range, otherwise the current calendar month. */
export function formatKpiCanvasPeriodLabel(timelineValue: string): string {
  const parsed = parseTimelineValue(timelineValue.trim());
  const now = new Date();
  const monthYear = (d: Date) => `${MONTH_SHORT[d.getMonth()]}' ${d.getFullYear()}`;
  const label = parsed?.kind === 'custom' ? monthYear(startOfDay(parsed.end)) : monthYear(now);
  return `As of ${label}`;
}

/** Contiguous in-range columns per week for one unbroken selection track behind day cells. */
function rangeSpansForWeekRow(row: (Date | null)[], lo: Date, hi: Date): { startCol: number; spanCols: number }[] {
  const loT = startOfDay(lo).getTime();
  const hiT = startOfDay(hi).getTime();
  const flags = row.map((cell) => {
    if (!cell) return false;
    const t = startOfDay(cell).getTime();
    return t >= loT && t <= hiT;
  });
  const spans: { startCol: number; spanCols: number }[] = [];
  let i = 0;
  while (i < 7) {
    if (!flags[i]) {
      i++;
      continue;
    }
    let j = i;
    while (j < 7 && flags[j]) j++;
    spans.push({ startCol: i, spanCols: j - i });
    i = j;
  }
  return spans;
}

type TimelineMenuProps = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  appliedValue: string;
  onApply: (next: string) => void;
};

function TimelineMenu({ open, anchorRef, onClose, appliedValue, onApply }: TimelineMenuProps) {
  const titleId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const appliedRef = useRef(appliedValue);
  appliedRef.current = appliedValue;

  const initFromApplied = (raw: string) => parseTimelineValue(raw.trim());

  const [draftPreset, setDraftPreset] = useState<TimelinePreset>(() => {
    const p = initFromApplied(appliedValue);
    if (!p) return 'mom';
    return p.kind === 'preset' ? p.preset : 'custom';
  });
  const [draftStart, setDraftStart] = useState<Date | null>(() => {
    const p = initFromApplied(appliedValue);
    return p?.kind === 'custom' ? startOfDay(p.start) : null;
  });
  const [draftEnd, setDraftEnd] = useState<Date | null>(() => {
    const p = initFromApplied(appliedValue);
    return p?.kind === 'custom' ? startOfDay(p.end) : null;
  });
  const [segment, setSegment] = useState<Segment>('day');
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const p = initFromApplied(appliedValue);
    const t = todayStart();
    if (p?.kind === 'custom') return new Date(p.end.getFullYear(), p.end.getMonth(), 1);
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [yearBlockCenter, setYearBlockCenter] = useState<number>(() => {
    const p = initFromApplied(appliedValue);
    return p?.kind === 'custom' ? p.end.getFullYear() : todayStart().getFullYear();
  });
  const [monthPickYear, setMonthPickYear] = useState<number>(() => {
    const p = initFromApplied(appliedValue);
    return p?.kind === 'custom' ? p.end.getFullYear() : todayStart().getFullYear();
  });
  const [activeEnd, setActiveEnd] = useState<'start' | 'end'>('end');

  const [fixedRect, setFixedRect] = useState({ top: 0, left: 0, width: MENU_MAX_WIDTH_PX });

  const updateFixedPosition = () => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    const vw = typeof window !== 'undefined' ? window.innerWidth : r.width;
    const maxW = Math.max(0, vw - VIEWPORT_MARGIN_PX * 2);
    const menuWidth = Math.min(maxW, Math.max(r.width, MENU_MIN_WIDTH_PX), MENU_MAX_WIDTH_PX);
    const anchorCenterX = r.left + r.width / 2;
    const minLeft = VIEWPORT_MARGIN_PX;
    const maxLeft = vw - VIEWPORT_MARGIN_PX - menuWidth;
    const left = Math.max(minLeft, Math.min(maxLeft, anchorCenterX - menuWidth / 2));
    setFixedRect({ top: r.bottom + 6, left, width: menuWidth });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateFixedPosition();
    const anchor = anchorRef.current;
    const ro = anchor ? new ResizeObserver(updateFixedPosition) : null;
    if (anchor) ro?.observe(anchor);
    window.addEventListener('scroll', updateFixedPosition, true);
    window.addEventListener('resize', updateFixedPosition);
    return () => {
      ro?.disconnect();
      window.removeEventListener('scroll', updateFixedPosition, true);
      window.removeEventListener('resize', updateFixedPosition);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const p = parseTimelineValue(appliedRef.current.trim());
    if (!p) {
      setDraftPreset('mom');
      setDraftStart(null);
      setDraftEnd(null);
      const t = todayStart();
      setCalendarMonth(new Date(t.getFullYear(), t.getMonth(), 1));
      setYearBlockCenter(t.getFullYear());
      setMonthPickYear(t.getFullYear());
    } else if (p.kind === 'preset') {
      setDraftPreset(p.preset);
      setDraftStart(null);
      setDraftEnd(null);
      const t = todayStart();
      setCalendarMonth(new Date(t.getFullYear(), t.getMonth(), 1));
      setYearBlockCenter(t.getFullYear());
      setMonthPickYear(t.getFullYear());
    } else {
      setDraftPreset('custom');
      const [lo, hi] = orderedRangeEnds(p.start, p.end);
      setDraftStart(lo);
      setDraftEnd(hi);
      setCalendarMonth(new Date(hi.getFullYear(), hi.getMonth(), 1));
      setYearBlockCenter(hi.getFullYear());
      setMonthPickYear(hi.getFullYear());
    }
    setSegment('day');
    setActiveEnd('end');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const menuEl = menuRef.current;
      const anchorEl = anchorRef.current;
      if (!menuEl) return;
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (menuEl.contains(t) || anchorEl?.contains(t)) return;
      onClose();
    };
    document.addEventListener('mousedown', onPointer, true);
    document.addEventListener('touchstart', onPointer, true);
    return () => {
      document.removeEventListener('mousedown', onPointer, true);
      document.removeEventListener('touchstart', onPointer, true);
    };
  }, [open, onClose, anchorRef]);

  const cursorDate =
    activeEnd === 'end'
      ? (draftEnd ?? draftStart ?? todayStart())
      : (draftStart ?? draftEnd ?? todayStart());
  const showCustomChrome = draftPreset === 'custom';

  /** Two-click range: first click sets start (end cleared); second sets end and sorts. Third click restarts. */
  const onDayPick = (d: Date) => {
    const x = startOfDay(d);
    setCalendarMonth(new Date(x.getFullYear(), x.getMonth(), 1));
    if (draftStart === null || (draftStart !== null && draftEnd !== null)) {
      setDraftStart(x);
      setDraftEnd(null);
      return;
    }
    const s = draftStart;
    const lo = x < s ? x : s;
    const hi = x < s ? s : x;
    setDraftStart(lo);
    setDraftEnd(hi);
  };

  const weeks = useMemo(() => calendarWeeks(calendarMonth), [calendarMonth]);

  const rangeBounds = useMemo(() => {
    if (!draftStart) return null;
    if (!draftEnd) {
      const d0 = startOfDay(draftStart);
      return { lo: d0, hi: d0 };
    }
    const [lo, hi] = orderedRangeEnds(draftStart, draftEnd);
    return { lo, hi };
  }, [draftStart, draftEnd]);

  const isRangeStart = (d: Date) => rangeBounds !== null && sameDay(d, rangeBounds.lo);
  const isRangeEnd = (d: Date) => rangeBounds !== null && sameDay(d, rangeBounds.hi);

  const yearRows = useMemo(() => {
    const b = yearBlockCenter;
    return [
      [b + 1, b, b - 1, b - 2],
      [b - 3, b - 4, b - 5, b - 6],
    ];
  }, [yearBlockCenter]);

  const applyIncomplete = draftPreset === 'custom' && (!draftStart || !draftEnd);

  const onApplyClick = () => {
    if (applyIncomplete) return;
    onApply(serializeApplied(draftPreset, draftStart, draftEnd));
    onClose();
  };

  if (!open || typeof document === 'undefined') return null;

  const segmentBtn = (s: Segment, label: string, extraClass = '') => (
    <button
      key={s}
      type="button"
      onClick={() => {
        setSegment(s);
        if (s === 'month') setMonthPickYear(cursorDate.getFullYear());
        if (s === 'year') setYearBlockCenter(cursorDate.getFullYear());
      }}
      className={[
        'flex h-8 items-center justify-center rounded-xl border px-3 font-[\'Poppins\',sans-serif] text-xs font-bold text-[#333333]',
        segment === s ? 'border-[#f96c50]' : 'border-[rgba(51,51,51,0.15)]',
        extraClass,
      ].join(' ')}
    >
      {label}
    </button>
  );

  const menu = (
    <div
      ref={menuRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{
        position: 'fixed',
        top: fixedRect.top,
        left: fixedRect.left,
        width: fixedRect.width,
        zIndex: 120,
      }}
      className="box-border flex max-h-[min(90vh,calc(100vh-32px))] flex-col overflow-y-auto rounded-xl border border-[#ececec] bg-white px-2 pb-3 pt-3 shadow-[0px_4px_20px_0px_rgba(160,181,208,0.5)]"
    >
      <p id={titleId} className="sr-only">
        Timeline
      </p>

      <div className="flex w-full min-w-0 flex-wrap justify-center gap-2">
        {(['mom', 'yoy', 'ytd', 'custom'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              if (p === 'custom' && draftPreset !== 'custom') {
                const t = todayStart();
                setDraftStart(null);
                setDraftEnd(null);
                setCalendarMonth(new Date(t.getFullYear(), t.getMonth(), 1));
                setYearBlockCenter(t.getFullYear());
                setMonthPickYear(t.getFullYear());
              }
              setDraftPreset(p);
              setSegment('day');
            }}
            className={[
              'flex h-8 w-20 shrink-0 items-center justify-center rounded-xl font-[\'Poppins\',sans-serif] text-xs transition-colors',
              draftPreset === p
                ? 'bg-[#f96c50] font-bold text-white'
                : 'bg-[#f5f5f5] font-medium text-[#707070]',
            ].join(' ')}
          >
            {presetLabel(p)}
          </button>
        ))}
      </div>

      {showCustomChrome ? (
        <>
          <div className="my-3 h-px w-full bg-[#e8e8e8]" aria-hidden />
          <div className="mx-auto flex min-h-[40px] w-full min-w-0 max-w-[calc(20rem+1.5rem)] items-center gap-2.5 overflow-hidden rounded-xl border border-[#d6d6d6] px-3 py-1.5">
            <button
              type="button"
              onClick={() => setActiveEnd('start')}
              className={`flex min-w-0 flex-1 items-center gap-2.5 text-left ${activeEnd === 'start' ? '' : ''}`}
            >
              <IconCalendar className="size-6 shrink-0 text-[#707070]" aria-hidden />
              <span
                className={[
                  "truncate font-['Poppins',sans-serif] text-[13px] font-normal tracking-tight",
                  draftStart ? 'text-[#333333]' : 'text-[#999999]',
                ].join(' ')}
              >
                {draftStart ? formatObisDate(draftStart) : 'Start date'}
              </span>
            </button>
            <div className="h-5 w-px shrink-0 bg-[#d6d6d6]" aria-hidden />
            <button
              type="button"
              onClick={() => setActiveEnd('end')}
              className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
            >
              <IconCalendar className="size-6 shrink-0 text-[#707070]" aria-hidden />
              <span
                className={[
                  "truncate font-['Poppins',sans-serif] text-[13px] font-normal tracking-tight",
                  draftEnd ? 'text-[#333333]' : 'text-[#999999]',
                ].join(' ')}
              >
                {draftEnd ? formatObisDate(draftEnd) : 'End date'}
              </span>
            </button>
          </div>

          <div className="mt-2 flex w-full min-w-0 flex-col gap-2">
            <div className="flex items-center justify-between py-2">
              <button
                type="button"
                aria-label="Previous"
                className="flex size-5 shrink-0 items-center justify-center text-[#333333] outline-none hover:opacity-70"
                onClick={() => {
                  if (segment === 'day') {
                    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                  } else if (segment === 'month') {
                    setMonthPickYear((y) => y - 1);
                  } else {
                    setYearBlockCenter((y) => y - 8);
                  }
                }}
              >
                <IconChevronLeft className="size-5" aria-hidden />
              </button>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {segmentBtn('month', MONTH_LONG[cursorDate.getMonth()]!)}
                {segmentBtn('day', String(cursorDate.getDate()))}
                {segmentBtn('year', String(cursorDate.getFullYear()), 'uppercase tracking-tight')}
              </div>
              <button
                type="button"
                aria-label="Next"
                className="flex size-5 shrink-0 items-center justify-center text-[#333333] outline-none hover:opacity-70"
                onClick={() => {
                  if (segment === 'day') {
                    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                  } else if (segment === 'month') {
                    setMonthPickYear((y) => y + 1);
                  } else {
                    setYearBlockCenter((y) => y + 8);
                  }
                }}
              >
                <IconChevronLeft className="size-5 rotate-180" aria-hidden />
              </button>
            </div>

            {segment === 'day' ? (
              <div className="w-full min-w-0">
                <div className="grid grid-cols-7 gap-y-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
                    <div
                      key={d}
                      className="flex h-6 items-center justify-center font-['Poppins',sans-serif] text-[10px] font-medium tracking-tight text-[#707070]"
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex flex-col gap-y-1">
                  {weeks.map((row, ri) => {
                    const spans = rangeBounds ? rangeSpansForWeekRow(row, rangeBounds.lo, rangeBounds.hi) : [];
                    return (
                      <div key={`w-${ri}`} className="relative grid grid-cols-7">
                        {spans.map((span, si) => {
                          const leftCell = row[span.startCol];
                          const rightCell = row[span.startCol + span.spanCols - 1];
                          const edgeL = !!(leftCell && isRangeStart(leftCell));
                          const edgeR = !!(rightCell && isRangeEnd(rightCell));
                          const one = span.spanCols === 1;
                          const radius =
                            one && edgeL && edgeR
                              ? 'rounded-full'
                              : [edgeL ? 'rounded-l-full' : 'rounded-l-[2px]', edgeR ? 'rounded-r-full' : 'rounded-r-[2px]'].join(' ');
                          /** Single-day: 2rem pill. Multi-day: span from left tangent to right tangent of `size-8` circles (mid-to-mid was 1rem short each end and looked clipped). */
                          const trackStyle = one
                            ? {
                                left: `calc((${span.startCol} + 0.5) * (100% / 7) - 1rem)`,
                                width: '2rem',
                              }
                            : {
                                left: `calc((${span.startCol} + 0.5) * (100% / 7) - 1rem)`,
                                width: `calc(${span.spanCols - 1} * (100% / 7) + 2rem)`,
                              };
                          return (
                            <div
                              key={`s-${ri}-${si}`}
                              className={`pointer-events-none absolute top-0 z-0 h-8 bg-[rgba(249,108,80,0.12)] ${radius}`}
                              style={trackStyle}
                              aria-hidden
                            />
                          );
                        })}
                        {row.map((cell, ci) => {
                          const key = cell ? String(cell.getTime()) : `e-${ri}-${ci}`;
                          if (!cell) {
                            return <div key={key} className="h-8" />;
                          }
                          const inM = cell.getMonth() === calendarMonth.getMonth();
                          const t0 = todayStart();
                          const isTodayCell = sameDay(cell, t0);
                          const st = isRangeStart(cell);
                          const en = isRangeEnd(cell);
                          const endpoint = st || en;
                          const dayNumClass = !inM ? 'text-[#707070]/45' : 'text-[#333333]';
                          const circleBase =
                            'relative z-[2] mx-auto box-border flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full font-[\'Poppins\',sans-serif] text-sm leading-none transition-colors';
                          let cellClass: string;
                          if (isTodayCell) {
                            cellClass = `${circleBase} border border-[var(--color-brand-primary)] bg-[#FEF0ED] font-normal ${dayNumClass}`;
                          } else if (endpoint) {
                            cellClass = `${circleBase} bg-[#f96c50] font-medium text-white`;
                          } else {
                            cellClass = `relative z-[1] flex h-8 w-full items-center justify-center rounded-md bg-transparent font-[\'Poppins\',sans-serif] text-sm font-normal transition-colors ${dayNumClass}`;
                          }
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => onDayPick(cell)}
                              className={cellClass}
                            >
                              {cell.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {segment === 'month' ? (
              <div className="flex w-full flex-col gap-2">
                <div className="grid grid-cols-6 gap-2">
                  {MONTH_SHORT.map((abbr, idx) => {
                    const sel = cursorDate.getMonth() === idx && cursorDate.getFullYear() === monthPickYear;
                    return (
                      <button
                        key={abbr}
                        type="button"
                        onClick={() => {
                          const dim = daysInMonth(monthPickYear, idx);
                          const next = new Date(monthPickYear, idx, Math.min(cursorDate.getDate(), dim));
                          let s: Date;
                          let e: Date;
                          if (!draftStart) {
                            s = next;
                            e = next;
                          } else if (!draftEnd) {
                            if (activeEnd === 'end') {
                              s = draftStart;
                              e = next;
                            } else {
                              s = next;
                              e = draftStart;
                            }
                          } else {
                            s = activeEnd === 'start' ? next : draftStart;
                            e = activeEnd === 'end' ? next : draftEnd;
                          }
                          const [lo, hi] = orderedRangeEnds(s, e);
                          setDraftStart(lo);
                          setDraftEnd(hi);
                          setCalendarMonth(new Date(monthPickYear, idx, 1));
                        }}
                        className={[
                          'flex h-8 items-center justify-center rounded-xl border border-[rgba(51,51,51,0.2)] font-[\'Poppins\',sans-serif] text-sm text-[#707070] transition-colors',
                          sel ? 'border-transparent bg-[#f96c50] font-semibold text-white' : '',
                        ].join(' ')}
                      >
                        {abbr}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {segment === 'year' ? (
              <div className="flex w-full flex-col gap-2">
                {yearRows.map((row) => (
                  <div key={row.join()} className="flex gap-2">
                    {row.map((y) => {
                      const sel = cursorDate.getFullYear() === y;
                      return (
                        <button
                          key={y}
                          type="button"
                          onClick={() => {
                            const dim = Math.min(cursorDate.getMonth(), 11);
                            const maxD = daysInMonth(y, dim);
                            const d = Math.min(cursorDate.getDate(), maxD);
                            const next = new Date(y, dim, d);
                            let s: Date;
                            let e: Date;
                            if (!draftStart) {
                              s = next;
                              e = next;
                            } else if (!draftEnd) {
                              if (activeEnd === 'end') {
                                s = draftStart;
                                e = next;
                              } else {
                                s = next;
                                e = draftStart;
                              }
                            } else {
                              s = activeEnd === 'start' ? next : draftStart;
                              e = activeEnd === 'end' ? next : draftEnd;
                            }
                            const [lo, hi] = orderedRangeEnds(s, e);
                            setDraftStart(lo);
                            setDraftEnd(hi);
                            setMonthPickYear(y);
                            setCalendarMonth(new Date(y, dim, 1));
                          }}
                          className={[
                            'flex h-8 min-w-0 flex-1 items-center justify-center rounded-xl border px-2 font-[\'Poppins\',sans-serif] text-xs transition-colors',
                            sel ? 'border-transparent bg-[#f96c50] font-semibold text-white' : 'border-[rgba(51,51,51,0.15)] font-medium text-[#707070]',
                          ].join(' ')}
                        >
                          {y}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      <div className="mt-3 h-px w-full bg-[#e8e8e8]" aria-hidden />

      <div className="flex shrink-0 items-center justify-end gap-3 pr-1 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-20 items-center justify-center rounded-xl border border-[#d6d6d6] bg-gradient-to-b from-white to-white/60 font-['Poppins',sans-serif] text-xs font-medium text-[#333333] outline-none transition-colors hover:bg-[#fafafa] focus-visible:ring-2 focus-visible:ring-[#b6bec8]"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={applyIncomplete}
          onClick={onApplyClick}
          className="flex h-8 w-20 items-center justify-center rounded-xl bg-[#333333] font-['Poppins',sans-serif] text-xs font-medium text-white outline-none transition-colors hover:bg-[#1a1a1a] focus-visible:ring-2 focus-visible:ring-[#b6bec8] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Apply
        </button>
      </div>
    </div>
  );

  return createPortal(menu, document.body);
}

type TimelinePickerFieldProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  layout?: Layout;
  toolbarPair?: boolean;
};

export function TimelinePickerField({
  label,
  value,
  onChange,
  layout = 'default',
  toolbarPair = false,
}: TimelinePickerFieldProps) {
  const labelId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const hasValue = value.trim() !== '';
  const showSelectedLook = hasValue;

  const wrapClass =
    layout === 'toolbar'
      ? toolbarPair
        ? 'relative min-w-0 flex-1 basis-0'
        : 'relative w-auto min-w-0 max-w-[min(100%,16rem)] shrink-0 sm:min-w-[11rem]'
      : 'relative w-full min-w-0 shrink-0 sm:w-auto';

  const display = hasValue ? value.trim() : HEADER_TIMELINE_PLACEHOLDER;

  return (
    <div ref={anchorRef} className={wrapClass}>
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={() => setOpen((o) => !o)}
        style={showSelectedLook ? { color: '#333333', fontWeight: 500 } : undefined}
        className={[
          "flex h-12 min-h-12 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-xl border border-[#e4e4e4] bg-[#FFF] px-4 py-0 text-left font-['Poppins',sans-serif] text-sm outline-none ring-[var(--color-brand-primary)] transition-[background-color,border-color,box-shadow,color] duration-150 hover:border-[var(--color-brand-primary)] hover:bg-[#FFF] hover:shadow-none hover:ring-2 hover:ring-[var(--ring-input-focus)] focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring-input-focus)] active:border-[var(--color-brand-primary)] active:ring-2 active:ring-[var(--ring-input-focus)] sm:min-w-[11rem]",
          layout === 'toolbar' ? (toolbarPair ? 'w-full min-w-0' : 'w-full min-w-[11rem]') : 'w-full sm:w-auto',
          showSelectedLook ? '' : 'font-normal text-[#999999]',
        ].join(' ')}
      >
        <span className="min-w-0 flex-1 truncate">{display}</span>
        <IconChevronDown
          className={`pointer-events-none size-5 shrink-0 text-[var(--color-brand-primary)] transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      <TimelineMenu
        open={open}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
        appliedValue={value}
        onApply={(next) => onChange(next)}
      />
    </div>
  );
}
