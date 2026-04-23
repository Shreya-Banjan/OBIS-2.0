import type { CSSProperties, ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CANVAS_WIDGET_SLOT_HEIGHT_PX,
  SECTION_HEADER_SLOT_HEIGHT_PX,
  canvasWidgetSlotFrameStyle,
} from '../canvasWidgetSlot';
import {
  getWidgetDisplayLabel,
  widgetCatalogEyebrow,
  widgetKpiDefinitionForCanvas,
  widgetKpiDemoMetric,
  widgetKpiLabelCompact,
  widgetUsesKpiCanvasPresentation,
} from '../data/widgets';
import { formatKpiCanvasPeriodLabel } from './TimelinePickerField';
import { NAV_BURGER_MIN_LAYOUT_WIDTH_PX } from '../layoutUtils';
import type { CanvasKpiWidgetTier, DashboardSection, PlacedWidget, SectionLayoutPreset } from '../types';
import { useWidgetLibraryOpen } from '../context/WidgetLibraryContext';
import { IconArrowDown, IconArrowUp, IconClose, IconDrag, IconEdit, IconPlusSoft, IconTrash } from './Icons';
import { CanvasWidgetKpiTile } from './canvas/CanvasWidgetKpiTile';
import { EditorAddWidgetCta } from './EditorAddWidgetCta';
import { EditorDashboardBanner, type BannerSectionUpdates } from './EditorDashboardBanner';

/** Shared view-transition name so the add-section CTA animates when rows are deleted or reordered. */
const addSectionCtaViewTransition: CSSProperties = {
  viewTransitionName: 'neuron-add-section-cta',
};

/**
 * Top chrome strip only — scoped to `group/widget` so section `article.group` does not trigger all tiles.
 * Gradient: white 100% → white 70% opacity (top → bottom).
 */
const CANVAS_ROW_OVERLAY_STRIP =
  'pointer-events-none absolute left-0 right-0 top-0 z-20 opacity-0 transition-opacity duration-200 ease-out motion-reduce:transition-none max-sm:pointer-events-auto max-sm:opacity-100 sm:group-hover/widget:pointer-events-auto sm:group-hover/widget:opacity-100 sm:group-focus-within/widget:pointer-events-auto sm:group-focus-within/widget:opacity-100';

const CANVAS_ROW_OVERLAY_BTN =
  'inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md bg-white text-[#4a4a4c] active:cursor-grabbing';

/**
 * Slot wrapper around each canvas cell. KPI tiles bring their own fixed-height card; legacy row tiles
 * expect the lifted white shell on this wrapper (pre–KPI card behavior).
 */
function canvasSlotShellClass(w: PlacedWidget): string {
  const base = 'min-h-0 min-w-0';
  if (!w.placeholder && widgetUsesKpiCanvasPresentation(w.templateId)) {
    return `${base} rounded-[var(--radius-canvas)] overflow-hidden`;
  }
  return `${base} rounded-[var(--radius-canvas)] bg-white box-border shadow-[var(--shadow-subtle)]`;
}

function SortablePlaceholderSlot({
  sectionId,
  sectionLayout,
  widget,
  isLibraryTarget,
  canvasListL1,
}: {
  sectionId: string;
  sectionLayout?: SectionLayoutPreset;
  widget: PlacedWidget;
  isLibraryTarget: boolean;
  canvasListL1: boolean;
}) {
  const { setNodeRef, attributes, transform, transition, isDragging } = useSortable({
    id: widget.instanceId,
    disabled: true,
    data: {
      source: 'canvas' as const,
      sectionId,
      widget,
      placeholder: true as const,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  const stripSlotHeightPx =
    sectionLayout === 'section-header' ? SECTION_HEADER_SLOT_HEIGHT_PX : undefined;

  return (
    <EditorAddWidgetCta
      ref={setNodeRef}
      layout="canvas"
      placeholderInstanceId={widget.instanceId}
      isLibraryTarget={isLibraryTarget}
      canvasListL1={canvasListL1}
      slotHeightPx={stripSlotHeightPx}
      style={style}
      className="min-h-0 min-w-0 h-full"
      {...attributes}
    />
  );
}

function SortablePlacedWidget({
  sectionId,
  widget,
  onRemove,
  isLibraryTarget,
  canvasListL1,
  kpiWidgetTier,
  kpiPeriodContextLabel,
}: {
  sectionId: string;
  widget: PlacedWidget;
  onRemove: (instanceId: string) => void;
  isLibraryTarget: boolean;
  canvasListL1: boolean;
  kpiWidgetTier: CanvasKpiWidgetTier;
  kpiPeriodContextLabel: string;
}) {
  const openWidgetLibrary = useWidgetLibraryOpen();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.instanceId,
    data: {
      source: 'canvas' as const,
      sectionId,
      widget,
    },
  });

  const displayLabel = getWidgetDisplayLabel(widget.templateId, widget.label);
  const kpi = widgetUsesKpiCanvasPresentation(widget.templateId);

  if (kpi) {
    const kpiDemo = widgetKpiDemoMetric(widget.templateId);
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.55 : 1,
      ...canvasWidgetSlotFrameStyle(canvasListL1),
    };
    const shellClass = [
      'group/widget @container/kpi flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[var(--radius-canvas)] bg-white shadow-[var(--shadow-subtle)]',
      isLibraryTarget
        ? 'border-2 border-solid border-[var(--color-brand-primary)] shadow-[0_0_0_3px_rgba(249,108,80,0.25)]'
        : 'border border-solid border-[#e6e6e6]',
    ].join(' ');

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={shellClass}
        data-neuron-canvas-widget-tier={kpiWidgetTier}
        data-neuron-widget-active={isLibraryTarget ? '' : undefined}
      >
        <CanvasWidgetKpiTile
          tier={kpiWidgetTier}
          displayLabel={displayLabel}
          displayLabelCompact={widgetKpiLabelCompact(widget.templateId)}
          catalogEyebrow={widgetCatalogEyebrow(widget.templateId)}
          definition={widgetKpiDefinitionForCanvas(widget.templateId, kpiWidgetTier)}
          valueDemo={kpiDemo.value}
          valueUnit={kpiDemo.unit}
          metricDeltaChip={kpiDemo.metricDeltaChip}
          metricSparkline={kpiDemo.metricSparkline}
          periodContextLabel={kpiPeriodContextLabel}
          attributes={attributes}
          listeners={listeners as Record<string, unknown> | undefined}
          onChangeClick={(e) => {
            e.stopPropagation();
            openWidgetLibrary(sectionId, widget.instanceId);
          }}
          onRemoveClick={() => onRemove(widget.instanceId)}
        />
      </div>
    );
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'group/widget relative isolate min-h-0 overflow-hidden rounded-[var(--radius-canvas)] bg-white shadow-[var(--shadow-subtle)]',
        isLibraryTarget
          ? 'border-2 border-solid border-[var(--color-brand-primary)] shadow-[0_0_0_3px_rgba(249,108,80,0.25)]'
          : 'border border-[#d7d7d7]',
      ].join(' ')}
      data-neuron-widget-active={isLibraryTarget ? '' : undefined}
    >
      <div className="relative z-0 flex min-h-0 items-center px-3 py-3">
        <span className="min-w-0 font-['Poppins',sans-serif] text-sm leading-snug text-[var(--color-grey-darkest)]/80">
          {displayLabel}
        </span>
      </div>

      <div className={CANVAS_ROW_OVERLAY_STRIP}>
        <div className="relative px-2.5 pb-2 pt-2">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white to-white/70"
            aria-hidden
          />
          <div className="relative z-[1] flex flex-row items-center justify-between gap-2">
            <button
              type="button"
              className={[CANVAS_ROW_OVERLAY_BTN, 'touch-none text-[#1e1e1f]/45'].join(' ')}
              {...listeners}
              {...attributes}
              aria-label={`Reorder ${displayLabel}`}
            >
              <IconDrag className="block size-[18px] shrink-0" aria-hidden />
            </button>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openWidgetLibrary(sectionId, widget.instanceId);
                }}
                className={CANVAS_ROW_OVERLAY_BTN}
                aria-label={`Change ${displayLabel}`}
                title={`Change ${displayLabel}`}
              >
                <IconEdit className="block size-[18px] shrink-0" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onRemove(widget.instanceId)}
                className={CANVAS_ROW_OVERLAY_BTN}
                aria-label={`Clear ${displayLabel}`}
                title={`Clear ${displayLabel}`}
              >
                <IconClose className="block size-[18px] shrink-0" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderSlot(
  section: DashboardSection,
  w: PlacedWidget,
  onRemoveWidget: (sectionId: string, instanceId: string) => void,
  activePlaceholderInstanceId: string | null,
  canvasListL1: boolean,
  kpiWidgetTier: CanvasKpiWidgetTier,
  stackMultiColumnLayout: boolean,
  kpiPeriodContextLabel: string
) {
  const kpiTierEffective: CanvasKpiWidgetTier = stackMultiColumnLayout ? 'l1' : kpiWidgetTier;
  return w.placeholder ? (
    <SortablePlaceholderSlot
      sectionId={section.id}
      sectionLayout={section.layout}
      widget={w}
      isLibraryTarget={activePlaceholderInstanceId === w.instanceId}
      canvasListL1={canvasListL1}
    />
  ) : (
    <SortablePlacedWidget
      sectionId={section.id}
      widget={w}
      onRemove={(id) => onRemoveWidget(section.id, id)}
      isLibraryTarget={activePlaceholderInstanceId === w.instanceId}
      canvasListL1={canvasListL1}
      kpiWidgetTier={kpiTierEffective}
      kpiPeriodContextLabel={kpiPeriodContextLabel}
    />
  );
}

/**
 * Wide layouts use a shared **12-column grid** so L1 / L2 / placeholders get stable 1∶2∶1 (etc.) tracks and
 * top edges line up. Narrow viewports keep stacked `flex` rows.
 */
function SectionLayoutFrame({
  layout,
  section,
  setNodeRef,
  overRing,
  onRemoveWidget,
  activePlaceholderInstanceId,
  stackMultiColumnLayout,
  canvasListL1,
  kpiPeriodContextLabel,
  onBannerSectionChange,
}: {
  layout: SectionLayoutPreset;
  section: DashboardSection;
  setNodeRef: (node: HTMLElement | null) => void;
  overRing: string;
  onRemoveWidget: (sectionId: string, instanceId: string) => void;
  activePlaceholderInstanceId: string | null;
  /** Narrow viewport / preview rail: multi-column presets stack vertically; wide keeps chosen layout. */
  stackMultiColumnLayout: boolean;
  /** Narrow viewport: shorter KPI tile / placeholder height (`canvasWidgetSlotHeightPx`); not the same as widget tier L1/L2. */
  canvasListL1: boolean;
  kpiPeriodContextLabel: string;
  onBannerSectionChange?: (sectionId: string, updates: BannerSectionUpdates) => void;
}) {
  const ws = section.widgets;
  const [a, b, c] = ws;

  const slotFrameStyleForWidget = (w: PlacedWidget): { minHeight: number; maxHeight?: number } | undefined => {
    if (layout === 'section-header' && w.placeholder) {
      return {
        minHeight: SECTION_HEADER_SLOT_HEIGHT_PX,
        maxHeight: SECTION_HEADER_SLOT_HEIGHT_PX,
      };
    }
    if (stackMultiColumnLayout) return undefined;
    return { minHeight: CANVAS_WIDGET_SLOT_HEIGHT_PX };
  };

  const rowMin = stackMultiColumnLayout ? undefined : { minHeight: CANVAS_WIDGET_SLOT_HEIGHT_PX };

  const shell = (inner: ReactNode) => (
    <div ref={setNodeRef} className={`min-w-0 w-full ${overRing}`}>
      {inner}
    </div>
  );

  const wideRow = 'grid w-full min-w-0 grid-cols-12 gap-4';
  const stackCol = 'flex w-full flex-col gap-4';

  const slotWrap = (w: PlacedWidget, wideSpan: string, slotKey: string, children: ReactNode) => (
    <div
      key={slotKey}
      style={slotFrameStyleForWidget(w)}
      className={[
        'flex min-h-0 min-w-0 flex-col self-stretch',
        layout === 'section-header' && w.placeholder ? 'overflow-hidden' : '',
        stackMultiColumnLayout ? 'w-full' : wideSpan,
        canvasSlotShellClass(w),
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );

  switch (layout) {
    case 'full':
      return shell(
        <div className={stackMultiColumnLayout ? stackCol : wideRow}>
          {ws.map((w) =>
            slotWrap(
              w,
              'col-span-12',
              w.instanceId,
              renderSlot(
                section,
                w,
                onRemoveWidget,
                activePlaceholderInstanceId,
                canvasListL1,
                'l2',
                stackMultiColumnLayout,
                kpiPeriodContextLabel
              )
            )
          )}
        </div>
      );

    case 'sidebar-left':
      return shell(
        <div className={stackMultiColumnLayout ? stackCol : wideRow}>
          {a
            ? slotWrap(
                a,
                'col-span-4',
                a.instanceId,
                renderSlot(
                  section,
                  a,
                  onRemoveWidget,
                  activePlaceholderInstanceId,
                  canvasListL1,
                  'l1',
                  stackMultiColumnLayout,
                  kpiPeriodContextLabel
                )
              )
            : null}
          {b
            ? slotWrap(
                b,
                'col-span-8',
                b.instanceId,
                renderSlot(
                  section,
                  b,
                  onRemoveWidget,
                  activePlaceholderInstanceId,
                  canvasListL1,
                  'l1',
                  stackMultiColumnLayout,
                  kpiPeriodContextLabel
                )
              )
            : null}
        </div>
      );

    case 'sidebar-right':
      return shell(
        <div className={stackMultiColumnLayout ? stackCol : wideRow}>
          {a
            ? slotWrap(
                a,
                'col-span-8',
                a.instanceId,
                renderSlot(
                  section,
                  a,
                  onRemoveWidget,
                  activePlaceholderInstanceId,
                  canvasListL1,
                  'l1',
                  stackMultiColumnLayout,
                  kpiPeriodContextLabel
                )
              )
            : null}
          {b
            ? slotWrap(
                b,
                'col-span-4',
                b.instanceId,
                renderSlot(
                  section,
                  b,
                  onRemoveWidget,
                  activePlaceholderInstanceId,
                  canvasListL1,
                  'l1',
                  stackMultiColumnLayout,
                  kpiPeriodContextLabel
                )
              )
            : null}
        </div>
      );

    case 'three-column':
    case 'three-column-right': {
      const pairFirst = layout === 'three-column';
      const pairRow = stackMultiColumnLayout
        ? 'flex w-full min-h-0 min-w-0 flex-row items-stretch gap-4'
        : 'col-span-6 grid min-h-0 min-w-0 grid-cols-2 gap-4';
      const outerRow = stackMultiColumnLayout ? stackCol : wideRow;

      const pairInner = (
        <div className={pairRow}>
          {a ? (
            <div
              key={a.instanceId}
              style={rowMin}
              className={[
                'flex min-h-0 min-w-0 flex-col self-stretch',
                stackMultiColumnLayout ? 'min-h-0 min-w-0 flex-1 basis-0' : '',
                canvasSlotShellClass(a),
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {renderSlot(
                section,
                a,
                onRemoveWidget,
                activePlaceholderInstanceId,
                canvasListL1,
                'l1',
                stackMultiColumnLayout,
                kpiPeriodContextLabel
              )}
            </div>
          ) : null}
          {b ? (
            <div
              key={b.instanceId}
              style={rowMin}
              className={[
                'flex min-h-0 min-w-0 flex-col self-stretch',
                stackMultiColumnLayout ? 'min-h-0 min-w-0 flex-1 basis-0' : '',
                canvasSlotShellClass(b),
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {renderSlot(
                section,
                b,
                onRemoveWidget,
                activePlaceholderInstanceId,
                canvasListL1,
                'l1',
                stackMultiColumnLayout,
                kpiPeriodContextLabel
              )}
            </div>
          ) : null}
        </div>
      );
      const large = c
        ? slotWrap(
            c,
            'col-span-6',
            c.instanceId,
            renderSlot(
              section,
              c,
              onRemoveWidget,
              activePlaceholderInstanceId,
              canvasListL1,
              'l2',
              stackMultiColumnLayout,
              kpiPeriodContextLabel
            )
          )
        : null;

      return shell(
        <div className={outerRow}>
          {pairFirst ? pairInner : large}
          {pairFirst ? large : pairInner}
        </div>
      );
    }

    case 'three-column-middle': {
      const outer = stackMultiColumnLayout ? stackCol : wideRow;
      return shell(
        <div className={outer}>
          {a
            ? slotWrap(
                a,
                'col-span-3',
                a.instanceId,
                renderSlot(
                  section,
                  a,
                  onRemoveWidget,
                  activePlaceholderInstanceId,
                  canvasListL1,
                  'l1',
                  stackMultiColumnLayout,
                  kpiPeriodContextLabel
                )
              )
            : null}
          {c
            ? slotWrap(
                c,
                'col-span-6',
                c.instanceId,
                renderSlot(
                  section,
                  c,
                  onRemoveWidget,
                  activePlaceholderInstanceId,
                  canvasListL1,
                  'l2',
                  stackMultiColumnLayout,
                  kpiPeriodContextLabel
                )
              )
            : null}
          {b
            ? slotWrap(
                b,
                'col-span-3',
                b.instanceId,
                renderSlot(
                  section,
                  b,
                  onRemoveWidget,
                  activePlaceholderInstanceId,
                  canvasListL1,
                  'l1',
                  stackMultiColumnLayout,
                  kpiPeriodContextLabel
                )
              )
            : null}
        </div>
      );
    }

    case 'two-large': {
      const outer = stackMultiColumnLayout ? stackCol : wideRow;
      const [left, right] = ws;
      return shell(
        <div className={outer}>
          {left
            ? slotWrap(
                left,
                'col-span-6',
                left.instanceId,
                renderSlot(
                  section,
                  left,
                  onRemoveWidget,
                  activePlaceholderInstanceId,
                  canvasListL1,
                  'l2',
                  stackMultiColumnLayout,
                  kpiPeriodContextLabel
                )
              )
            : null}
          {right
            ? slotWrap(
                right,
                'col-span-6',
                right.instanceId,
                renderSlot(
                  section,
                  right,
                  onRemoveWidget,
                  activePlaceholderInstanceId,
                  canvasListL1,
                  'l2',
                  stackMultiColumnLayout,
                  kpiPeriodContextLabel
                )
              )
            : null}
        </div>
      );
    }

    case 'four-small':
      return shell(
        <div className={stackMultiColumnLayout ? stackCol : wideRow}>
          {ws.slice(0, 4).map((w) =>
            slotWrap(
              w,
              'col-span-3',
              w.instanceId,
              renderSlot(
                section,
                w,
                onRemoveWidget,
                activePlaceholderInstanceId,
                canvasListL1,
                'l1',
                stackMultiColumnLayout,
                kpiPeriodContextLabel
              )
            )
          )}
        </div>
      );

    case 'banner-top':
      return shell(
        <EditorDashboardBanner
          section={section}
          onChange={(updates) => onBannerSectionChange?.(section.id, updates)}
        />
      );

    case 'section-header': {
      const banner = ws[0];
      return shell(
        <div className={stackMultiColumnLayout ? stackCol : wideRow}>
          {banner
            ? slotWrap(
                banner,
                'col-span-12',
                banner.instanceId,
                renderSlot(
                  section,
                  banner,
                  onRemoveWidget,
                  activePlaceholderInstanceId,
                  canvasListL1,
                  'l2',
                  stackMultiColumnLayout,
                  kpiPeriodContextLabel
                )
              )
            : null}
        </div>
      );
    }
  }
}

/** Overlays the section card; list `gap-1` controls space between section rows. */
function SectionRowActions({
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const moveBtn =
    "flex h-8 min-h-8 shrink-0 cursor-pointer flex-row items-center justify-center gap-1.5 rounded-md px-2 py-0 text-white transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-35 font-['Inter',sans-serif] text-xs font-normal leading-none tracking-tight";

  /** Centers glyphs in a stable 18×18 box (arrow paths are optically centered in `Icons.tsx`). */
  const toolbarIconWrap =
    "grid size-[18px] shrink-0 place-items-center [&>svg]:block [&>svg]:size-[18px]";

  const moveLabel = "flex h-[18px] shrink-0 items-center leading-none";
  const deleteLabel = "flex shrink-0 items-center leading-none";

  return (
    <div
      className="pointer-events-none absolute bottom-2 left-2 z-10 flex w-max items-center rounded-[var(--radius-canvas)] border border-white/20 bg-[rgb(0_0_0/0.9)] p-1 opacity-0 shadow-[var(--shadow-elevated)] transition-opacity duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
      role="toolbar"
      aria-label="Section row actions"
    >
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          className={moveBtn}
          disabled={!canMoveUp}
          onClick={onMoveUp}
          aria-label="Move section up"
          title="Move up"
        >
          <span className={toolbarIconWrap} aria-hidden>
            <IconArrowUp />
          </span>
          <span className={moveLabel}>Up</span>
        </button>
        <button
          type="button"
          className={moveBtn}
          disabled={!canMoveDown}
          onClick={onMoveDown}
          aria-label="Move section down"
          title="Move down"
        >
          <span className={toolbarIconWrap} aria-hidden>
            <IconArrowDown />
          </span>
          <span className={moveLabel}>Down</span>
        </button>
      </div>
      <span className="mx-0.5 h-5 w-px shrink-0 self-center bg-white/25" aria-hidden />
      <button
        type="button"
        className="flex h-8 min-h-8 shrink-0 cursor-pointer flex-row items-center justify-center gap-1.5 rounded-md px-2 py-0 text-white transition-colors hover:bg-white/15 font-['Inter',sans-serif] text-xs font-normal leading-none tracking-tight"
        onClick={onRemove}
        aria-label="Delete row"
        title="Delete row"
      >
        <span className={toolbarIconWrap} aria-hidden>
          <IconTrash />
        </span>
        <span className={deleteLabel}>Delete Row</span>
      </button>
    </div>
  );
}

function SectionCard({
  sections,
  section,
  sectionIndex,
  totalSections,
  onRemoveWidget,
  onRemoveSection,
  onMoveSection,
  activePlaceholderInstanceId,
  stackMultiColumnLayout,
  canvasListL1,
  kpiPeriodContextLabel,
  onBannerSectionChange,
}: {
  sections: DashboardSection[];
  section: DashboardSection;
  sectionIndex: number;
  totalSections: number;
  onRemoveWidget: (sectionId: string, instanceId: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
  activePlaceholderInstanceId: string | null;
  stackMultiColumnLayout: boolean;
  canvasListL1: boolean;
  kpiPeriodContextLabel: string;
  onBannerSectionChange?: (sectionId: string, updates: BannerSectionUpdates) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section:${section.id}`,
    data: { type: 'section', sectionId: section.id },
    disabled: section.layout === 'banner-top',
  });

  const isBannerSection = section.layout === 'banner-top';
  const empty = section.widgets.length === 0;
  const overRing = isOver
    ? 'rounded-[var(--radius-canvas)] ring-2 ring-[#b6bec8] ring-offset-2 ring-offset-[#ebebeb] transition-shadow'
    : '';
  const layout = section.layout;
  const isDashboardBanner = layout === 'banner-top';
  const prevSection = sectionIndex > 0 ? sections[sectionIndex - 1] : undefined;
  /** Banner stays row 0; nothing may sit above it. */
  const canMoveUp =
    sectionIndex > 0 && !isDashboardBanner && prevSection?.layout !== 'banner-top';
  const canMoveDown = !isDashboardBanner && sectionIndex < totalSections - 1;
  const sectionHasWidgetPickerTarget =
    activePlaceholderInstanceId != null &&
    section.widgets.some((w) => w.instanceId === activePlaceholderInstanceId);

  const sectionTransitionStyle = {
    viewTransitionName: `neuron-section-${section.id}`,
  } as CSSProperties;

  return (
    <article
      className="group relative z-0 min-w-0 w-full max-w-full overflow-visible hover:z-[5] focus-within:z-[5]"
      style={sectionTransitionStyle}
    >
      <div className="relative min-w-0">
        <div
          className={[
            'relative min-w-0 overflow-visible rounded-[var(--radius-canvas)] border-[1.25px] border-solid p-2 box-border transition-[background-color,border-color] duration-500 ease-in-out motion-reduce:transition-none',
            sectionHasWidgetPickerTarget
              ? 'border-[#999999] bg-[rgb(153_153_153/0.1)] group-hover:bg-[rgb(153_153_153/0.2)]'
              : 'border-transparent bg-transparent group-hover:border-[#999999] group-hover:bg-[rgb(153_153_153/0.26)]',
          ].join(' ')}
        >
          {isBannerSection ? (
            <SectionLayoutFrame
              layout="banner-top"
              section={section}
              setNodeRef={setNodeRef}
              overRing={overRing}
              onRemoveWidget={onRemoveWidget}
              activePlaceholderInstanceId={activePlaceholderInstanceId}
              stackMultiColumnLayout={stackMultiColumnLayout}
              canvasListL1={canvasListL1}
              kpiPeriodContextLabel={kpiPeriodContextLabel}
              onBannerSectionChange={onBannerSectionChange}
            />
          ) : (
            <SortableContext id={section.id} items={section.widgets.map((w) => w.instanceId)} strategy={rectSortingStrategy}>
              {empty ? (
                <div ref={setNodeRef} className={`min-w-0 ${overRing}`}>
                  <p className="rounded-[var(--radius-canvas)] border border-dashed border-[#d7d7d7] py-8 text-center font-['Inter',sans-serif] text-sm text-[#707070]">
                    Drop widgets here
                  </p>
                </div>
              ) : layout ? (
                <SectionLayoutFrame
                  layout={layout}
                  section={section}
                  setNodeRef={setNodeRef}
                  overRing={overRing}
                  onRemoveWidget={onRemoveWidget}
                  activePlaceholderInstanceId={activePlaceholderInstanceId}
                  stackMultiColumnLayout={stackMultiColumnLayout}
                  canvasListL1={canvasListL1}
                  kpiPeriodContextLabel={kpiPeriodContextLabel}
                  onBannerSectionChange={onBannerSectionChange}
                />
              ) : (
                <div ref={setNodeRef} className={`flex min-w-0 w-full flex-col gap-2 ${overRing}`}>
                  {section.widgets.map((w) => (
                    <div key={w.instanceId} className={canvasSlotShellClass(w)}>
                      {renderSlot(
                        section,
                        w,
                        onRemoveWidget,
                        activePlaceholderInstanceId,
                        canvasListL1,
                        'l1',
                        stackMultiColumnLayout,
                        kpiPeriodContextLabel
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SortableContext>
          )}
          <SectionRowActions
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            onMoveUp={() => onMoveSection(section.id, 'up')}
            onMoveDown={() => onMoveSection(section.id, 'down')}
            onRemove={() => onRemoveSection(section.id)}
          />
        </div>
      </div>
    </article>
  );
}

type DashboardCanvasProps = {
  sections: DashboardSection[];
  onRequestAddSection: () => void;
  onRemoveWidget: (sectionId: string, instanceId: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
  onBannerSectionChange?: (sectionId: string, updates: BannerSectionUpdates) => void;
  /** Widget instance the library is replacing (placeholder “Select Widget” or placed row via Change). */
  activePlaceholderInstanceId?: string | null;
  /** Window or preview rail width — matches header; below 640px stacks multi-column section layouts. */
  effectiveLayoutWidth: number;
  /** Toolbar timeline value (custom range drives KPI period caption). */
  timelineValue?: string;
};

export function DashboardCanvas({
  sections,
  onRequestAddSection,
  onRemoveWidget,
  onRemoveSection,
  onMoveSection,
  onBannerSectionChange,
  activePlaceholderInstanceId = null,
  effectiveLayoutWidth,
  timelineValue = '',
}: DashboardCanvasProps) {
  const narrowCanvas = effectiveLayoutWidth < NAV_BURGER_MIN_LAYOUT_WIDTH_PX;
  const stackMultiColumnLayout = narrowCanvas;
  const canvasListL1 = narrowCanvas;
  const kpiPeriodContextLabel = formatKpiCanvasPeriodLabel(timelineValue);

  return (
    <div className="flex min-w-0 w-full max-w-full flex-1 flex-col gap-1">
      {sections.length === 0 ? (
        <button
          type="button"
          onClick={onRequestAddSection}
          style={{
            height: 100,
            minHeight: 100,
            maxHeight: 100,
            flexShrink: 0,
            ...addSectionCtaViewTransition,
          }}
          className="group box-border flex w-full shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-[var(--radius-canvas)] bg-white p-3.5 shadow-[var(--shadow-card)] hover:bg-[#fafafa]"
        >
          <IconPlusSoft className="block size-4 shrink-0 text-[var(--color-grey-darkest)]/35 transition-colors group-hover:text-[var(--color-brand-primary)]" aria-hidden />
          <span className="max-w-full text-balance text-center font-['Inter',sans-serif] text-[13px] font-normal leading-snug tracking-tight text-[var(--color-grey-darkest)]/30 transition-colors duration-200 group-hover:text-[var(--color-grey-darkest)]">
            Add Section
          </span>
        </button>
      ) : (
        <>
          {sections.map((s, index) => (
            <SectionCard
              key={s.id}
              sections={sections}
              section={s}
              sectionIndex={index}
              totalSections={sections.length}
              onRemoveWidget={onRemoveWidget}
              onRemoveSection={onRemoveSection}
              onMoveSection={onMoveSection}
              onBannerSectionChange={onBannerSectionChange}
              activePlaceholderInstanceId={activePlaceholderInstanceId}
              stackMultiColumnLayout={stackMultiColumnLayout}
              canvasListL1={canvasListL1}
              kpiPeriodContextLabel={kpiPeriodContextLabel}
            />
          ))}
          <button
            type="button"
            onClick={onRequestAddSection}
            style={{ minHeight: 60, flexShrink: 0, ...addSectionCtaViewTransition }}
            className="group mt-6 box-border flex w-full shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-[var(--radius-canvas)] bg-white px-3.5 py-3 shadow-[var(--shadow-card)] hover:bg-[#fafafa]"
          >
            <IconPlusSoft className="block size-4 shrink-0 text-[var(--color-grey-darkest)]/35 transition-colors group-hover:text-[var(--color-brand-primary)]" aria-hidden />
            <span className="max-w-full text-balance text-center font-['Inter',sans-serif] text-[13px] font-normal leading-snug tracking-tight text-[var(--color-grey-darkest)]/30 transition-colors duration-200 group-hover:text-[var(--color-grey-darkest)]">
              Add Section
            </span>
          </button>
        </>
      )}
    </div>
  );
}
