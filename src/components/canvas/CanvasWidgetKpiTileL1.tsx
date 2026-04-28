import type { CanvasWidgetKpiTileBaseProps } from './canvasWidgetKpiTypes';
import { CanvasWidgetKpiMetricColumn, CanvasWidgetKpiOverlayChrome, KPI_DEFINITION_FOOTER_SURFACE } from './canvasWidgetKpiParts';
import { useKpiExpandPointerHandlers } from './useKpiExpandPointerHandlers';

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
  onKpiExpandToggle,
  kpiExpandToggleEnabled,
  kpiExpandedByUser,
  onOpenKpiL3Detail: _onOpenKpiL3Detail,
  kpiL3DetailOpenEnabled: _kpiL3DetailOpenEnabled,
}: CanvasWidgetKpiTileBaseProps) {
  const definitionTrimmed = definition.trim();
  const expandBody = Boolean(kpiExpandToggleEnabled && onKpiExpandToggle);
  const expandPointer = useKpiExpandPointerHandlers(onKpiExpandToggle, expandBody);
  return (
    <div className="relative isolate flex h-full min-h-0 w-full min-w-0 flex-col">
      <div
        className={expandBody ? 'flex min-h-0 min-w-0 flex-1 cursor-pointer flex-col' : 'flex min-h-0 min-w-0 flex-1 flex-col'}
        role={expandBody ? 'button' : undefined}
        tabIndex={expandBody ? 0 : undefined}
        aria-expanded={expandBody ? Boolean(kpiExpandedByUser) : undefined}
        aria-label={expandBody ? 'Expand or collapse KPI detail' : undefined}
        onPointerDown={expandPointer.onPointerDown}
        onPointerUp={expandPointer.onPointerUp}
        onPointerCancel={expandPointer.onPointerCancel}
        onKeyDown={
          expandBody
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onKpiExpandToggle?.();
                }
              }
            : undefined
        }
      >
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
