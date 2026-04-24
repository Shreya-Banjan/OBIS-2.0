import type { DashboardSection } from './types';

/** Default wide row: left `a`, center `c`, right `b` — proportional to former 3:6:3 on a 12-col grid. */
const THREE_MIDDLE_TEMPLATE_DEFAULT = '3fr 6fr 3fr';

/**
 * Wide `three-column-middle`: `grid-template-columns` with `fr` tracks so width trades can CSS-transition.
 * Ratios match prior Tailwind spans (3+6+3, 6+3+3, 3+3+6).
 */
export function threeColumnMiddleWideGridTemplate(section: DashboardSection): string {
  const exp = section.kpiExpandedInstanceId?.trim();
  const [a, b, c] = section.widgets;
  if (!exp) return THREE_MIDDLE_TEMPLATE_DEFAULT;

  const validIds = new Set(
    [a, b, c].filter((w): w is NonNullable<typeof w> => w != null).map((w) => w.instanceId),
  );
  if (!validIds.has(exp)) return THREE_MIDDLE_TEMPLATE_DEFAULT;

  if (a && exp === a.instanceId) {
    return '6fr 3fr 3fr';
  }
  if (b && exp === b.instanceId) {
    return '3fr 3fr 6fr';
  }
  return THREE_MIDDLE_TEMPLATE_DEFAULT;
}
