import { DASHBOARD_BANNER_DEFAULT_BACKGROUND_PATH } from '../canvasWidgetSlot';
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
  bannerText,
  bannerBackgroundDataUrl,
}: {
  layout?: SectionLayoutPreset;
  widgets: PlacedWidget[];
  compact: boolean;
  bannerText?: string;
  bannerBackgroundDataUrl?: string | null;
}) {
  const sc = slotClass(compact);
  const cell = (w: PlacedWidget) => (
    <span key={w.instanceId} className={sc}>
      {w.label}
    </span>
  );
  const [a, b, c] = widgets;

  const preset = layout ?? 'full';

  if (widgets.length === 0 && preset !== 'banner-top' && preset !== 'section-header') {
    return (
      <span className={`font-['Inter',sans-serif] text-[#707070]/80 ${compact ? 'text-[7px]' : 'text-[9px]'}`}>
        Empty
      </span>
    );
  }

  switch (preset) {
    case 'full':
      return (
        <div
          className={`flex min-h-0 flex-col gap-0.5 overflow-hidden ${compact ? 'max-h-full' : ''}`}
        >
          {widgets.map(cell)}
        </div>
      );
    case 'sidebar-left':
      return (
        <div className={`flex min-h-0 flex-row gap-0.5 overflow-hidden ${compact ? 'max-h-full' : ''}`}>
          <div className="min-h-0 min-w-0 flex-1 basis-0 overflow-hidden">{a ? cell(a) : null}</div>
          <div className="min-h-0 min-w-0 flex-1 basis-0 overflow-hidden">{b ? cell(b) : null}</div>
        </div>
      );
    case 'sidebar-right':
      return (
        <div className={`flex min-h-0 flex-row gap-0.5 overflow-hidden ${compact ? 'max-h-full' : ''}`}>
          <div className="min-h-0 min-w-0 flex-1 basis-0 overflow-hidden">{a ? cell(a) : null}</div>
          <div className="min-h-0 min-w-0 flex-1 basis-0 overflow-hidden">{b ? cell(b) : null}</div>
        </div>
      );
    case 'three-column':
    case 'three-column-right': {
      const pairFirst = preset === 'three-column';
      const pair = (
        <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-row gap-0.5 overflow-hidden">
          <div className="min-h-0 min-w-0 flex-1 basis-0 overflow-hidden">{a ? cell(a) : null}</div>
          <div className="min-h-0 min-w-0 flex-1 basis-0 overflow-hidden">{b ? cell(b) : null}</div>
        </div>
      );
      const large = (
        <div className="min-h-0 min-w-0 flex-1 basis-0 overflow-hidden">{c ? cell(c) : null}</div>
      );
      return (
        <div className={`flex min-h-0 flex-row gap-0.5 overflow-hidden ${compact ? 'max-h-full' : ''}`}>
          {pairFirst ? pair : large}
          {pairFirst ? large : pair}
        </div>
      );
    }
    case 'three-column-middle':
      return (
        <div className={`flex min-h-0 flex-row gap-0.5 overflow-hidden ${compact ? 'max-h-full' : ''}`}>
          <div className="min-h-0 min-w-0 flex-[1_1_0%] overflow-hidden">{a ? cell(a) : null}</div>
          <div className="min-h-0 min-w-0 flex-[2_1_0%] overflow-hidden">{c ? cell(c) : null}</div>
          <div className="min-h-0 min-w-0 flex-[1_1_0%] overflow-hidden">{b ? cell(b) : null}</div>
        </div>
      );
    case 'two-large': {
      const [l, r] = widgets;
      return (
        <div className={`flex min-h-0 flex-row gap-0.5 overflow-hidden ${compact ? 'max-h-full' : ''}`}>
          <div className="min-h-0 min-w-0 flex-[2_1_0%] overflow-hidden">{l ? cell(l) : null}</div>
          <div className="min-h-0 min-w-0 flex-[2_1_0%] overflow-hidden">{r ? cell(r) : null}</div>
        </div>
      );
    }
    case 'four-small':
      return (
        <div className={`flex min-h-0 flex-row gap-0.5 overflow-hidden ${compact ? 'max-h-full' : ''}`}>
          {widgets.slice(0, 4).map((w) => (
            <div key={w.instanceId} className="min-h-0 min-w-0 flex-1 basis-0 overflow-hidden">
              {cell(w)}
            </div>
          ))}
        </div>
      );
    case 'banner-top': {
      const text = (bannerText ?? '').trim();
      const customBg = bannerBackgroundDataUrl?.trim();
      const thumbBgUrl = customBg || DASHBOARD_BANNER_DEFAULT_BACKGROUND_PATH;
      return (
        <div
          className={`relative flex min-h-0 w-full shrink-0 flex-row overflow-hidden rounded border border-[#c5c9ce] ${compact ? 'min-h-[14px]' : 'min-h-[18px]'} ${customBg ? '' : 'bg-white'}`}
        >
          <div
            className={`pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat ${customBg ? '' : 'opacity-70'}`}
            style={{ backgroundImage: `url(${thumbBgUrl})` }}
            aria-hidden
          />
          {customBg ? (
            <div
              className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/55 via-black/20 to-transparent"
              aria-hidden
            />
          ) : null}
          <div
            className={`relative z-[2] flex min-h-0 min-w-0 shrink-0 flex-col justify-center border-r border-white/10 px-1 py-px ${compact ? 'w-[42%]' : 'w-[44%]'}`}
            style={{ background: 'rgb(0 0 0 / 0.48)' }}
          >
            <span
              className={`truncate font-[family-name:var(--font-poppins)] font-semibold leading-tight text-white ${compact ? 'text-[6px]' : 'text-[7px]'}`}
            >
              {text || 'Banner'}
            </span>
          </div>
          <div className="relative z-[2] min-h-0 min-w-0 flex-1 bg-transparent" />
        </div>
      );
    }
    case 'section-header': {
      const text = (bannerText ?? '').trim();
      const customBg = bannerBackgroundDataUrl?.trim();
      return (
        <div
          className={`relative flex min-h-0 w-full shrink-0 items-center overflow-hidden rounded border border-[#c5c9ce] px-1 ${compact ? 'min-h-[10px]' : 'min-h-[12px]'}`}
        >
          <div
            className={
              customBg
                ? 'pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat'
                : 'pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-[#fafbfc] via-[#f0f1f3] to-[#e3e4e7]'
            }
            style={customBg ? { backgroundImage: `url(${customBg})` } : undefined}
            aria-hidden
          />
          {customBg ? (
            <div
              className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-black/35 to-transparent"
              aria-hidden
            />
          ) : null}
          <span
            className={`relative z-[2] min-w-0 flex-1 truncate font-[family-name:var(--font-poppins)] font-semibold leading-tight ${customBg ? 'text-white [text-shadow:0_1px_1px_rgb(0_0_0/0.35)]' : 'text-[#333333]'} ${compact ? 'text-[6px]' : 'text-[8px]'}`}
          >
            {text || 'Section'}
          </span>
        </div>
      );
    }
  }
}

/** Compact non-interactive preview of the dashboard layout (thumbnail-style). */
export function DashboardThumbnail({ sections, title, compact }: DashboardThumbnailProps) {
  /** Compact tiles sit inside a fixed `aspect-[5/3]` wrapper on the list page so every card matches. */
  const frame = compact
    ? 'flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl'
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
        <div className={`flex min-h-0 ${contentH} flex-col gap-1.5 overflow-hidden sm:gap-2`}>
          {sections.map((section) => (
            <div
              key={section.id}
              className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-[var(--shadow-subtle)] ${compact ? 'p-1.5' : 'p-2'}`}
            >
              <div
                className={
                  compact
                    ? 'mb-1 h-1 w-6 shrink-0 rounded-full bg-[#e4e4e4]'
                    : 'mb-1.5 h-1.5 w-10 shrink-0 rounded-full bg-[#e4e4e4]'
                }
                aria-hidden
              />
              <div className="min-h-0 flex-1 overflow-hidden">
                <ThumbnailSectionSlots
                  layout={section.layout}
                  widgets={section.widgets}
                  compact={Boolean(compact)}
                  bannerText={section.bannerText}
                  bannerBackgroundDataUrl={section.bannerBackgroundDataUrl}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
