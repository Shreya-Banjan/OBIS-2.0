import type { CanvasKpiWidgetTier } from '../../types';
import { useDashboardScope } from '../../context/DashboardScopeContext';
import { getWidgetSupportsDashboardScope } from '../../data/widgets';
import type { CanvasWidgetKpiTileBaseProps } from './canvasWidgetKpiTypes';
import { CanvasWidgetKpiTileL1 } from './CanvasWidgetKpiTileL1';
import { CanvasWidgetKpiTileL2 } from './CanvasWidgetKpiTileL2';

export type { CanvasWidgetKpiTileBaseProps } from './canvasWidgetKpiTypes';

export type CanvasWidgetKpiTileProps = CanvasWidgetKpiTileBaseProps & {
  /** Canvas slot size: **L1** = narrow column, **L2** = wide / emphasis column. */
  tier: CanvasKpiWidgetTier;
  templateId?: string;
};

/**
 * Routes KPI canvas presentation by slot tier (**L1** vs **L2**) — separate components per layout.
 */
export function CanvasWidgetKpiTile({ tier, templateId, ...props }: CanvasWidgetKpiTileProps) {
  const scope = useDashboardScope();
  const supports = templateId ? getWidgetSupportsDashboardScope(templateId) : undefined;
  const inner = tier === 'l2' ? <CanvasWidgetKpiTileL2 {...props} /> : <CanvasWidgetKpiTileL1 {...props} />;
  if (!supports) return inner;
  return (
    <div
      className="contents"
      data-neuron-dashboard-scope="1"
      data-scope-partner-count={String(scope.partners.length)}
      data-scope-location-count={String(scope.locationLabels.length)}
      data-scope-specialty-count={String(scope.specialtyIds.length)}
    >
      {inner}
    </div>
  );
}
