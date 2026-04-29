/**
 * L3 KPI detail — six-column registry-style grid (L3 modal).
 * Bottom fade when the table body scrolls (ResizeObserver on the **table** so `scrollHeight`
 * changes are detected — observing only the scroll pane misses inner content growth).
 * Figma: https://www.figma.com/design/2Z3gqwUnoKnsm6U5aQ1Xp2/OBIS2.0?node-id=394-2214
 */
import type { CSSProperties } from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { IconChevronDown, IconChevronUp } from './Icons';

export type KpiL3LosMetric = {
  trend: 'up' | 'down' | 'neutral';
  /** e.g. "4.0 days" */
  text: string;
};

export type KpiL3TrendTableRow = {
  lmrn: string;
  /** Breakdown: partner column (mock / resolved). */
  partnerScope?: string;
  /** Breakdown: location column. */
  facilityLocation?: string;
  surgicalSpeciality: string;
  attendingStaffSurgeon: string;
  monthOfYear: string;
  year: string;
  avgLengthOfStay: string;
  /** Figma L3: colored LOS cell with arrow; when absent, `avgLengthOfStay` string is shown. */
  losMetric?: KpiL3LosMetric;
};

export type KpiL3TrendTableColumnKey = Exclude<keyof KpiL3TrendTableRow, 'losMetric'>;
type ColumnKey = KpiL3TrendTableColumnKey;

const COLUMNS: readonly { key: ColumnKey; label: string; align: 'left' | 'right' }[] = [
  { key: 'lmrn', label: 'LMRN', align: 'left' },
  { key: 'surgicalSpeciality', label: 'Surgical Speciality', align: 'left' },
  { key: 'attendingStaffSurgeon', label: 'Attending/ Staff Surgeon', align: 'left' },
  { key: 'monthOfYear', label: 'Month of the Year', align: 'left' },
  { key: 'year', label: 'Year', align: 'left' },
  { key: 'avgLengthOfStay', label: 'Avg Length of Stay', align: 'right' },
];

/** OBIS2.0 L3 table labels ([Figma 394:2218](https://www.figma.com/design/2Z3gqwUnoKnsm6U5aQ1Xp2/OBIS2.0?node-id=394-2218)). */
const FIGMA_COLUMNS: readonly { key: ColumnKey; label: string; align: 'left' | 'right' }[] = [
  { key: 'lmrn', label: 'Lmrn', align: 'left' },
  { key: 'surgicalSpeciality', label: 'Surgical Speciality', align: 'left' },
  { key: 'attendingStaffSurgeon', label: 'Attending/Staff Surgeon', align: 'left' },
  { key: 'monthOfYear', label: 'Month of the Year', align: 'left' },
  { key: 'year', label: 'Year', align: 'left' },
  { key: 'avgLengthOfStay', label: 'Avg. Length of Stay', align: 'right' },
];

export type KpiL3TrendTableProps = {
  caption: string;
  rows: readonly KpiL3TrendTableRow[];
  scrollAreaClassName?: string;
  className?: string;
  /** `figma` matches OBIS2.0 L3 data grid chrome (rounded header row, sort hints, LOS arrows). */
  visualVariant?: 'legacy' | 'figma';
  /** When set, replaces default column order (e.g. L3 breakdown). Keys must exist on each row. */
  columns?: readonly { key: KpiL3TrendTableColumnKey; label: string; align: 'left' | 'right' }[];
};

const thCellCore =
  "min-w-0 py-3 text-[11px] font-semibold leading-snug tracking-wide text-[#707070] normal-case font-['Inter',system-ui,sans-serif] bg-[#f5f5f5]";
const thCell = `${thCellCore} px-3`;
const thCellFirstCol = `${thCellCore} pl-4 pr-3`;
const thCellLastCol = `${thCellCore} pl-3 pr-4`;

const tdCore =
  "min-w-0 py-3 text-[13px] leading-snug font-['Inter',system-ui,sans-serif] font-normal text-[#333333]";
const tdBase = `${tdCore} px-3`;
const tdFirstCol = `${tdCore} pl-4 pr-3`;
const tdLastCol = `${tdCore} pl-3 pr-4`;

const SCROLL_END_EPS = 6;

const BOTTOM_FADE_STYLE: CSSProperties = {
  background:
    'linear-gradient(to top, rgb(255 255 255) 0%, rgb(255 255 255 / 0.95) 22%, rgb(255 255 255 / 0.55) 55%, rgb(255 255 255 / 0) 100%)',
  boxShadow: '0 -1px 0 rgb(232 232 232 / 0.45)',
};

function KpiL3LosCellFigma({ metric }: { metric: KpiL3LosMetric }) {
  const { trend, text } = metric;
  if (trend === 'neutral') {
    return (
      <span className="inline-flex min-w-0 items-center gap-1">
        <IconChevronUp className="size-3 shrink-0 opacity-10" aria-hidden />
        <span className="min-w-0 text-[13px] font-normal leading-5 text-[#333333]">{text}</span>
      </span>
    );
  }
  if (trend === 'up') {
    return (
      <span className="inline-flex min-w-0 items-center gap-1 text-[#ea2323]">
        <IconChevronUp className="size-3 shrink-0" aria-hidden />
        <span className="min-w-0 text-[13px] font-normal leading-5">{text}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-1 text-[#15a04c]">
      <IconChevronDown className="size-3 shrink-0" aria-hidden />
      <span className="min-w-0 text-[13px] font-normal leading-5">{text}</span>
    </span>
  );
}

export function KpiL3TrendTable({
  caption,
  rows,
  scrollAreaClassName = 'max-h-[min(200px,26dvh)]',
  className,
  visualVariant = 'legacy',
  columns: columnsOverride,
}: KpiL3TrendTableProps) {
  const figma = visualVariant === 'figma';
  const colSpec = columnsOverride ?? (figma ? FIGMA_COLUMNS : COLUMNS);
  const nCols = colSpec.length;
  const scrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const updateBottomFade = useCallback(() => {
    const el = scrollRef.current;
    if (el == null) return;
    const { scrollHeight, clientHeight, scrollTop } = el;
    const overflow = scrollHeight > clientHeight + SCROLL_END_EPS;
    const notAtBottom = scrollTop + clientHeight < scrollHeight - SCROLL_END_EPS;
    setShowBottomFade(overflow && notAtBottom);
  }, []);

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    const tableEl = tableRef.current;
    if (scrollEl == null) return;

    const scheduleMeasure = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(updateBottomFade);
      });
    };

    scheduleMeasure();

    const ro = new ResizeObserver(() => scheduleMeasure());
    ro.observe(scrollEl);
    if (tableEl != null) ro.observe(tableEl);

    scrollEl.addEventListener('scroll', updateBottomFade, { passive: true });
    window.addEventListener('resize', scheduleMeasure, { passive: true });

    return () => {
      ro.disconnect();
      scrollEl.removeEventListener('scroll', updateBottomFade);
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [updateBottomFade, rows.length]);

  const shellClass = figma
    ? ['relative isolate min-h-0 w-full overflow-hidden bg-transparent', className].filter(Boolean).join(' ')
    : ['relative isolate min-h-0 w-full overflow-hidden rounded-[var(--radius-canvas)] bg-white', className]
        .filter(Boolean)
        .join(' ');

  return (
    <div className={shellClass}>
      <div
        ref={scrollRef}
        className={['min-h-0 w-full overflow-auto overscroll-contain', scrollAreaClassName].filter(Boolean).join(' ')}
      >
        <table
          ref={tableRef}
          className={[
            'min-w-[56rem] w-full border-separate border-spacing-0 font-[\'Inter\',system-ui,sans-serif]',
            figma ? 'min-w-[64rem]' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <caption className="sr-only">{caption}</caption>
          <thead
            className={[
              figma ? 'sticky top-0 z-[1]' : 'sticky top-0 z-[1] overflow-hidden rounded-t-[var(--radius-canvas)] bg-[#f5f5f5]',
            ].join(' ')}
          >
            <tr
              className={[
                figma
                  ? 'h-10 border-0 bg-[#f5f5f5] [&>th:first-child]:rounded-l-xl [&>th:last-child]:rounded-r-xl'
                  : 'border-b border-solid border-[#e8e8e8]',
              ].join(' ')}
            >
              {colSpec.map((col, colIdx) => (
                <th
                  key={col.key}
                  scope="col"
                  className={[
                    figma
                      ? [
                          'min-w-0 py-2.5 text-left align-middle font-[\'Inter\',system-ui,sans-serif] text-[13px] font-medium leading-[14px] text-[#707070]',
                          colIdx === 0 ? 'pl-5 pr-2' : '',
                          colIdx === nCols - 1 ? 'pl-2 pr-6 text-right' : colIdx > 0 ? 'px-2' : '',
                        ].join(' ')
                      : [
                          colIdx === 0 ? thCellFirstCol : colIdx === nCols - 1 ? thCellLastCol : thCell,
                          col.align === 'right' ? 'text-right' : 'text-left',
                          colIdx === 0 ? 'rounded-tl-[var(--radius-canvas)] rounded-bl-[16px]' : '',
                          colIdx === nCols - 1 ? 'rounded-r-[16px]' : '',
                          'overflow-hidden',
                        ]
                          .filter(Boolean)
                          .join(' '),
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {figma ? (
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <span className="line-clamp-2 break-words">{col.label}</span>
                      <IconChevronDown className="size-2 shrink-0 opacity-45" aria-hidden />
                    </span>
                  ) : (
                    <span className="line-clamp-2 break-words">{col.label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const last = i === rows.length - 1;
              return (
                <tr
                  key={`${row.lmrn}-${i}`}
                  className={[
                    'bg-white hover:bg-[#fafafa]',
                    figma
                      ? last
                        ? ''
                        : 'border-b border-solid border-[rgba(51,51,51,0.1)]'
                      : last
                        ? ''
                        : 'border-b border-solid border-[#e8e8e8]',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {colSpec.map((col, colIdx) => {
                    const v = row[col.key] ?? '';
                    const isFirst = colIdx === 0;
                    const isLastCol = colIdx === nCols - 1;
                    const roundedBl = !figma && last && isFirst ? 'rounded-bl-[var(--radius-canvas)]' : '';
                    const roundedBr = !figma && last && isLastCol ? 'rounded-br-[var(--radius-canvas)]' : '';

                    if (isFirst) {
                      return (
                        <th
                          key={col.key}
                          scope="row"
                          className={[
                            figma
                              ? "min-w-0 py-2.5 pl-5 pr-2 text-left align-middle font-['Inter',system-ui,sans-serif] text-[13px] font-normal leading-5 text-[#333333]"
                              : [tdFirstCol, 'max-w-[9rem] text-left text-[#4a4a4a]', roundedBl].filter(Boolean).join(' '),
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <span className="block truncate" title={v}>
                            {v}
                          </span>
                        </th>
                      );
                    }

                    const isLos = col.key === 'avgLengthOfStay';
                    const isYear = col.key === 'year';
                    const cellClass = [
                      figma
                        ? [
                            "min-w-0 py-2.5 align-middle font-['Inter',system-ui,sans-serif] text-[13px] font-normal leading-5 text-[#333333]",
                            isLastCol ? 'pl-2 pr-6' : 'px-2',
                            isLos ? 'text-right' : 'text-left',
                            isYear ? 'tabular-nums' : '',
                            roundedBr,
                          ]
                            .filter(Boolean)
                            .join(' ')
                        : [
                            isLastCol ? tdLastCol : tdBase,
                            isLos
                              ? 'text-right text-[13px] font-semibold tabular-nums text-[var(--color-grey-darkest)]'
                              : 'text-left',
                            isYear ? 'tabular-nums' : '',
                            roundedBr,
                          ]
                            .filter(Boolean)
                            .join(' '),
                    ]
                      .filter(Boolean)
                      .join(' ');

                    const inner =
                      col.key === 'surgicalSpeciality' ||
                      col.key === 'partnerScope' ||
                      col.key === 'facilityLocation' ? (
                        <span className="line-clamp-2 break-words" title={v}>
                          {v}
                        </span>
                      ) : isLos && figma && row.losMetric ? (
                        <KpiL3LosCellFigma metric={row.losMetric} />
                      ) : isLos ? (
                        v
                      ) : (
                        <span className="block truncate" title={v}>
                          {v}
                        </span>
                      );

                    return (
                      <td key={col.key} className={cellClass}>
                        {inner}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showBottomFade ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-16"
          style={BOTTOM_FADE_STYLE}
        />
      ) : null}
    </div>
  );
}
