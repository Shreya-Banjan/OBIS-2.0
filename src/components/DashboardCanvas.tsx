import type { CSSProperties, ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getWidgetDisplayLabel } from '../data/widgets';
import type { DashboardSection, PlacedWidget, SectionLayoutPreset } from '../types';
import { useWidgetLibraryOpen } from '../context/WidgetLibraryContext';
import { IconArrowDown, IconArrowUp, IconClose, IconDrag, IconEdit, IconPlusSoft, IconTrash } from './Icons';
import { EditorAddWidgetCta } from './EditorAddWidgetCta';

/** Shared view-transition name so the add-section CTA animates when rows are deleted or reordered. */
const addSectionCtaViewTransition: CSSProperties = {
  viewTransitionName: 'neuron-add-section-cta',
};

/** Slot wrapper — subtle elevation; magenta highlight is on the inner tile (EditorAddWidgetCta / SortablePlacedWidget). */
function slotSurfaceClass() {
  return 'min-h-0 min-w-0 rounded-[var(--radius-canvas)] bg-white box-border shadow-[var(--shadow-subtle)]';
}

function SortablePlaceholderSlot({
  sectionId,
  widget,
  isLibraryTarget,
}: {
  sectionId: string;
  widget: PlacedWidget;
  isLibraryTarget: boolean;
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

  return (
    <EditorAddWidgetCta
      ref={setNodeRef}
      layout="canvas"
      placeholderInstanceId={widget.instanceId}
      isLibraryTarget={isLibraryTarget}
      style={style}
      className="min-w-0"
      {...attributes}
    />
  );
}

function SortablePlacedWidget({
  sectionId,
  widget,
  onRemove,
  isLibraryTarget,
}: {
  sectionId: string;
  widget: PlacedWidget;
  onRemove: (instanceId: string) => void;
  isLibraryTarget: boolean;
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  const displayLabel = getWidgetDisplayLabel(widget.templateId, widget.label);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'group flex min-h-0 flex-col gap-2 rounded-[var(--radius-canvas)] bg-white px-2 py-3 shadow-[var(--shadow-subtle)] sm:flex-row sm:items-center sm:justify-between sm:gap-0',
        isLibraryTarget
          ? 'border-2 border-solid border-[#E20074] shadow-[0_0_0_3px_rgba(226,0,116,0.25)]'
          : 'border border-[#d7d7d7]',
      ].join(' ')}
      data-neuron-widget-active={isLibraryTarget ? '' : undefined}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <button
          type="button"
          className="inline-flex cursor-grab touch-none items-center justify-center text-[#1e1e1f]/35 active:cursor-grabbing"
          {...listeners}
          {...attributes}
          aria-label={`Reorder ${displayLabel}`}
        >
          <IconDrag className="block size-[18px] shrink-0" aria-hidden />
        </button>
        <span className="min-w-0 font-['Poppins',sans-serif] text-sm leading-snug text-black/80">{displayLabel}</span>
      </div>
      <div className="flex flex-wrap items-center gap-0.5 self-start sm:self-auto">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openWidgetLibrary(sectionId, widget.instanceId);
          }}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#606080] opacity-100 transition-opacity duration-150 hover:bg-[#f0f0f0] sm:opacity-0 sm:group-hover:opacity-100"
          aria-label={`Change ${displayLabel}`}
          title={`Change ${displayLabel}`}
        >
          <IconEdit className="block size-[18px] shrink-0" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onRemove(widget.instanceId)}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#606080] hover:bg-[#f0f0f0]"
          aria-label={`Clear ${displayLabel}`}
          title={`Clear ${displayLabel}`}
        >
          <IconClose className="block size-[18px] shrink-0" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function renderSlot(
  section: DashboardSection,
  w: PlacedWidget,
  onRemoveWidget: (sectionId: string, instanceId: string) => void,
  activePlaceholderInstanceId: string | null
) {
  return w.placeholder ? (
    <SortablePlaceholderSlot
      sectionId={section.id}
      widget={w}
      isLibraryTarget={activePlaceholderInstanceId === w.instanceId}
    />
  ) : (
    <SortablePlacedWidget
      sectionId={section.id}
      widget={w}
      onRemove={(id) => onRemoveWidget(section.id, id)}
      isLibraryTarget={activePlaceholderInstanceId === w.instanceId}
    />
  );
}

/**
 * Each layout is a **different DOM shape** (flex rows / columns with fixed Tailwind classes).
 * No shared “one grid, dynamic template” — that was easy to break and hard to reason about.
 */
function SectionLayoutFrame({
  layout,
  section,
  setNodeRef,
  overRing,
  onRemoveWidget,
  activePlaceholderInstanceId,
}: {
  layout: SectionLayoutPreset;
  section: DashboardSection;
  setNodeRef: (node: HTMLElement | null) => void;
  overRing: string;
  onRemoveWidget: (sectionId: string, instanceId: string) => void;
  activePlaceholderInstanceId: string | null;
}) {
  const ws = section.widgets;
  const [a, b, c] = ws;

  const shell = (inner: ReactNode) => (
    <div ref={setNodeRef} className={`min-w-0 w-full ${overRing}`}>
      {inner}
    </div>
  );

  switch (layout) {
    case 'full':
      return shell(
        <div className="flex w-full flex-col gap-[20px]">
          {ws.map((w) => (
            <div key={w.instanceId} className={slotSurfaceClass()}>
              {renderSlot(section, w, onRemoveWidget, activePlaceholderInstanceId)}
            </div>
          ))}
        </div>
      );

    case 'sidebar-left':
      return shell(
        <div className="flex w-full flex-row items-stretch gap-[20px]">
          {a ? (
            <div key={a.instanceId} className={`min-h-0 min-w-0 flex-1 basis-0 ${slotSurfaceClass()}`}>
              {renderSlot(section, a, onRemoveWidget, activePlaceholderInstanceId)}
            </div>
          ) : null}
          {b ? (
            <div key={b.instanceId} className={`min-h-0 min-w-0 flex-1 basis-0 ${slotSurfaceClass()}`}>
              {renderSlot(section, b, onRemoveWidget, activePlaceholderInstanceId)}
            </div>
          ) : null}
        </div>
      );

    case 'sidebar-right':
      return shell(
        <div className="flex w-full flex-row items-stretch gap-[20px]">
          {a ? (
            <div key={a.instanceId} className={`min-h-0 min-w-0 flex-1 basis-0 ${slotSurfaceClass()}`}>
              {renderSlot(section, a, onRemoveWidget, activePlaceholderInstanceId)}
            </div>
          ) : null}
          {b ? (
            <div key={b.instanceId} className={`min-h-0 min-w-0 flex-1 basis-0 ${slotSurfaceClass()}`}>
              {renderSlot(section, b, onRemoveWidget, activePlaceholderInstanceId)}
            </div>
          ) : null}
        </div>
      );

    case 'three-column':
      return shell(
        <div className="flex w-full flex-row items-stretch gap-[20px]">
          {a ? (
            <div key={a.instanceId} className={`min-h-0 min-w-0 flex-1 basis-0 ${slotSurfaceClass()}`}>
              {renderSlot(section, a, onRemoveWidget, activePlaceholderInstanceId)}
            </div>
          ) : null}
          {b ? (
            <div key={b.instanceId} className={`min-h-0 min-w-0 flex-1 basis-0 ${slotSurfaceClass()}`}>
              {renderSlot(section, b, onRemoveWidget, activePlaceholderInstanceId)}
            </div>
          ) : null}
          {c ? (
            <div key={c.instanceId} className={`min-h-0 min-w-0 flex-1 basis-0 ${slotSurfaceClass()}`}>
              {renderSlot(section, c, onRemoveWidget, activePlaceholderInstanceId)}
            </div>
          ) : null}
        </div>
      );
  }
}

/** Sits in bottom padding of the section wrapper so hover stays active while moving to the bar; `left-0` matches canvas edge. */
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
    "inline-flex h-8 min-h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-white transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-35 font-['Inter',sans-serif] text-xs font-normal leading-none tracking-tight";

  return (
    <div
      className="pointer-events-none absolute bottom-0 left-0 z-10 flex w-max items-center rounded-[var(--radius-canvas)] border border-white/20 bg-[rgb(0_0_0/0.9)] p-1 opacity-0 shadow-[var(--shadow-elevated)] transition-opacity duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
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
          <IconArrowUp className="block size-[18px] shrink-0" aria-hidden />
          <span className="leading-none">Up</span>
        </button>
        <button
          type="button"
          className={moveBtn}
          disabled={!canMoveDown}
          onClick={onMoveDown}
          aria-label="Move section down"
          title="Move down"
        >
          <IconArrowDown className="block size-[18px] shrink-0" aria-hidden />
          <span className="leading-none">Down</span>
        </button>
      </div>
      <span className="mx-0.5 h-5 w-px shrink-0 self-center bg-white/25" aria-hidden />
      <button
        type="button"
        className="inline-flex h-8 min-h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-white transition-colors hover:bg-white/15 font-['Inter',sans-serif] text-xs font-normal leading-none tracking-tight"
        onClick={onRemove}
        aria-label="Delete row"
        title="Delete row"
      >
        <IconTrash className="block size-[18px] shrink-0" aria-hidden />
        <span className="leading-none">Delete Row</span>
      </button>
    </div>
  );
}

function SectionCard({
  section,
  sectionIndex,
  totalSections,
  onRemoveWidget,
  onRemoveSection,
  onMoveSection,
  activePlaceholderInstanceId,
}: {
  section: DashboardSection;
  sectionIndex: number;
  totalSections: number;
  onRemoveWidget: (sectionId: string, instanceId: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
  activePlaceholderInstanceId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section:${section.id}`,
    data: { type: 'section', sectionId: section.id },
  });

  const empty = section.widgets.length === 0;
  const overRing = isOver
    ? 'rounded-[var(--radius-canvas)] ring-2 ring-[#b6bec8] ring-offset-2 ring-offset-[#ebebeb] transition-shadow'
    : '';
  const layout = section.layout;
  const canMoveUp = sectionIndex > 0;
  const canMoveDown = sectionIndex < totalSections - 1;
  const sectionHasWidgetPickerTarget =
    activePlaceholderInstanceId != null &&
    section.widgets.some((w) => w.instanceId === activePlaceholderInstanceId);

  const sectionTransitionStyle = {
    viewTransitionName: `neuron-section-${section.id}`,
  } as CSSProperties;

  return (
    <article
      className="group relative z-0 -mb-11 min-w-0 w-full max-w-full overflow-visible hover:z-[5] focus-within:z-[5]"
      style={sectionTransitionStyle}
    >
      <div className="relative min-w-0 pb-11">
        <div
          className={[
            'min-w-0 rounded-[var(--radius-canvas)] border-[1.25px] border-solid p-2 box-border transition-[background-color,border-color] duration-500 ease-in-out motion-reduce:transition-none',
            sectionHasWidgetPickerTarget
              ? 'border-[#999999] bg-[rgb(153_153_153/0.1)] group-hover:bg-[rgb(153_153_153/0.2)]'
              : 'border-transparent bg-transparent group-hover:border-[#999999] group-hover:bg-[rgb(153_153_153/0.26)]',
          ].join(' ')}
        >
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
              />
            ) : (
              <div ref={setNodeRef} className={`flex min-w-0 w-full flex-col gap-2 ${overRing}`}>
                {section.widgets.map((w) => (
                  <div key={w.instanceId} className={slotSurfaceClass()}>
                    {renderSlot(section, w, onRemoveWidget, activePlaceholderInstanceId)}
                  </div>
                ))}
              </div>
            )}
          </SortableContext>
        </div>
        <SectionRowActions
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={() => onMoveSection(section.id, 'up')}
          onMoveDown={() => onMoveSection(section.id, 'down')}
          onRemove={() => onRemoveSection(section.id)}
        />
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
  /** Widget instance the library is replacing (placeholder “Select Widget” or placed row via Change). */
  activePlaceholderInstanceId?: string | null;
};

export function DashboardCanvas({
  sections,
  onRequestAddSection,
  onRemoveWidget,
  onRemoveSection,
  onMoveSection,
  activePlaceholderInstanceId = null,
}: DashboardCanvasProps) {
  return (
    <div className="flex min-w-0 w-full max-w-full flex-1 flex-col gap-[5px]">
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
          <IconPlusSoft className="block size-4 shrink-0 text-black/35 transition-colors group-hover:text-[#E20074]" aria-hidden />
          <span className="max-w-full text-balance text-center font-['Inter',sans-serif] text-[13px] font-normal leading-snug tracking-tight text-black/30 transition-colors duration-200 group-hover:text-[#000]">
            Add Section
          </span>
        </button>
      ) : (
        <>
          {sections.map((s, index) => (
            <SectionCard
              key={s.id}
              section={s}
              sectionIndex={index}
              totalSections={sections.length}
              onRemoveWidget={onRemoveWidget}
              onRemoveSection={onRemoveSection}
              onMoveSection={onMoveSection}
              activePlaceholderInstanceId={activePlaceholderInstanceId}
            />
          ))}
          <button
            type="button"
            onClick={onRequestAddSection}
            style={{ minHeight: 60, flexShrink: 0, ...addSectionCtaViewTransition }}
            className="group mt-6 box-border flex w-full shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-[var(--radius-canvas)] bg-white px-3.5 py-3 shadow-[var(--shadow-card)] hover:bg-[#fafafa]"
          >
            <IconPlusSoft className="block size-4 shrink-0 text-black/35 transition-colors group-hover:text-[#E20074]" aria-hidden />
            <span className="max-w-full text-balance text-center font-['Inter',sans-serif] text-[13px] font-normal leading-snug tracking-tight text-black/30 transition-colors duration-200 group-hover:text-[#000]">
              Add Section
            </span>
          </button>
        </>
      )}
    </div>
  );
}
