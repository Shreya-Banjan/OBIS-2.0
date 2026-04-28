import type { DashboardSection, PlacedWidget, SectionLayoutPreset } from './types';

/** Applied to wide rows that animate `grid-template-columns` when KPI expand trades width. */
export const kpiExpandWideGridTransitionClass =
  'transition-[grid-template-columns] duration-300 ease-in-out motion-reduce:transition-none';

function normalizedExpandId(section: DashboardSection): string | null {
  const e = section.kpiExpandedInstanceId?.trim();
  if (!e) return null;
  return section.widgets.some((w) => !w.placeholder && w.instanceId === e) ? e : null;
}

/** `true` when this section type supports KPI expand (width + tier); excludes banner/header strips. */
export function sectionLayoutSupportsKpiExpand(layout: SectionLayoutPreset | undefined): boolean {
  if (layout == null) return true;
  return layout !== 'banner-top' && layout !== 'section-header';
}

/** Default wide row: left `a`, center `c`, right `b` — proportional to former 3:6:3 on a 12-col grid. */
const THREE_MIDDLE_TEMPLATE_DEFAULT = '3fr 6fr 3fr';

/** Wide `three-column-middle`: fr tracks so width trades can CSS-transition. */
export function threeColumnMiddleWideGridTemplate(section: DashboardSection): string {
  const exp = normalizedExpandId(section);
  const [a, b, c] = section.widgets;
  if (!exp) return THREE_MIDDLE_TEMPLATE_DEFAULT;

  const validIds = new Set(
    [a, b, c].filter((w): w is NonNullable<typeof w> => w != null).map((w) => w.instanceId),
  );
  if (!validIds.has(exp)) return THREE_MIDDLE_TEMPLATE_DEFAULT;

  if (a && exp === a.instanceId) return '6fr 3fr 3fr';
  if (b && exp === b.instanceId) return '3fr 3fr 6fr';
  return THREE_MIDDLE_TEMPLATE_DEFAULT;
}

/** Wide `sidebar-left`: `a` narrow, `b` wide by default; expanding either side visibly trades width. */
export function sidebarLeftWideGridTemplate(section: DashboardSection): string {
  const [a, b] = section.widgets;
  if (!a || !b) {
    if (a || b) return '1fr';
    return '4fr 8fr';
  }
  const exp = normalizedExpandId(section);
  if (a && exp === a.instanceId) return '8fr 4fr';
  if (b && exp === b.instanceId) return '2fr 10fr';
  return '4fr 8fr';
}

/** Wide `sidebar-right`: `a` wide, `b` narrow by default; expanding either side visibly trades width. */
export function sidebarRightWideGridTemplate(section: DashboardSection): string {
  const [a, b] = section.widgets;
  if (!a || !b) {
    if (a || b) return '1fr';
    return '8fr 4fr';
  }
  const exp = normalizedExpandId(section);
  if (b && exp === b.instanceId) return '4fr 8fr';
  if (a && exp === a.instanceId) return '10fr 2fr';
  return '8fr 4fr';
}

/** Wide `two-large`: equal halves; expanded side takes 8fr, other 4fr. */
export function twoLargeWideGridTemplate(section: DashboardSection): string {
  const [left, right] = section.widgets;
  if (!left || !right) {
    if (left || right) return '1fr';
    return '6fr 6fr';
  }
  const exp = normalizedExpandId(section);
  if (left && exp === left.instanceId) return '8fr 4fr';
  if (right && exp === right.instanceId) return '4fr 8fr';
  return '6fr 6fr';
}

/**
 * Wide `three-column` / `three-column-right`: semantic columns are **pair** (`a`+`b`) then **large** (`c`).
 * `pairColumnFirst` matches DOM order (`three-column` = [pair, large], `three-column-right` = [large, pair]).
 */
export function threeColumnPairOuterGridTemplate(section: DashboardSection, pairColumnFirst: boolean): string {
  const [a, b, c] = section.widgets;
  const hasPair = Boolean(a || b);
  const hasLarge = Boolean(c);
  if (!hasPair && !hasLarge) return '1fr';
  if (hasPair && !hasLarge) return '1fr';
  if (!hasPair && hasLarge) return '1fr';

  const exp = normalizedExpandId(section);
  let tpl: string;
  if ((a && exp === a.instanceId) || (b && exp === b.instanceId)) tpl = '8fr 4fr';
  else if (c && exp === c.instanceId) tpl = '4fr 8fr';
  else tpl = '6fr 6fr';
  if (!pairColumnFirst) {
    const parts = tpl.trim().split(/\s+/);
    if (parts.length === 2) return `${parts[1]!} ${parts[0]!}`;
  }
  return tpl;
}

/** Inner pair (`a` | `b`) column split. */
export function threeColumnPairInnerGridTemplate(section: DashboardSection): string {
  const [a, b] = section.widgets;
  if (!a || !b) {
    if (a || b) return '1fr';
    return '1fr 1fr';
  }
  const exp = normalizedExpandId(section);
  if (a && exp === a.instanceId) return '2fr 1fr';
  if (b && exp === b.instanceId) return '1fr 2fr';
  return '1fr 1fr';
}

/** Wide `four-small`: up to four tiles; expanded slot gets 6fr, others share 6fr equally (n≥3). */
export function fourSmallWideGridTemplate(section: DashboardSection): string {
  const ws = section.widgets.slice(0, 4).filter((w): w is PlacedWidget => w != null);
  const n = ws.length;
  if (n === 0) return '1fr';
  const exp = normalizedExpandId(section);
  const idx = exp == null ? -1 : ws.findIndex((w) => w.instanceId === exp);
  if (idx < 0 || exp == null) {
    return Array(n).fill('1fr').join(' ');
  }
  if (n === 1) return '1fr';
  if (n === 2) {
    const [left, right] = ws;
    if (left && exp === left.instanceId) return '8fr 4fr';
    if (right && exp === right.instanceId) return '4fr 8fr';
    return '6fr 6fr';
  }
  const rest = n - 1;
  const restShare = rest > 0 ? 6 / rest : 6;
  return ws.map((_, i) => (i === idx ? '6fr' : `${restShare}fr`)).join(' ');
}
