import type { CanvasWidgetKpiTileBaseProps } from './canvasWidgetKpiTypes';
import { CanvasWidgetKpiMetricColumn, CanvasWidgetKpiOverlayChrome, KPI_DEFINITION_FOOTER_SURFACE } from './canvasWidgetKpiParts';

/**
 * KPI canvas tile for **L1** (narrow) slots: equal columns, sidebar halves, four-up cells, stacked mobile.
 * Definition sits in a full-width footer under the metric stack.
 * NOTE: Demo sparkline is enabled only for L1 in `DashboardCanvas` (wide L2 slots omit it).
 */
export function CanvasWidgetKpiTileL1({
  displayLabel,
  displayLabelCompact,
  catalogEyebrow,
  definition = '',
  valueDemo = '2.1%',
  valueUnit,
  metricDeltaChip,
  metricSparkline,
  periodContextLabel,
  attributes,
  listeners,
  onChangeClick,
  onRemoveClick,
}: CanvasWidgetKpiTileBaseProps) {
  const definitionTrimmed = definition.trim();
  return (
    <div className="relative isolate flex h-full min-h-0 w-full min-w-0 flex-col">
      <CanvasWidgetKpiMetricColumn
        displayLabel={displayLabel}
        displayLabelCompact={displayLabelCompact}
        catalogEyebrow={catalogEyebrow}
        valueDemo={valueDemo}
        valueUnit={valueUnit}
        metricDeltaChip={metricDeltaChip}
        metricSparkline={metricSparkline}
        periodContextLabel={periodContextLabel}
        className="px-6 pb-3 pt-4"
      />

      {definitionTrimmed ? (
        <footer
          data-kpi-definition-rail="l1"
          className={[
            'relative z-0 box-border shrink-0 px-[24px] pt-5 pb-[24px]',
            KPI_DEFINITION_FOOTER_SURFACE,
          ].join(' ')}
        >
          <p className="text-left font-['Inter',sans-serif] text-[13px] font-normal leading-snug text-[#555555] break-words">
            {definitionTrimmed}
          </p>
        </footer>
      ) : null}

      <CanvasWidgetKpiOverlayChrome
        displayLabel={displayLabel}
        attributes={attributes}
        listeners={listeners}
        onChangeClick={onChangeClick}
        onRemoveClick={onRemoveClick}
      />
    </div>
  );
}
