import type { CanvasWidgetKpiTileBaseProps } from './canvasWidgetKpiTypes';
import { CanvasWidgetKpiMetricColumn, CanvasWidgetKpiOverlayChrome, KPI_DEFINITION_FOOTER_SURFACE } from './canvasWidgetKpiParts';

/**
 * KPI canvas tile for **L2** (wide) slots: title + eyebrow in the main column; value, “As of”, sparkline
 * at the top of the right rail; definition copy **bottom-aligned** in the remaining rail height.
 */
export function CanvasWidgetKpiTileL2({
  displayLabel,
  displayLabelCompact,
  catalogEyebrow,
  definition = '',
  valueDemo = '—',
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
  const metricProps = {
    displayLabel,
    displayLabelCompact,
    catalogEyebrow,
    valueDemo,
    valueUnit,
    metricDeltaChip,
    metricSparkline,
    periodContextLabel,
  };

  return (
    <div className="relative isolate flex h-full min-h-0 w-full min-w-0 flex-col">
      <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
        {definitionTrimmed ? (
          <>
            <CanvasWidgetKpiMetricColumn
              {...metricProps}
              titlesOnly
              className="min-w-0 flex-1 px-5 pb-4 pt-4 pr-3"
            />
            <footer
              data-kpi-definition-rail="l2"
              className={[
                'relative z-0 box-border flex min-h-0 w-[min(48%,18rem)] min-w-[11.5rem] max-w-[18rem] shrink-0 flex-col self-stretch overflow-hidden p-[24px]',
                KPI_DEFINITION_FOOTER_SURFACE,
              ].join(' ')}
            >
              <div className="shrink-0">
                <CanvasWidgetKpiMetricColumn {...metricProps} valuesOnly className="min-w-0" />
              </div>
              <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-end overflow-hidden pt-4">
                <p className="max-h-full min-h-0 overflow-y-auto text-left font-['Inter',sans-serif] text-[13px] font-normal leading-relaxed text-[#4a4a4a] break-words">
                  {definitionTrimmed}
                </p>
              </div>
            </footer>
          </>
        ) : (
          <CanvasWidgetKpiMetricColumn {...metricProps} className="min-w-0 flex-1 px-5 pb-4 pt-4 pr-3" />
        )}
      </div>

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
