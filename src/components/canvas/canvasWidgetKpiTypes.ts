import type { DraggableAttributes } from '@dnd-kit/core';

export type CanvasWidgetKpiTileBaseProps = {
  displayLabel: string;
  /** Shorter title in narrow slots / small viewports when the catalog defines `kpiLabelCompact`. */
  displayLabelCompact?: string;
  catalogEyebrow: string;
  definition?: string;
  valueDemo?: string;
  /** When set with `valueDemo`, renders the Figma 716:4258 value + unit row instead of a single em dash. */
  valueUnit?: string;
  /** Trend / delta chip after the unit (Figma 716:4262). */
  metricDeltaChip?: string;
  /** Six-point trend sparkline to the right of metric + period (Figma 716:4264). */
  metricSparkline?: boolean;
  /** Month + year under the metric (from timeline custom range end, or “now”). */
  periodContextLabel: string;
  attributes: DraggableAttributes;
  listeners: Record<string, unknown> | undefined;
  onChangeClick: (e: React.MouseEvent) => void;
  onRemoveClick: () => void;
};
