import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { sectionWidgetsGridClass } from '../layoutUtils';
import type { DashboardSection, PlacedWidget } from '../types';
import { IconDrag, IconPlusSoft } from './Icons';

function SortablePlaceholderSlot({
  sectionId,
  widget,
  onSelectWidget,
}: {
  sectionId: string;
  widget: PlacedWidget;
  onSelectWidget: (sectionId: string, instanceId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.instanceId,
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
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onSelectWidget(sectionId, widget.instanceId)}
      className="flex min-h-0 cursor-pointer touch-none flex-col gap-2 rounded-xl border border-dashed border-[#c8c8c8] bg-[#fafafa] px-2 py-3 shadow-sm transition-colors hover:bg-[#f5f5f5] active:cursor-grabbing sm:flex-row sm:items-center sm:gap-0"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1 pl-1 text-left">
        <IconPlusSoft className="size-4 shrink-0 text-[#e20074]" aria-hidden />
        <span className="font-['Poppins',sans-serif] text-sm text-[#707070]">{widget.label}</span>
      </div>
    </div>
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
      className="flex min-h-0 flex-col gap-2 rounded-xl border border-[#d7d7d7] bg-white px-2 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-0"
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
      <button
        type="button"
        onClick={() => onRemove(widget.instanceId)}
        className="self-start rounded-md px-2 py-1 font-['Inter',sans-serif] text-xs text-[#606080] hover:bg-[#f0f0f0] sm:self-auto"
        aria-label={`Remove ${widget.label}`}
      >
        Remove
      </button>
    </div>
  );
}

function SectionCard({
  section,
  onRemoveWidget,
  onOpenWidgetPicker,
}: {
  section: DashboardSection;
  onRemoveWidget: (sectionId: string, instanceId: string) => void;
  /** Second arg targets a layout placeholder to fill when picking from the drawer. */
  onOpenWidgetPicker?: (sectionId: string, replaceInstanceId?: string | null) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section:${section.id}`,
    data: { type: 'section', sectionId: section.id },
  });

  const empty = section.widgets.length === 0;
  const overRing = isOver ? 'rounded-xl ring-2 ring-[#b6bec8] ring-offset-2 ring-offset-[#ebebeb] transition-shadow' : '';

  return (
    <SortableContext id={section.id} items={section.widgets.map((w) => w.instanceId)} strategy={verticalListSortingStrategy}>
      {empty ? (
        <div ref={setNodeRef} className={`min-w-0 ${overRing}`}>
          <p className="rounded-xl border border-dashed border-[#d7d7d7] py-8 text-center font-['Inter',sans-serif] text-sm text-[#707070]">
            Drop widgets here
          </p>
        </div>
      ) : (
        <div ref={setNodeRef} className={`min-w-0 ${sectionWidgetsGridClass(section.layout)} ${overRing}`}>
          {section.widgets.map((w) =>
            w.placeholder ? (
              <SortablePlaceholderSlot
                key={w.instanceId}
                sectionId={section.id}
                widget={w}
                onSelectWidget={(sid, iid) => onOpenWidgetPicker?.(sid, iid)}
              />
            ) : (
              <SortablePlacedWidget
                key={w.instanceId}
                sectionId={section.id}
                widget={w}
                onRemove={(id) => onRemoveWidget(section.id, id)}
              />
            )
          )}
        </div>
      )}
    </SortableContext>
  );
}

type DashboardCanvasProps = {
  sections: DashboardSection[];
  onRequestAddSection: () => void;
  onRemoveWidget: (sectionId: string, instanceId: string) => void;
  /** Opens the right-hand widget picker; optional second id fills that placeholder slot. */
  onOpenWidgetPicker?: (sectionId: string, replaceInstanceId?: string | null) => void;
};

export function DashboardCanvas({
  sections,
  onRequestAddSection,
  onRemoveWidget,
  onOpenWidgetPicker,
}: DashboardCanvasProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      {sections.length === 0 ? (
        <button
          type="button"
          onClick={onRequestAddSection}
          className="flex min-h-[200px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-3xl bg-white p-3.5 shadow-[var(--shadow-card)] hover:bg-[#fafafa]"
        >
          <IconPlusSoft className="size-4" />
          <span className="font-['Inter',sans-serif] text-[13px] tracking-tight text-black/30">Add section</span>
        </button>
      ) : (
        <>
          {sections.map((s) => (
            <SectionCard
              key={s.id}
              section={s}
              onRemoveWidget={onRemoveWidget}
              onOpenWidgetPicker={onOpenWidgetPicker}
            />
          ))}
          <button
            type="button"
            onClick={onRequestAddSection}
            className="flex h-11 w-full items-center justify-center gap-2.5 rounded-3xl bg-white px-3.5 shadow-[var(--shadow-card)] hover:bg-[#fafafa]"
          >
            <IconPlusSoft className="size-4" />
            <span className="font-['Inter',sans-serif] text-[13px] tracking-tight text-black/30">Add section</span>
          </button>
        </>
      )}
    </div>
  );
}
