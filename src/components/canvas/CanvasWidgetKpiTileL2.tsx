import { useState } from 'react';
import { IconChartBar, IconChartLine } from '../Icons';
import { ToggleGroup } from '../ToggleGroup';
import type { CanvasWidgetKpiTileBaseProps } from './canvasWidgetKpiTypes';
import { CanvasWidgetKpiMetricColumn, CanvasWidgetKpiOverlayChrome, KPI_DEFINITION_FOOTER_SURFACE } from './canvasWidgetKpiParts';

type L2KpiChartViewMode = 'line' | 'bar';

const L2_TITLE_TOGGLE_SEGMENTS = [
  {
    value: 'line' as const,
    label: 'Line chart',
    icon: <IconChartLine className="shrink-0" aria-hidden />,
  },
  {
    value: 'bar' as const,
    label: 'Bar chart',
    icon: <IconChartBar className="shrink-0" aria-hidden />,
  },
] as const;

/**
 * KPI canvas tile for **L2** (wide) slots: title + eyebrow in the main column (~⅔); value, “As of”,
 * and definition copy in a right rail **one-third** of the widget width, definition **bottom-aligned**.
 * NOTE: Demo sparkline is shown only in L1 slots (`DashboardCanvas`); L2 tiles omit it.
 */
export function CanvasWidgetKpiTileL2({
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
  kpiTimelineValue = '',
}: CanvasWidgetKpiTileBaseProps) {
  const [chartViewMode, setChartViewMode] = useState<L2KpiChartViewMode>('line');
  const definitionTrimmed = definition.trim();
  const titleToggle = (
    <ToggleGroup<L2KpiChartViewMode>
      aria-label="KPI chart view"
      variant="kpiTitle"
      value={chartViewMode}
      onValueChange={setChartViewMode}
      segments={L2_TITLE_TOGGLE_SEGMENTS}
    />
  );
  const metricProps = {
    displayLabel,
    displayLabelCompact,
    catalogEyebrow,
    valueDemo,
    valueUnit,
    metricDeltaChip,
    metricSparkline,
    periodContextLabel,
    kpiTimelineValue,
    titleRailChartVariant: chartViewMode,
  };

  return (
    <div className="relative isolate flex h-full min-h-0 w-full min-w-0 flex-col">
      <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
        {definitionTrimmed ? (
          <>
            <CanvasWidgetKpiMetricColumn
              {...metricProps}
              titlesOnly
              titleRowEnd={titleToggle}
              className="min-w-0 flex-1 p-[24px]"
            />
            <footer
              data-kpi-definition-rail="l2"
              className={[
                'relative z-0 box-border flex min-h-0 min-w-0 w-1/3 shrink-0 flex-col self-stretch overflow-hidden p-[24px]',
                KPI_DEFINITION_FOOTER_SURFACE,
              ].join(' ')}
            >
              <div className="w-full min-w-0 shrink-0">
                <CanvasWidgetKpiMetricColumn {...metricProps} valuesOnly className="min-w-0 w-full" />
              </div>
              <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-end overflow-hidden pt-4">
                <p className="max-h-full min-h-0 overflow-y-auto text-left font-['Inter',sans-serif] text-[13px] font-normal leading-relaxed text-[#4a4a4a] break-words">
                  {definitionTrimmed}
                </p>
              </div>
            </footer>
          </>
        ) : (
          <CanvasWidgetKpiMetricColumn
            {...metricProps}
            titleRowEnd={titleToggle}
            className="min-w-0 flex-1 p-[24px]"
          />
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
