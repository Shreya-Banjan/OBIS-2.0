/**
 * Suspense fallback while the dashboard list chunk loads — matches list shell + grid.
 * Uses global `.skeleton-shimmer` (`index.css`).
 */
const TILE_PLACEHOLDERS = 8;

type DashboardListPageSkeletonProps = {
  reportsContentMaxWidth: number;
};

export function DashboardListPageSkeleton({
  reportsContentMaxWidth,
}: DashboardListPageSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading reports"
      className="min-h-dvh overflow-x-hidden bg-[#ebebeb] px-3 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] font-[family-name:var(--font-inter)] sm:px-4"
    >
      <div className="mb-5 flex w-full min-w-0 items-center gap-2 sm:gap-3">
        <div className="skeleton-shimmer h-14 w-14 shrink-0 rounded-[16px] sm:h-16 sm:w-16" aria-hidden />
        <div className="skeleton-shimmer h-14 min-h-[3.5rem] min-w-0 flex-1 rounded-[16px] sm:h-16" aria-hidden />
        <div className="skeleton-shimmer h-14 w-14 shrink-0 rounded-[16px] sm:h-16 sm:w-16" aria-hidden />
      </div>
      <div
        className="@container mx-auto w-full"
        style={{ maxWidth: `${reportsContentMaxWidth}px` }}
      >
        <div className="flex w-full min-w-0 flex-col gap-5">
          <div className="flex w-full min-w-0 flex-col gap-3 @sm:flex-row @sm:items-center @sm:gap-3 @md:gap-4">
            <div
              className="skeleton-shimmer h-12 min-h-12 w-full rounded-[10px] @sm:max-w-[min(100%,42rem)] @sm:flex-1"
              aria-hidden
            />
            <div className="flex w-full flex-wrap gap-2 @sm:contents">
              <div
                className="skeleton-shimmer h-12 min-h-12 w-full rounded-[16px] @sm:w-auto @sm:max-w-[10rem]"
                aria-hidden
              />
              <div className="skeleton-shimmer h-12 min-h-12 w-full rounded-[16px] @sm:max-w-12" aria-hidden />
              <div
                className="skeleton-shimmer h-12 min-h-12 w-full rounded-[16px] @sm:w-auto @sm:max-w-[11rem]"
                aria-hidden
              />
            </div>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 min-[3200px]:grid-cols-5">
            {Array.from({ length: TILE_PLACEHOLDERS }, (_, i) => (
              <li key={i} className="min-w-0">
                <div className="rounded-[24px] bg-white shadow-[var(--shadow-card)]">
                  <div className="flex flex-col gap-3.5 px-[18px] pt-[18px] pb-6">
                    <div className="relative h-[130px] w-full overflow-hidden rounded-[20px] bg-[#f3f5f7]">
                      <div className="skeleton-shimmer absolute inset-0 rounded-[20px]" aria-hidden />
                    </div>
                    <div className="space-y-2">
                      <div className="skeleton-shimmer h-3 w-[88px] max-w-[40%] rounded" aria-hidden />
                      <div className="skeleton-shimmer h-3 w-full max-w-[min(90%,18rem)] rounded" aria-hidden />
                      <div className="skeleton-shimmer h-3 w-32 max-w-[55%] rounded" aria-hidden />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
