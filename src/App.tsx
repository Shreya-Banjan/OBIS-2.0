import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { DashboardListPage, type DashboardListLayoutMode } from './components/DashboardListPage';
import { DashboardNavDrawer } from './components/DashboardNavDrawer';
import { PublishDashboardModal, type PublishFormValues } from './components/PublishDashboardModal';
import { WidgetPickerPanel } from './components/WidgetPickerPanel';
import { INITIAL_DASHBOARDS } from './data/initialDashboards';
import { WIDGET_CATEGORIES } from './data/widgets';
import type { WidgetTemplate } from './data/widgets';
import { WidgetLibraryOpenProvider } from './context/WidgetLibraryContext';
import { layoutColumnCount } from './layoutUtils';
import type { DashboardSection, PlacedWidget, SavedDashboard, SectionLayoutPreset } from './types';

const PLACEHOLDER_TEMPLATE_ID = '__placeholder__';

function placeholderWidgetsForLayout(layout: SectionLayoutPreset): PlacedWidget[] {
  const slot = (): PlacedWidget => ({
    instanceId: crypto.randomUUID(),
    templateId: PLACEHOLDER_TEMPLATE_ID,
    label: 'Select widget',
    placeholder: true,
  });
  const n = layoutColumnCount(layout);
  const slots = Array.from({ length: n }, slot);
  if (layout === 'sidebar-right' && slots.length === 2) {
    return [slots[1], slots[0]];
  }
  return slots;
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

function replacePlacedWidgetWithTemplate(
  sections: DashboardSection[],
  instanceId: string,
  template: WidgetTemplate
): DashboardSection[] {
  return sections.map((s) => ({
    ...s,
    widgets: s.widgets.map((w) =>
      w.instanceId === instanceId && !w.placeholder
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
  return sections.map((s) => {
    if (s.id !== sectionId) return s;
    const w = s.widgets.find((x) => x.instanceId === instanceId);
    if (!w || w.placeholder) return s;
    if (s.layout) {
      return {
        ...s,
        widgets: s.widgets.map((x) =>
          x.instanceId === instanceId
            ? {
                instanceId: x.instanceId,
                templateId: PLACEHOLDER_TEMPLATE_ID,
                label: 'Select widget',
                placeholder: true,
              }
            : x
        ),
      };
    }
    return { ...s, widgets: s.widgets.filter((x) => x.instanceId !== instanceId) };
  });
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
  const [dashboardListLayout, setDashboardListLayout] = useState<DashboardListLayoutMode>('tile');
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
  const [widgetPickReplaceInstanceId, setWidgetPickReplaceInstanceId] = useState<string | null>(null);
  const [addSectionLayoutOpen, setAddSectionLayoutOpen] = useState(false);
  const [addSectionLayoutKey, setAddSectionLayoutKey] = useState(0);
  const [sections, setSections] = useState<DashboardSection[]>([]);
  const [activePalette, setActivePalette] = useState<WidgetTemplate | null>(null);
  /** Editor snapshot when opening / creating a report — Cancel restores it and returns to the list (sync effect keeps `dashboards` aligned while editing). */
  const editorBaselineRef = useRef<{ sections: DashboardSection[]; title: string }>({
    sections: [],
    title: 'Enter Title',
  });

  const sortedDashboards = useMemo(
    () => [...dashboards].sort((a, b) => b.updatedAt - a.updatedAt),
    [dashboards]
  );

  /** Keep the active report’s `sections` (including `layout` on each section) in `dashboards` so reopening the editor is not stuck with an empty snapshot. */
  useEffect(() => {
    if (view !== 'editor' || activeDashboardId == null) return;
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === activeDashboardId
          ? { ...d, sections: cloneSections(sections), updatedAt: Date.now() }
          : d
      )
    );
  }, [view, activeDashboardId, sections]);

  const handleOpenDashboard = useCallback((id: string) => {
    const d = dashboards.find((x) => x.id === id);
    if (!d) return;
    setActiveDashboardId(id);
    setReportTitle(d.title);
    const next = cloneSections(d.sections);
    editorBaselineRef.current = { sections: cloneSections(next), title: d.title };
    setSections(next);
    setView('editor');
    setPublishModalOpen(false);
    setPanelOpen(false);
    setWidgetPickReplaceInstanceId(null);
    setAddSectionLayoutOpen(false);
  }, [dashboards]);

  const devEditorBootstrapDone = useRef(false);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (devEditorBootstrapDone.current) return;
    if (new URLSearchParams(window.location.search).get('editor') !== '1') return;
    const first = sortedDashboards[0];
    if (!first) return;
    devEditorBootstrapDone.current = true;
    handleOpenDashboard(first.id);
  }, [sortedDashboards, handleOpenDashboard]);

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
      editorBaselineRef.current = { sections: [], title };
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
                  publishComment: values.comment?.trim() || undefined,
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
            comment: values.comment?.trim() || undefined,
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
    const b = editorBaselineRef.current;
    setReportTitle(b.title);
    setSections(cloneSections(b.sections));
    setAddSectionLayoutOpen(false);
    setWidgetPickReplaceInstanceId(null);
    setPanelOpen(false);
    if (activeDashboardId != null) {
      setDashboards((prev) =>
        prev.map((d) =>
          d.id === activeDashboardId
            ? {
                ...d,
                sections: cloneSections(b.sections),
                title: b.title.trim() || d.title,
                updatedAt: Date.now(),
              }
            : d
        )
      );
    }
    setActiveDashboardId(null);
    setDashboardListLayout('tile');
    setView('list');
  }, [activeDashboardId]);

  const handleSignOut = useCallback(() => {
    alert('Signed out (demo).');
  }, []);

  const openWidgetPicker = useCallback(
    (targetSectionId: string | null = null, replaceInstanceId: string | null = null) => {
      setAddSectionLayoutOpen(false);
      setPublishModalOpen(false);
      setWidgetPickTargetSectionId(targetSectionId);
      setWidgetPickReplaceInstanceId(replaceInstanceId);
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
          const placeholderHit = prev.some((s) =>
            s.widgets.some((w) => w.instanceId === replaceId && w.placeholder)
          );
          if (placeholderHit) return replacePlaceholderWithTemplate(prev, replaceId, template);
          const placedHit = prev.some((s) =>
            s.widgets.some((w) => w.instanceId === replaceId && !w.placeholder)
          );
          if (placedHit) return replacePlacedWidgetWithTemplate(prev, replaceId, template);
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
    setSections((s) => [...s, newSection(layout)]);
    setAddSectionLayoutOpen(false);
    setWidgetPickTargetSectionId(null);
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

  const handleRemoveSection = useCallback((sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  }, []);

  const handleMoveSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
    setSections((prev) => {
      const i = prev.findIndex((s) => s.id === sectionId);
      if (i < 0) return prev;
      const j = direction === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= prev.length) return prev;
      return arrayMove(prev, i, j);
    });
  }, []);

  const categories = useMemo(() => WIDGET_CATEGORIES, []);

  const selectedWidgetTemplateIds = useMemo(() => {
    const next = new Set<string>();
    for (const sec of sections) {
      for (const w of sec.widgets) {
        if (!w.placeholder) next.add(w.templateId);
      }
    }
    return next;
  }, [sections]);

  if (view === 'list') {
    return (
      <>
        <DashboardListPage
          dashboards={sortedDashboards}
          onOpenDashboard={handleOpenDashboard}
          onNewReport={openNewReportModal}
          onMenuOpen={() => setNavDrawerOpen(true)}
          layoutMode={dashboardListLayout}
          onLayoutModeChange={setDashboardListLayout}
        />
        {newReportModalOpen ? (
          <PublishDashboardModal
            variant="newReport"
            onClose={() => setNewReportModalOpen(false)}
            onConfirm={handleNewReportConfirm}
            initialTitle=""
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
      <WidgetLibraryOpenProvider open={openWidgetPicker}>
        <AddSectionLayoutModal
          key={addSectionLayoutKey}
          open={addSectionLayoutOpen}
          onClose={() => setAddSectionLayoutOpen(false)}
          onConfirmLayout={addSectionWithLayout}
        />
        <div className="flex min-h-dvh flex-col overflow-hidden bg-[#ebebeb] font-[family-name:var(--font-inter)]">
          <div className="shrink-0 px-3 pb-4 pt-4 sm:px-4 sm:pb-6 sm:pt-6">
            <TopBar
              title={reportTitle}
              onTitleChange={setReportTitle}
              onPublish={handleOpenPublishModal}
              onCancel={handleCancel}
              onMenuOpen={() => setNavDrawerOpen(true)}
              publishDisabled={sections.length === 0}
            />
          </div>

          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
            <div className="px-3 pb-6 sm:px-4">
              <div className="mx-auto flex w-full max-w-[1460px] flex-col">
                <div className="min-w-0 flex-1 bg-[#ebebeb] px-0 pt-0">
                  <div className="mx-auto flex w-full flex-col gap-0">
                    {publishModalOpen ? (
                      <PublishDashboardModal
                        onClose={() => setPublishModalOpen(false)}
                        onConfirm={handleConfirmPublish}
                        initialTitle={reportTitle}
                      />
                    ) : null}

                    <DashboardCanvas
                      key={activeDashboardId ?? 'no-dashboard'}
                      sections={sections}
                      onRequestAddSection={requestAddSection}
                      onRemoveWidget={handleRemoveWidget}
                      onRemoveSection={handleRemoveSection}
                      onMoveSection={handleMoveSection}
                      activePlaceholderInstanceId={
                        panelOpen ? widgetPickReplaceInstanceId : null
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <WidgetPickerPanel
            open={panelOpen}
            categories={categories}
            selectedTemplateIds={selectedWidgetTemplateIds}
            onClose={() => {
              setPanelOpen(false);
              setWidgetPickReplaceInstanceId(null);
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
            <div className="flex w-[min(100vw-2rem,16rem)] max-w-full items-center justify-between rounded-xl border border-[#d7d7d7] bg-white px-2 py-3 shadow-[var(--shadow-elevated)] sm:w-64">
              <span className="font-['Poppins',sans-serif] text-sm text-black/80">{activePalette.label}</span>
            </div>
          ) : null}
        </DragOverlay>
      </WidgetLibraryOpenProvider>
    </DndContext>
  );
}
