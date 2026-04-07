import { sectionWidgetsThumbnailGridClass } from '../layoutUtils';
import type { DashboardSection } from '../types';

type DashboardThumbnailProps = {
  sections: DashboardSection[];
  title?: string;
  /** Smaller frame for dashboard list tiles. */
  compact?: boolean;
};

/** Compact non-interactive preview of the dashboard layout (thumbnail-style). */
export function DashboardThumbnail({ sections, title, compact }: DashboardThumbnailProps) {
  const frame = compact
    ? 'aspect-[5/3] w-full p-2'
    : 'aspect-[16/10] w-full p-3 sm:p-4';
  const titleCls = compact
    ? "mb-1 truncate font-['Poppins',sans-serif] text-[10px] font-semibold text-[#1e1e1f]"
    : "mb-2 truncate font-['Poppins',sans-serif] text-xs font-semibold text-[#1e1e1f] sm:text-sm";
  const emptyH = compact ? 'h-[calc(100%-0.75rem)]' : 'h-[calc(100%-1.5rem)]';
  const emptyText = compact ? 'text-[9px]' : 'text-[11px]';

  return (
    <div className="overflow-hidden rounded-xl border border-[#e4e4e4] bg-[#ebebeb] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
      <div className={frame}>
        {title ? <p className={titleCls}>{title}</p> : null}
        {sections.length === 0 ? (
          <div
            className={`flex ${emptyH} items-center justify-center rounded-lg border border-dashed border-[#d7d7d7] bg-white/80`}
          >
            <span className={`font-['Inter',sans-serif] ${emptyText} text-[#707070]`}>No sections yet</span>
          </div>
        ) : (
          <div className={`flex ${compact ? 'h-[calc(100%-0.75rem)]' : 'h-[calc(100%-1.5rem)]'} flex-col gap-1.5 overflow-hidden sm:gap-2`}>
            {sections.map((section) => (
              <div
                key={section.id}
                className={`min-h-0 flex-1 rounded-lg bg-white shadow-[0_1px_3px_rgba(30,30,31,0.08)] ${compact ? 'p-1.5' : 'p-2'}`}
              >
                <div
                  className={
                    compact
                      ? 'mb-1 h-1 w-6 rounded-full bg-[#e4e4e4]'
                      : 'mb-1.5 h-1.5 w-10 rounded-full bg-[#e4e4e4]'
                  }
                  aria-hidden
                />
                <div className={sectionWidgetsThumbnailGridClass(section.layout)}>
                  {section.widgets.length === 0 ? (
                    <span
                      className={`font-['Inter',sans-serif] text-[#707070]/80 ${compact ? 'text-[7px]' : 'text-[9px]'}`}
                    >
                      Empty
                    </span>
                  ) : (
                    section.widgets.map((w) => (
                      <span
                        key={w.instanceId}
                        className={`min-w-0 truncate rounded border border-[#d7d7d7] bg-[#fafafa] font-['Inter',sans-serif] leading-tight text-[#1e1e1f]/80 ${
                          compact ? 'px-1 py-px text-[7px]' : 'px-1.5 py-0.5 text-[9px]'
                        }`}
                      >
                        {w.label}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
