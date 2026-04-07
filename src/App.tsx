import { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { TopBar } from './components/TopBar';
import { AddSectionLayoutModal } from './components/AddSectionLayoutModal';
import { DashboardCanvas } from './components/DashboardCanvas';
import { DashboardListPage } from './components/DashboardListPage';
import { DashboardNavDrawer } from './components/DashboardNavDrawer';
import { PublishDashboardModal, type PublishFormValues } from './components/PublishDashboardModal';
import { WidgetPickerPanel } from './components/WidgetPickerPanel';
import { INITIAL_DASHBOARDS } from './data/initialDashboards';
import { WIDGET_CATEGORIES } from './data/widgets';
import type { WidgetTemplate } from './data/widgets';
import { layoutColumnCount } from './layoutUtils';
import type { DashboardSection, PlacedWidget, SavedDashboard, SectionLayoutPreset } from './types';

const PLACEHOLDER_TEMPLATE_ID = '__placeholder__';

/** One selectable placeholder per layout column (full → 1, sidebars → 2, three-column → 3). */
function placeholderWidgetsForLayout(layout: SectionLayoutPreset): PlacedWidget[] {
  const n = layoutColumnCount(layout);
  return Array.from({ length: n }, () => ({
    instanceId: crypto.randomUUID(),
    templateId: PLACEHOLDER_TEMPLATE_ID,
    label: 'Select widget',
    placeholder: true,
  }));
}

function replacePlaceholderWithTemplate(
  sections: DashboardSection[],
  instanceId: string,
  template: WidgetTemplate
): DashboardSection[] {
  return sections.map((s) => ({
    ...s,
    widgets: s.widgets.map((w) =>
      w.instanceId === instanceId && w.placeholder
        ? {
            instanceId: w.instanceId,
            templateId: template.id,
            label: template.label,
          }
        : w
    ),
  }));
}

function newSection(layout?: SectionLayoutPreset): DashboardSection {
  const id = crypto.randomUUID();
  if (!layout) return { id, widgets: [] };
  return { id, layout, widgets: placeholderWidgetsForLayout(layout) };
}

function cloneSections(sections: DashboardSection[]): DashboardSection[] {
  return structuredClone(sections);
}

function insertWidget(
  sections: DashboardSection[],
  sectionId: string,
  template: WidgetTemplate,
  index?: number
): DashboardSection[] {
  const placed: PlacedWidget = {
    instanceId: crypto.randomUUID(),
    templateId: template.id,
    label: template.label,
  };
  return sections.map((s) => {
    if (s.id !== sectionId) return s;
    const next = [...s.widgets];
    if (index === undefined || index > next.length) {
      next.push(placed);
    } else {
      next.splice(index, 0, placed);
    }
    return { ...s, widgets: next };
  });
}

function removePlacedWidget(
  sections: DashboardSection[],
  sectionId: string,
  instanceId: string
): DashboardSection[] {
  return sections.map((s) =>
    s.id === sectionId ? { ...s, widgets: s.widgets.filter((w) => w.instanceId !== instanceId) } : s
  );
}

function moveWithinSection(
  sections: DashboardSection[],
  sectionId: string,
  activeId: string,
  overId: string
): DashboardSection[] {
  return sections.map((s) => {
    if (s.id !== sectionId) return s;
    const oldIndex = s.widgets.findIndex((w) => w.instanceId === activeId);
    const newIndex = s.widgets.findIndex((w) => w.instanceId === overId);
    if (oldIndex < 0 || newIndex < 0) return s;
    return { ...s, widgets: arrayMove(s.widgets, oldIndex, newIndex) };
  });
}

function moveToSectionEnd(
  sections: DashboardSection[],
  fromSectionId: string,
  toSectionId: string,
  instanceId: string
): DashboardSection[] {
  let moving: PlacedWidget | undefined;
  const without = sections.map((s) => {
    if (s.id !== fromSectionId) return s;
    const w = s.widgets.find((x) => x.instanceId === instanceId);
    if (w) moving = w;
    return { ...s, widgets: s.widgets.filter((x) => x.instanceId !== instanceId) };
  });
  if (!moving) return sections;
  return without.map((s) => (s.id === toSectionId ? { ...s, widgets: [...s.widgets, moving!] } : s));
}

function moveToSectionAtIndex(
  sections: DashboardSection[],
  fromSectionId: string,
  toSectionId: string,
  instanceId: string,
  toIndex: number
): DashboardSection[] {
  let moving: PlacedWidget | undefined;
  const without = sections.map((s) => {
    if (s.id !== fromSectionId) return s;
    const idx = s.widgets.findIndex((x) => x.instanceId === instanceId);
    if (idx < 0) return s;
    moving = s.widgets[idx];
    const next = [...s.widgets];
    next.splice(idx, 1);
    return { ...s, widgets: next };
  });
  if (!moving) return sections;

  return without.map((s) => {
    if (s.id !== toSectionId) return s;
    const next = [...s.widgets];
    const clamped = Math.max(0, Math.min(toIndex, next.length));
    next.splice(clamped, 0, moving!);
    return { ...s, widgets: next };
  });
}

export default function App() {
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [dashboards, setDashboards] = useState<SavedDashboard[]>(() =>
    INITIAL_DASHBOARDS.map((d) => ({
      ...d,
      sections: d.sections.map((s) => ({ ...s, widgets: [...s.widgets] })),
    }))
  );
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);
  const [newReportModalOpen, setNewReportModalOpen] = useState(false);

  const [reportTitle, setReportTitle] = useState('Enter Title');
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  /** Section that receives widgets chosen from the picker; null = last section on canvas. */
  const [widgetPickTargetSectionId, setWidgetPickTargetSectionId] = useState<string | null>(null);
  /** When set, the next pick from the panel replaces this placeholder instance. */
  const [widgetPickReplaceInstanceId, setWidgetPickReplaceInstanceId] = useState<string | null>(null);
  const [addSectionLayoutOpen, setAddSectionLayoutOpen] = useState(false);
  const [addSectionLayoutKey, setAddSectionLayoutKey] = useState(0);
  const [widgetPickerVariant, setWidgetPickerVariant] = useState<'drawer' | 'modal'>('drawer');
  const [sections, setSections] = useState<DashboardSection[]>([]);
  const [activePalette, setActivePalette] = useState<WidgetTemplate | null>(null);

  const sortedDashboards = useMemo(
    () => [...dashboards].sort((a, b) => b.updatedAt - a.updatedAt),
    [dashboards]
  );

  const handleOpenDashboard = useCallback((id: string) => {
    const d = dashboards.find((x) => x.id === id);
    if (!d) return;
    setActiveDashboardId(id);
    setReportTitle(d.title);
    setSections(cloneSections(d.sections));
    setView('editor');
    setPublishModalOpen(false);
    setPanelOpen(false);
    setWidgetPickReplaceInstanceId(null);
    setAddSectionLayoutOpen(false);
  }, [dashboards]);

  const handleNewReportConfirm = useCallback(
    (values: PublishFormValues) => {
      if (activeDashboardId) {
        setDashboards((prev) =>
          prev.map((d) =>
            d.id === activeDashboardId
              ? {
                  ...d,
                  title: reportTitle.trim() || d.title,
                  sections: cloneSections(sections),
                  updatedAt: Date.now(),
                }
              : d
          )
        );
      }
      const title = values.title.trim() || 'Untitled Report';
      const id = crypto.randomUUID();
      const newDash: SavedDashboard = {
        id,
        title,
        sections: [],
        updatedAt: Date.now(),
        status: 'draft',
        scope: values.scope,
        month: values.month,
        shareEmails: values.shareEmails.length > 0 ? values.shareEmails : undefined,
      };
      setDashboards((prev) => [newDash, ...prev]);
      setActiveDashboardId(id);
      setReportTitle(title);
      setSections([]);
      setNewReportModalOpen(false);
      setView('editor');
      setPublishModalOpen(false);
      setPanelOpen(false);
      setWidgetPickReplaceInstanceId(null);
      setAddSectionLayoutOpen(false);
    },
    [activeDashboardId, reportTitle, sections]
  );

  const openNewReportModal = useCallback(() => {
    setNavDrawerOpen(false);
    setNewReportModalOpen(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const onDragStart = useCallback((e: DragStartEvent) => {
    const src = e.active.data.current?.source;
    if (src === 'palette') {
      setActivePalette(e.active.data.current?.widget as WidgetTemplate);
    }
  }, []);

  const onDragEnd = useCallback((e: DragEndEvent) => {
    setActivePalette(null);
    const { active, over } = e;
    if (!over) return;

    const a = active.data.current;

    if (a?.source === 'palette') {
      const widget = a.widget as WidgetTemplate;
      const overId = String(over.id);
      if (overId.startsWith('section:')) {
        const sectionId = overId.slice('section:'.length);
        setSections((prev) => insertWidget(prev, sectionId, widget));
        return;
      }
      const sort = over.data.current?.sortable as { containerId: string; index: number } | undefined;
      if (sort?.containerId) {
        setSections((prev) => {
          const sec = prev.find((s) => s.id === sort.containerId);
          const overW = sec?.widgets.find((w) => w.instanceId === String(over.id));
          if (overW?.placeholder) {
            return replacePlaceholderWithTemplate(prev, String(over.id), widget);
          }
          return insertWidget(prev, sort.containerId, widget, sort.index);
        });
      }
      return;
    }

    if (a?.source === 'canvas') {
      const activeSort = active.data.current?.sortable as { containerId: string; index: number } | undefined;
      if (!activeSort) return;

      const overId = String(over.id);
      if (overId.startsWith('section:')) {
        const targetSectionId = overId.slice('section:'.length);
        if (targetSectionId === activeSort.containerId) return;
        setSections((prev) => moveToSectionEnd(prev, activeSort.containerId, targetSectionId, String(active.id)));
        return;
      }

      const overSort = over.data.current?.sortable as { containerId: string; index: number } | undefined;
      if (!overSort) return;

      if (activeSort.containerId === overSort.containerId) {
        setSections((prev) =>
          moveWithinSection(prev, activeSort.containerId, String(active.id), String(over.id))
        );
        return;
      }

      setSections((prev) =>
        moveToSectionAtIndex(
          prev,
          activeSort.containerId,
          overSort.containerId,
          String(active.id),
          overSort.index
        )
      );
    }
  }, []);

  const onDragCancel = useCallback(() => {
    setActivePalette(null);
  }, []);

  const handleOpenPublishModal = useCallback(() => {
    setPanelOpen(false);
    setWidgetPickReplaceInstanceId(null);
    setAddSectionLayoutOpen(false);
    setPublishModalOpen(true);
  }, []);

  const handleConfirmPublish = useCallback(
    (values: PublishFormValues) => {
      setReportTitle(values.title);
      if (activeDashboardId) {
        setDashboards((prev) =>
          prev.map((d) =>
            d.id === activeDashboardId
              ? {
                  ...d,
                  title: values.title,
                  sections: cloneSections(sections),
                  updatedAt: Date.now(),
                  status: 'published' as const,
                  scope: values.scope,
                  month: values.month,
                  shareEmails: values.shareEmails.length > 0 ? values.shareEmails : undefined,
                }
              : d
          )
        );
      }
      void navigator.clipboard.writeText(
        JSON.stringify(
          {
            title: values.title,
            scope: values.scope,
            month: values.month,
            shareWith: values.shareEmails,
            sections,
          },
          null,
          2
        )
      ).catch(() => {});
      setPublishModalOpen(false);
      alert('Layout and publish details copied to clipboard as JSON (demo publish).');
    },
    [sections, activeDashboardId]
  );

  const handleCancel = useCallback(() => {
    setReportTitle('Enter Title');
    setSections([]);
    setAddSectionLayoutOpen(false);
    setWidgetPickReplaceInstanceId(null);
    setPanelOpen(false);
  }, []);

  const handleSignOut = useCallback(() => {
    alert('Signed out (demo).');
  }, []);

  const openWidgetPicker = useCallback(
    (targetSectionId: string | null = null, replaceInstanceId: string | null = null) => {
      setAddSectionLayoutOpen(false);
      setPublishModalOpen(false);
      setWidgetPickTargetSectionId(targetSectionId);
      setWidgetPickReplaceInstanceId(replaceInstanceId);
      setWidgetPickerVariant(replaceInstanceId ? 'modal' : 'drawer');
      setPanelOpen(true);
    },
    []
  );

  const handlePickWidgetFromPanel = useCallback(
    (template: WidgetTemplate) => {
      const replaceId = widgetPickReplaceInstanceId;
      setSections((prev) => {
        if (prev.length === 0) return prev;
        if (replaceId) {
          const hit = prev.some((s) =>
            s.widgets.some((w) => w.instanceId === replaceId && w.placeholder)
          );
          if (hit) return replacePlaceholderWithTemplate(prev, replaceId, template);
        }
        let sid = widgetPickTargetSectionId;
        if (!sid || !prev.some((s) => s.id === sid)) {
          sid = prev[prev.length - 1].id;
        }
        return insertWidget(prev, sid, template);
      });
      setWidgetPickReplaceInstanceId(null);
      if (replaceId) setPanelOpen(false);
    },
    [widgetPickTargetSectionId, widgetPickReplaceInstanceId]
  );

  const addSectionWithLayout = useCallback((layout: SectionLayoutPreset) => {
    const section = newSection(layout);
    setSections((s) => [...s, section]);
    setAddSectionLayoutOpen(false);
    setWidgetPickTargetSectionId(section.id);
    setWidgetPickReplaceInstanceId(null);
  }, []);

  const requestAddSection = useCallback(() => {
    setAddSectionLayoutKey((k) => k + 1);
    setAddSectionLayoutOpen(true);
  }, []);

  const handleRemoveWidget = useCallback((sectionId: string, instanceId: string) => {
    setSections((prev) => {
      const sec = prev.find((s) => s.id === sectionId);
      const w = sec?.widgets.find((x) => x.instanceId === instanceId);
      if (w?.placeholder) return prev;
      return removePlacedWidget(prev, sectionId, instanceId);
    });
  }, []);

  const categories = useMemo(() => WIDGET_CATEGORIES, []);

  if (view === 'list') {
    return (
      <>
        <DashboardListPage
          dashboards={sortedDashboards}
          onOpenDashboard={handleOpenDashboard}
          onNewReport={openNewReportModal}
          onMenuOpen={() => setNavDrawerOpen(true)}
        />
        {newReportModalOpen ? (
          <PublishDashboardModal
            variant="newReport"
            onClose={() => setNewReportModalOpen(false)}
            onConfirm={handleNewReportConfirm}
            initialTitle=""
            sections={[]}
          />
        ) : null}
        <DashboardNavDrawer
          open={navDrawerOpen}
          onClose={() => setNavDrawerOpen(false)}
          onNewReport={openNewReportModal}
          onSignOut={handleSignOut}
        />
      </>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="min-h-dvh overflow-x-hidden bg-[#ebebeb] pb-4 pt-4 font-[family-name:var(--font-inter)]">
        <div className="mb-4 w-full min-w-0 px-3 sm:mb-6 sm:px-4">
          <TopBar
            title={reportTitle}
            onTitleChange={setReportTitle}
            onPublish={handleOpenPublishModal}
            onCancel={handleCancel}
            onMenuOpen={() => setNavDrawerOpen(true)}
            onAddWidget={() => openWidgetPicker(null)}
            publishDisabled={sections.length === 0}
          />
        </div>

        <div className="px-3 sm:px-4">
          <div className="mx-auto flex w-full max-w-[1460px] flex-col">
            <div className="min-w-0 flex-1 bg-[#ebebeb] px-0 pt-0">
              <div className="mx-auto flex w-full flex-col gap-4 sm:gap-6">
                {publishModalOpen ? (
                  <PublishDashboardModal
                    onClose={() => setPublishModalOpen(false)}
                    onConfirm={handleConfirmPublish}
                    initialTitle={reportTitle}
                    sections={sections}
                  />
                ) : null}

                <DashboardCanvas
                  sections={sections}
                  onRequestAddSection={requestAddSection}
                  onRemoveWidget={handleRemoveWidget}
                  onOpenWidgetPicker={(sectionId, replaceInstanceId) =>
                    openWidgetPicker(sectionId, replaceInstanceId ?? null)
                  }
                />

                <AddSectionLayoutModal
                  key={addSectionLayoutKey}
                  open={addSectionLayoutOpen}
                  onClose={() => setAddSectionLayoutOpen(false)}
                  onConfirmLayout={addSectionWithLayout}
                />
              </div>
            </div>
          </div>
        </div>

        <WidgetPickerPanel
          open={panelOpen}
          variant={widgetPickerVariant}
          categories={categories}
          onClose={() => {
            setPanelOpen(false);
            setWidgetPickReplaceInstanceId(null);
            setWidgetPickerVariant('drawer');
          }}
          onPickWidget={handlePickWidgetFromPanel}
        />
      </div>

      {newReportModalOpen ? (
        <PublishDashboardModal
          variant="newReport"
          onClose={() => setNewReportModalOpen(false)}
          onConfirm={handleNewReportConfirm}
          initialTitle=""
          sections={[]}
        />
      ) : null}

      <DashboardNavDrawer
        open={navDrawerOpen}
        onClose={() => setNavDrawerOpen(false)}
        onNewReport={openNewReportModal}
        onSignOut={handleSignOut}
      />

      <DragOverlay dropAnimation={null}>
        {activePalette ? (
          <div className="flex w-[min(100vw-2rem,16rem)] max-w-full items-center justify-between rounded-xl border border-[#d7d7d7] bg-white px-2 py-3 shadow-lg sm:w-64">
            <span className="font-['Poppins',sans-serif] text-sm text-black/80">{activePalette.label}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
