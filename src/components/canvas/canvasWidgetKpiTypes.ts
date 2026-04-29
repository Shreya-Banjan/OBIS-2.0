import type { DraggableAttributes } from '@dnd-kit/core';

export type CanvasWidgetKpiTileBaseProps = {
  displayLabel: string;
  /** Shorter title in narrow slots / small viewports when the catalog defines `kpiLabelCompact`. */
  displayLabelCompact?: string;
  catalogEyebrow: string;
  definition?: string;
  valueDemo?: string;
  /** With `valueDemo`, renders the Figma 716:4258 value + muted unit row; a trailing `%` in `valueDemo` counts as the unit when this is omitted. */
  valueUnit?: string;
  /** Trend / delta chip after the unit (Figma 716:4262). */
  metricDeltaChip?: string;
  /** Six-point trend sparkline to the right of metric + period (Figma 716:4264). */
  /** When true, `CanvasWidgetKpiMetricColumn` shows the demo trend sparkline; canvas passes this only for L1 slots. */
  metricSparkline?: boolean;
  /** Month + year under the metric (from timeline custom range end, or “now”). */
  periodContextLabel: string;
  /** Toolbar timeline string — drives L2 title-rail trend X axis (MoM / YoY / YTD / custom). */
  kpiTimelineValue?: string;
  /** L2 title column: line vs bar demo chart (toggle in tile chrome). */
  titleRailChartVariant?: 'line' | 'bar';
  attributes: DraggableAttributes;
  listeners: Record<string, unknown> | undefined;
  onChangeClick: (e: React.MouseEvent) => void;
  onRemoveClick: () => void;
  /** Wide canvas: small-movement body click toggles sole L2 expansion for this section. */
  onKpiExpandToggle?: () => void;
  /** When false, ignore `onKpiExpandToggle` (e.g. stacked narrow canvas). */
  kpiExpandToggleEnabled?: boolean;
  /** This instance is `section.kpiExpandedInstanceId` (user-chosen expanded KPI). */
  kpiExpandedByUser?: boolean;
  /** Wide L2: opens KPI L3 detail modal (body tap); optional when editor does not wire L3. */
  onOpenKpiL3Detail?: () => void;
  /** When true with `onOpenKpiL3Detail`, L2 body opens the L3 modal instead of toggling row expand. */
  kpiL3DetailOpenEnabled?: boolean;
  /** Canvas template id — used with dashboard scope flags on the tile shell. */
  templateId?: string;
};
