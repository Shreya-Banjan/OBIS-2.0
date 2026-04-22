import type { CanvasKpiWidgetTier } from '../../types';
import type { CanvasWidgetKpiTileBaseProps } from './canvasWidgetKpiTypes';
import { CanvasWidgetKpiTileL1 } from './CanvasWidgetKpiTileL1';
import { CanvasWidgetKpiTileL2 } from './CanvasWidgetKpiTileL2';

export type { CanvasWidgetKpiTileBaseProps } from './canvasWidgetKpiTypes';

export type CanvasWidgetKpiTileProps = CanvasWidgetKpiTileBaseProps & {
  /** Canvas slot size: **L1** = narrow column, **L2** = wide / emphasis column. */
  tier: CanvasKpiWidgetTier;
};

/**
 * Routes KPI canvas presentation by slot tier (**L1** vs **L2**) — separate components per layout.
 */
export function CanvasWidgetKpiTile({ tier, ...props }: CanvasWidgetKpiTileProps) {
  if (tier === 'l2') {
    return <CanvasWidgetKpiTileL2 {...props} />;
  }
  return <CanvasWidgetKpiTileL1 {...props} />;
}
