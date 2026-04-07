import type { DashboardSection, PlacedWidget, SectionLayoutPreset } from '../types';

type DashboardThumbnailProps = {
  sections: DashboardSection[];
  title?: string;
  /** Smaller frame for dashboard list tiles. */
  compact?: boolean;
};

function slotClass(compact: boolean) {
  return `min-w-0 truncate rounded border border-[#d7d7d7] bg-[#fafafa] font-['Inter',sans-serif] leading-tight text-[#1e1e1f]/80 ${
    compact ? 'px-1 py-px text-[7px]' : 'px-1.5 py-0.5 text-[9px]'
  }`;
}

/** Mirrors canvas section layouts so list thumbnails match the editor structure. */
function ThumbnailSectionSlots({
  layout,
  widgets,
  compact,
}: {
  layout?: SectionLayoutPreset;
  widgets: PlacedWidget[];
  compact: boolean;
}) {
  const sc = slotClass(compact);
  const cell = (w: PlacedWidget) => (
    <span key={w.instanceId} className={sc}>
      {w.label}
    </span>
  );
  const [a, b, c] = widgets;

  if (widgets.length === 0) {
    return (
      <span className={`font-['Inter',sans-serif] text-[#707070]/80 ${compact ? 'text-[7px]' : 'text-[9px]'}`}>
        Empty
      </span>
    );
  }

  const preset = layout ?? 'full';

  switch (preset) {
    case 'full':
      return <div className="flex flex-col gap-0.5">{widgets.map(cell)}</div>;
    case 'sidebar-left':
      return (
        <div className="flex flex-row gap-0.5">
          <div className="min-w-0 flex-1 basis-0">{a ? cell(a) : null}</div>
          <div className="min-w-0 flex-1 basis-0">{b ? cell(b) : null}</div>
        </div>
      );
    case 'sidebar-right':
      return (
        <div className="flex flex-row gap-0.5">
          <div className="min-w-0 flex-1 basis-0">{a ? cell(a) : null}</div>
          <div className="min-w-0 flex-1 basis-0">{b ? cell(b) : null}</div>
        </div>
      );
    case 'three-column':
      return (
        <div className="flex flex-row gap-0.5">
          <div className="min-w-0 flex-1 basis-0">{a ? cell(a) : null}</div>
          <div className="min-w-0 flex-1 basis-0">{b ? cell(b) : null}</div>
          <div className="min-w-0 flex-1 basis-0">{c ? cell(c) : null}</div>
        </div>
      );
  }
}

/** Compact non-interactive preview of the dashboard layout (thumbnail-style). */
export function DashboardThumbnail({ sections, title, compact }: DashboardThumbnailProps) {
  const frame = compact
    ? 'flex min-h-0 flex-col aspect-[5/3] w-full overflow-hidden rounded-xl'
    : 'flex min-h-0 flex-col aspect-[16/10] w-full overflow-hidden rounded-xl bg-transparent p-3 sm:p-4';
  const titleCls = compact
    ? "mb-1 truncate font-['Poppins',sans-serif] text-[10px] font-semibold text-[#1e1e1f]"
    : "mb-2 truncate font-['Poppins',sans-serif] text-xs font-semibold text-[#1e1e1f] sm:text-sm";
  const emptyH =
    compact && title ? 'h-[calc(100%-0.75rem)]' : compact ? 'h-full' : 'h-[calc(100%-1.5rem)]';
  const emptyText = compact ? 'text-[9px]' : 'text-[11px]';

  const contentH =
    compact && title
      ? 'h-[calc(100%-0.75rem)]'
      : compact
        ? 'h-full'
        : title
          ? 'h-[calc(100%-1.5rem)]'
          : 'h-full';

  return (
    <div className={frame} data-neuron-thumb="v2">
      {title ? <p className={titleCls}>{title}</p> : null}
      {sections.length === 0 ? (
        <div
          className={`flex w-full min-w-0 ${emptyH} items-center justify-center bg-[#f5f5f5] ${compact ? 'rounded-none' : 'rounded-lg'}`}
        >
          <span className={`font-['Inter',sans-serif] ${emptyText} text-[#707070]`}>No preview yet</span>
        </div>
      ) : (
        <div className={`flex ${contentH} flex-col gap-1.5 overflow-hidden sm:gap-2`}>
          {sections.map((section) => (
            <div
              key={section.id}
              className={`min-h-0 flex-1 rounded-lg bg-white shadow-[var(--shadow-subtle)] ${compact ? 'p-1.5' : 'p-2'}`}
            >
              <div
                className={
                  compact
                    ? 'mb-1 h-1 w-6 rounded-full bg-[#e4e4e4]'
                    : 'mb-1.5 h-1.5 w-10 rounded-full bg-[#e4e4e4]'
                }
                aria-hidden
              />
              <ThumbnailSectionSlots layout={section.layout} widgets={section.widgets} compact={Boolean(compact)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
