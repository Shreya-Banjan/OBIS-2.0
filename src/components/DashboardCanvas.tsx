import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DashboardSection, PlacedWidget, SectionLayoutPreset } from '../types';
import { useWidgetLibraryOpen } from '../context/WidgetLibraryContext';
import { IconChevronDown, IconChevronUp, IconClose, IconDrag, IconEdit, IconPlusSoft, IconTrash } from './Icons';
import { EditorAddWidgetCta } from './EditorAddWidgetCta';

/** Slot wrapper — subtle elevation; widget library target (placeholder or change-widget) gets magenta inset stroke. */
function slotSurfaceClass(w: PlacedWidget, activeLibraryTargetInstanceId: string | null) {
  const shell = 'min-h-0 min-w-0 rounded-[var(--radius-canvas)] bg-white box-border';
  if (activeLibraryTargetInstanceId === w.instanceId) {
    return `${shell} shadow-[var(--shadow-subtle),inset_0_0_0_2px_#E20074]`;
  }
  return `${shell} shadow-[var(--shadow-subtle)]`;
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
}: {
  sectionId: string;
  widget: PlacedWidget;
  onRemove: (instanceId: string) => void;
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex min-h-0 flex-col gap-2 rounded-[var(--radius-canvas)] border border-[#d7d7d7] bg-white px-2 py-3 shadow-[var(--shadow-subtle)] sm:flex-row sm:items-center sm:justify-between sm:gap-0"
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="cursor-grab touch-none text-[#1e1e1f]/35 active:cursor-grabbing"
          {...listeners}
          {...attributes}
          aria-label={`Reorder ${widget.label}`}
        >
          <IconDrag className="size-[18px]" />
        </button>
        <span className="min-w-0 font-['Poppins',sans-serif] text-sm text-black/80">{widget.label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-0.5 self-start sm:self-auto">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openWidgetLibrary(sectionId, widget.instanceId);
          }}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#606080] opacity-100 transition-opacity duration-150 hover:bg-[#f0f0f0] sm:opacity-0 sm:group-hover:opacity-100"
          aria-label={`Change ${widget.label}`}
          title={`Change ${widget.label}`}
        >
          <IconEdit className="size-[18px]" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onRemove(widget.instanceId)}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#606080] hover:bg-[#f0f0f0]"
          aria-label={`Clear ${widget.label}`}
          title={`Clear ${widget.label}`}
        >
          <IconClose className="size-[18px]" aria-hidden />
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
    <SortablePlacedWidget sectionId={section.id} widget={w} onRemove={(id) => onRemoveWidget(section.id, id)} />
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
            <div key={w.instanceId} className={slotSurfaceClass(w, activePlaceholderInstanceId)}>
              {renderSlot(section, w, onRemoveWidget, activePlaceholderInstanceId)}
            </div>
          ))}
        </div>
      );

    case 'sidebar-left':
      return shell(
        <div className="flex w-full flex-row items-stretch gap-[20px]">
          {a ? (
            <div key={a.instanceId} className={`min-h-0 min-w-0 flex-1 basis-0 ${slotSurfaceClass(a, activePlaceholderInstanceId)}`}>
              {renderSlot(section, a, onRemoveWidget, activePlaceholderInstanceId)}
            </div>
          ) : null}
          {b ? (
            <div key={b.instanceId} className={`min-h-0 min-w-0 flex-1 basis-0 ${slotSurfaceClass(b, activePlaceholderInstanceId)}`}>
              {renderSlot(section, b, onRemoveWidget, activePlaceholderInstanceId)}
            </div>
          ) : null}
        </div>
      );

    case 'sidebar-right':
      return shell(
        <div className="flex w-full flex-row items-stretch gap-[20px]">
          {a ? (
            <div key={a.instanceId} className={`min-h-0 min-w-0 flex-1 basis-0 ${slotSurfaceClass(a, activePlaceholderInstanceId)}`}>
              {renderSlot(section, a, onRemoveWidget, activePlaceholderInstanceId)}
            </div>
          ) : null}
          {b ? (
            <div key={b.instanceId} className={`min-h-0 min-w-0 flex-1 basis-0 ${slotSurfaceClass(b, activePlaceholderInstanceId)}`}>
              {renderSlot(section, b, onRemoveWidget, activePlaceholderInstanceId)}
            </div>
          ) : null}
        </div>
      );

    case 'three-column':
      return shell(
        <div className="flex w-full flex-row items-stretch gap-[20px]">
          {a ? (
            <div key={a.instanceId} className={`min-h-0 min-w-0 flex-1 basis-0 ${slotSurfaceClass(a, activePlaceholderInstanceId)}`}>
              {renderSlot(section, a, onRemoveWidget, activePlaceholderInstanceId)}
            </div>
          ) : null}
          {b ? (
            <div key={b.instanceId} className={`min-h-0 min-w-0 flex-1 basis-0 ${slotSurfaceClass(b, activePlaceholderInstanceId)}`}>
              {renderSlot(section, b, onRemoveWidget, activePlaceholderInstanceId)}
            </div>
          ) : null}
          {c ? (
            <div key={c.instanceId} className={`min-h-0 min-w-0 flex-1 basis-0 ${slotSurfaceClass(c, activePlaceholderInstanceId)}`}>
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
  const btn =
    'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-white transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-35';

  return (
    <div
      className="pointer-events-none absolute bottom-0 left-0 z-10 flex w-max items-center rounded-[var(--radius-canvas)] border border-white/20 bg-[rgb(0_0_0/0.9)] p-1 opacity-0 shadow-[var(--shadow-elevated)] transition-opacity duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
      role="toolbar"
      aria-label="Section row actions"
    >
      <div className="flex items-center">
        <button
          type="button"
          className={btn}
          disabled={!canMoveUp}
          onClick={onMoveUp}
          aria-label="Move section up"
          title="Move up"
        >
          <IconChevronUp className="size-[18px] shrink-0" />
        </button>
        <button
          type="button"
          className={btn}
          disabled={!canMoveDown}
          onClick={onMoveDown}
          aria-label="Move section down"
          title="Move down"
        >
          <IconChevronDown className="size-[18px] shrink-0" />
        </button>
      </div>
      <span className="mx-0.5 h-5 w-px shrink-0 bg-white/25" aria-hidden />
      <button
        type="button"
        className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 text-white transition-colors hover:bg-white/15 font-['Inter',sans-serif] text-xs font-medium tracking-tight"
        onClick={onRemove}
      >
        <IconTrash className="size-[18px] shrink-0" />
        <span>Delete</span>
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

  return (
    <article className="group relative z-0 -mb-11 min-w-0 w-full max-w-full overflow-visible hover:z-[5] focus-within:z-[5]">
      <div className="relative min-w-0 pb-11">
        <div className="min-w-0">
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
                  <div key={w.instanceId} className={slotSurfaceClass(w, activePlaceholderInstanceId)}>
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
  /** Widget instance the library is replacing (placeholder “Select widget” or placed row via Change). */
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
    <div className="flex min-w-0 w-full max-w-full flex-1 flex-col gap-6">
      {sections.length === 0 ? (
        <button
          type="button"
          onClick={onRequestAddSection}
          style={{ height: 100, minHeight: 100, maxHeight: 100, flexShrink: 0 }}
          className="group box-border flex w-full shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-[var(--radius-canvas)] bg-white p-3.5 shadow-[var(--shadow-card)] hover:bg-[#fafafa]"
        >
          <IconPlusSoft className="size-4 text-black/35 transition-colors group-hover:text-[#E20074]" />
          <span className="font-['Inter',sans-serif] text-[13px] tracking-tight text-black/30">Add section</span>
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
            style={{ height: 60, minHeight: 60, flexShrink: 0 }}
            className="group box-border flex w-full shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-[var(--radius-canvas)] bg-white px-3.5 shadow-[var(--shadow-card)] hover:bg-[#fafafa]"
          >
            <IconPlusSoft className="size-4 text-black/35 transition-colors group-hover:text-[#E20074]" />
            <span className="font-['Inter',sans-serif] text-[13px] tracking-tight text-black/30">Add section</span>
          </button>
        </>
      )}
    </div>
  );
}
