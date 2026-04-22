import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
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
import { AppBurgerButton } from './components/AppBurgerButton';
import { TopBar } from './components/TopBar';
import { AddSectionLayoutModal } from './components/AddSectionLayoutModal';
import { DashboardListPage } from './components/DashboardListPage';
import { ViewportSizePresetBar } from './components/ViewportSizePresetBar';
import { DashboardNavDrawer } from './components/DashboardNavDrawer';
import { PublishDashboardModal, type PublishFormValues } from './components/PublishDashboardModal';
import { ShareDashboardModal } from './components/ShareDashboardModal';
import { WidgetPickerPanel } from './components/WidgetPickerPanel';
import {
  layoutColumnCount,
  NAV_BURGER_MIN_LAYOUT_WIDTH_PX,
  reportsContentMaxWidthPx,
} from './layoutUtils';
import { mergeInitialDashboards } from './data/initialDashboards';
import { loadDashboardsFromStorage, saveDashboardsToStorage } from './persistence/dashboardStorage';
import { WIDGET_CATEGORIES } from './data/widgets';
import type { WidgetTemplate } from './data/widgets';
import { WidgetLibraryOpenProvider } from './context/WidgetLibraryContext';
import type {
  DashboardListLayoutMode,
  DashboardSection,
  PlacedWidget,
  SavedDashboard,
  SectionLayoutPreset,
} from './types';
import { useEffectiveLayoutWidth } from './useEffectiveLayoutWidth';

const ComponentsPage = lazy(() =>
  import('./pages/ComponentsPage').then((m) => ({ default: m.ComponentsPage }))
);
const DashboardCanvas = lazy(() =>
  import('./components/DashboardCanvas').then((m) => ({ default: m.DashboardCanvas }))
);
const PLACEHOLDER_TEMPLATE_ID = '__placeholder__';

type AutoSaveIndicator = 'idle' | 'saving' | 'saved';

function placeholderWidgetsForLayout(layout: SectionLayoutPreset): PlacedWidget[] {
  const slot = (): PlacedWidget => ({
    instanceId: crypto.randomUUID(),
    templateId: PLACEHOLDER_TEMPLATE_ID,
    label: 'Select Widget',
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
                label: 'Select Widget',
                placeholder: true,
              }
            : x
        ),
      };
    }
    return { ...s, widgets: s.widgets.filter((x) => x.instanceId !== instanceId) };
  });
}

/** Remove every placed instance of this template (layout sections revert slots to placeholders). */
function removeAllWidgetsWithTemplate(sections: DashboardSection[], templateId: string): DashboardSection[] {
  return sections.map((s) => {
    if (!s.widgets.some((w) => !w.placeholder && w.templateId === templateId)) {
      return s;
    }
    if (s.layout) {
      return {
        ...s,
        widgets: s.widgets.map((w) =>
          !w.placeholder && w.templateId === templateId
            ? {
                instanceId: w.instanceId,
                templateId: PLACEHOLDER_TEMPLATE_ID,
                label: 'Select Widget',
                placeholder: true,
              }
            : w
        ),
      };
    }
    return {
      ...s,
      widgets: s.widgets.filter((w) => w.placeholder || w.templateId !== templateId),
    };
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

function findWidgetGridPosition(
  sections: DashboardSection[],
  instanceId: string
): { si: number; wi: number } | null {
  for (let si = 0; si < sections.length; si++) {
    const wi = sections[si].widgets.findIndex((w) => w.instanceId === instanceId);
    if (wi >= 0) return { si, wi };
  }
  return null;
}

/** First placeholder strictly after (afterSi, afterWi) in section / widget order. */
function findNextPlaceholderAfter(
  sections: DashboardSection[],
  afterSi: number,
  afterWi: number
): { sectionId: string; instanceId: string } | null {
  for (let si = 0; si < sections.length; si++) {
    const s = sections[si];
    for (let wi = 0; wi < s.widgets.length; wi++) {
      const w = s.widgets[wi];
      if (!w.placeholder) continue;
      if (si > afterSi || (si === afterSi && wi > afterWi)) {
        return { sectionId: s.id, instanceId: w.instanceId };
      }
    }
  }
  return null;
}

/** All non-placeholder instances of a template in canvas order (section → widget). */
function collectWidgetSlotsForTemplate(
  sections: DashboardSection[],
  templateId: string
): { sectionId: string; instanceId: string }[] {
  const out: { sectionId: string; instanceId: string }[] = [];
  for (const s of sections) {
    for (const w of s.widgets) {
      if (!w.placeholder && w.templateId === templateId) {
        out.push({ sectionId: s.id, instanceId: w.instanceId });
      }
    }
  }
  return out;
}

/** First empty slot in canvas order. */
function findFirstPlaceholderSlot(sections: DashboardSection[]): { sectionId: string; instanceId: string } | null {
  for (const s of sections) {
    for (const w of s.widgets) {
      if (w.placeholder) {
        return { sectionId: s.id, instanceId: w.instanceId };
      }
    }
  }
  return null;
}

function countPlaceholderSlots(sections: DashboardSection[]): number {
  return sections.reduce(
    (n, s) => n + s.widgets.reduce((m, w) => m + (w.placeholder ? 1 : 0), 0),
    0
  );
}

/**
 * Next placeholder strictly after (afterSi, afterWi), else first in canvas order (wrap).
 * Used after filling a placeholder that may not be the last in order.
 */
function nextPlaceholderAfterPosition(
  sections: DashboardSection[],
  afterSi: number,
  afterWi: number
): { sectionId: string; instanceId: string } | null {
  if (countPlaceholderSlots(sections) === 0) return null;
  return findNextPlaceholderAfter(sections, afterSi, afterWi) ?? findFirstPlaceholderSlot(sections);
}

/** Clears focus from Up/Down/Delete so `group-focus-within` does not leave the row toolbar visible after reorder. */
function blurSectionRowToolbarFocus() {
  const ae = document.activeElement;
  if (ae instanceof HTMLElement && ae.closest('[aria-label="Section row actions"]')) {
    ae.blur();
  }
}

function applyWidgetPickToSections(
  sections: DashboardSection[],
  template: WidgetTemplate,
  replaceId: string | null,
  targetSid: string | null
): DashboardSection[] {
  if (sections.length === 0) return sections;
  if (replaceId) {
    const placeholderHit = sections.some((s) =>
      s.widgets.some((w) => w.instanceId === replaceId && w.placeholder)
    );
    if (placeholderHit) return replacePlaceholderWithTemplate(sections, replaceId, template);
    const placedHit = sections.some((s) =>
      s.widgets.some((w) => w.instanceId === replaceId && !w.placeholder)
    );
    if (placedHit) return replacePlacedWidgetWithTemplate(sections, replaceId, template);
  }
  let sid = targetSid;
  if (!sid || !sections.some((s) => s.id === sid)) {
    sid = sections[sections.length - 1].id;
  }
  return insertWidget(sections, sid, template);
}

export default function App() {
  const [view, setView] = useState<'list' | 'editor' | 'components'>(() =>
    typeof window !== 'undefined' && window.location.hash.startsWith('#/components') ? 'components' : 'list'
  );
  const [dashboardListLayout, setDashboardListLayout] = useState<DashboardListLayoutMode>('tile');
  const [dashboards, setDashboards] = useState<SavedDashboard[]>(() =>
    mergeInitialDashboards(loadDashboardsFromStorage())
  );

  const dashboardsRef = useRef(dashboards);
  dashboardsRef.current = dashboards;

  useEffect(() => {
    const flush = () => saveDashboardsToStorage(dashboardsRef.current);
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      saveDashboardsToStorage(dashboards);
    }, 400);
    return () => window.clearTimeout(t);
  }, [dashboards]);
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);
  const [newReportModalOpen, setNewReportModalOpen] = useState(false);
  const [shareDashboardId, setShareDashboardId] = useState<string | null>(null);

  const [reportTitle, setReportTitle] = useState('Enter Title');
  /** Toolbar timeline; synced to KPI period line on canvas. */
  const [editorTimeline, setEditorTimeline] = useState('');
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  /** Shared between reports list and editor: simulated viewport width for layout preview. */
  const [previewViewportWidth, setPreviewViewportWidth] = useState<number | null>(null);
  const effectiveLayoutWidth = useEffectiveLayoutWidth(previewViewportWidth);
  const reportsContentMaxWidth = useMemo(
    () => reportsContentMaxWidthPx(effectiveLayoutWidth),
    [effectiveLayoutWidth]
  );
  const [panelOpen, setPanelOpen] = useState(false);
  /** Section that receives widgets chosen from the picker; null = last section on canvas. */
  const [widgetPickTargetSectionId, setWidgetPickTargetSectionId] = useState<string | null>(null);
  const [widgetPickReplaceInstanceId, setWidgetPickReplaceInstanceId] = useState<string | null>(null);
  const widgetPickerUiRef = useRef({ panelOpen: false, replaceId: null as string | null });
  widgetPickerUiRef.current = { panelOpen, replaceId: widgetPickReplaceInstanceId };
  const [addSectionLayoutOpen, setAddSectionLayoutOpen] = useState(false);
  const [addSectionLayoutKey, setAddSectionLayoutKey] = useState(0);
  const [sections, setSections] = useState<DashboardSection[]>([]);
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  const [activePalette, setActivePalette] = useState<WidgetTemplate | null>(null);
  const sortedDashboards = useMemo(
    () => [...dashboards].sort((a, b) => b.updatedAt - a.updatedAt),
    [dashboards]
  );

  const activeReportStatus = useMemo(
    () =>
      activeDashboardId == null
        ? null
        : (dashboards.find((d) => d.id === activeDashboardId)?.status ?? null),
    [dashboards, activeDashboardId]
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

  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveIndicator>('idle');
  const autoSaveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Saving animation while edits are in flight; tick + “Auto saved” after debounce. */
  useEffect(() => {
    if (view !== 'editor' || activeDashboardId == null) {
      setAutoSaveStatus('idle');
      if (autoSaveDebounceRef.current) {
        clearTimeout(autoSaveDebounceRef.current);
        autoSaveDebounceRef.current = null;
      }
      return;
    }
    setAutoSaveStatus('saving');
    if (autoSaveDebounceRef.current) clearTimeout(autoSaveDebounceRef.current);
    autoSaveDebounceRef.current = setTimeout(() => {
      autoSaveDebounceRef.current = null;
      setAutoSaveStatus('saved');
    }, 500);
    return () => {
      if (autoSaveDebounceRef.current) {
        clearTimeout(autoSaveDebounceRef.current);
        autoSaveDebounceRef.current = null;
      }
    };
  }, [view, activeDashboardId, sections, reportTitle]);

  const handleOpenDashboard = useCallback((id: string) => {
    const d = dashboards.find((x) => x.id === id);
    if (!d) return;
    setActiveDashboardId(id);
    setReportTitle(d.title);
    setEditorTimeline('');
    const next = cloneSections(d.sections);
    setSections(next);
    setView('editor');
    setPublishModalOpen(false);
    setPanelOpen(false);
    setWidgetPickReplaceInstanceId(null);
    setAddSectionLayoutOpen(false);
  }, [dashboards]);

  const handleShareDashboard = useCallback((id: string) => {
    setShareDashboardId(id);
  }, []);

  const handleShareEmailsUpdate = useCallback((id: string, emails: string[]) => {
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, shareEmails: emails.length > 0 ? emails : undefined, updatedAt: Date.now() }
          : d
      )
    );
  }, []);

  const handleDeleteDashboard = useCallback(
    (id: string) => {
      const d = dashboards.find((x) => x.id === id);
      if (!d) return;
      if (
        !window.confirm(
          `Delete “${d.title}”? This removes it from saved dashboards in this browser.`
        )
      ) {
        return;
      }
      setDashboards((prev) => prev.filter((x) => x.id !== id));
      setShareDashboardId((sid) => (sid === id ? null : sid));
      if (activeDashboardId === id) {
        setActiveDashboardId(null);
        setView('list');
        setPublishModalOpen(false);
        setPanelOpen(false);
        setWidgetPickReplaceInstanceId(null);
        setAddSectionLayoutOpen(false);
      }
    },
    [dashboards, activeDashboardId]
  );

  const devEditorBootstrapDone = useRef(false);
  const openDashboardLinkHandled = useRef(false);
  useEffect(() => {
    if (openDashboardLinkHandled.current) return;
    const id = new URLSearchParams(window.location.search).get('openDashboard');
    if (!id) return;
    const d = sortedDashboards.find((x) => x.id === id);
    openDashboardLinkHandled.current = true;
    if (!d) {
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    handleOpenDashboard(id);
    window.history.replaceState({}, '', window.location.pathname);
  }, [sortedDashboards, handleOpenDashboard]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (devEditorBootstrapDone.current) return;
    if (openDashboardLinkHandled.current) return;
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
        domain: values.domain,
        scope: values.scope,
        month: values.month,
        shareEmails: values.shareEmails.length > 0 ? values.shareEmails : undefined,
        coverImageDataUrl: values.coverImageDataUrl ?? undefined,
      };
      setDashboards((prev) => [newDash, ...prev]);
      setActiveDashboardId(id);
      setReportTitle(title);
      setEditorTimeline('');
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

  /** After a placeholder is filled (panel or drag), move “active slot” to the next empty slot or close the picker. */
  const advancePickerAfterPlaceholderFill = useCallback(
    (prev: DashboardSection[], filledPlaceholderId: string, next: DashboardSection[]) => {
      const pos = findWidgetGridPosition(prev, filledPlaceholderId);
      if (!pos) {
        setWidgetPickReplaceInstanceId(null);
        setWidgetPickTargetSectionId(null);
        setPanelOpen(false);
        return;
      }
      const nextSlot = nextPlaceholderAfterPosition(next, pos.si, pos.wi);
      if (nextSlot) {
        setWidgetPickTargetSectionId(nextSlot.sectionId);
        setWidgetPickReplaceInstanceId(nextSlot.instanceId);
      } else {
        setWidgetPickTargetSectionId(null);
        setWidgetPickReplaceInstanceId(null);
        setPanelOpen(false);
      }
    },
    []
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
            const filledId = String(over.id);
            const next = replacePlaceholderWithTemplate(prev, filledId, widget);
            queueMicrotask(() => advancePickerAfterPlaceholderFill(prev, filledId, next));
            return next;
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
  }, [advancePickerAfterPlaceholderFill]);

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

  /** Flush title + sections to the active dashboard, then return to the list. */
  const handleSaveAndClose = useCallback(() => {
    setAddSectionLayoutOpen(false);
    setWidgetPickReplaceInstanceId(null);
    setPanelOpen(false);
    setPublishModalOpen(false);
    if (activeDashboardId != null) {
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
    setActiveDashboardId(null);
    setDashboardListLayout('tile');
    setView('list');
  }, [activeDashboardId, reportTitle, sections]);

  const handleSignOut = useCallback(() => {
    alert('Signed out (demo).');
  }, []);

  const handleOpenComponents = useCallback(() => {
    if (!window.location.hash.startsWith('#/components')) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}#/components/button`
      );
    }
    setView('components');
  }, []);

  /** User dismisses the picker (X / Escape / toggle). Clears the targeted slot so canvas chrome does not stay “selected”. */
  const requestCloseWidgetPicker = useCallback(() => {
    setWidgetPickReplaceInstanceId(null);
    setWidgetPickTargetSectionId(null);
    setPanelOpen(false);
  }, []);

  const openWidgetPicker = useCallback(
    (targetSectionId: string | null = null, replaceInstanceId: string | null = null) => {
      setAddSectionLayoutOpen(false);
      setPublishModalOpen(false);
      const { panelOpen: wasOpen, replaceId } = widgetPickerUiRef.current;
      if (replaceInstanceId != null && wasOpen && replaceId === replaceInstanceId) {
        requestCloseWidgetPicker();
        return;
      }
      setWidgetPickTargetSectionId(targetSectionId);
      setWidgetPickReplaceInstanceId(replaceInstanceId);
      setPanelOpen(true);
    },
    [requestCloseWidgetPicker]
  );

  const handlePickWidgetFromPanel = useCallback(
    (template: WidgetTemplate) => {
      const replaceId = widgetPickReplaceInstanceId;
      const targetSid = widgetPickTargetSectionId;
      const prev = sectionsRef.current;
      const next = applyWidgetPickToSections(prev, template, replaceId, targetSid);
      setSections(next);

      const wasPlaceholderFill =
        replaceId != null &&
        prev.some((s) => s.widgets.some((w) => w.instanceId === replaceId && w.placeholder));

      if (wasPlaceholderFill && replaceId) {
        advancePickerAfterPlaceholderFill(prev, replaceId, next);
      } else {
        setWidgetPickReplaceInstanceId(null);
      }
    },
    [advancePickerAfterPlaceholderFill, widgetPickTargetSectionId, widgetPickReplaceInstanceId]
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

  const handleRemoveTemplateFromPicker = useCallback((template: WidgetTemplate) => {
    setSections((prev) => {
      const beforeSlots = collectWidgetSlotsForTemplate(prev, template.id);
      const next = removeAllWidgetsWithTemplate(prev, template.id);
      queueMicrotask(() => {
        for (const { sectionId, instanceId } of beforeSlots) {
          const sec = next.find((s) => s.id === sectionId);
          const w = sec?.widgets.find((x) => x.instanceId === instanceId);
          if (w?.placeholder) {
            setWidgetPickTargetSectionId(sectionId);
            setWidgetPickReplaceInstanceId(instanceId);
            setPanelOpen(true);
            return;
          }
        }
        const fp = findFirstPlaceholderSlot(next);
        if (fp) {
          setWidgetPickTargetSectionId(fp.sectionId);
          setWidgetPickReplaceInstanceId(fp.instanceId);
          setPanelOpen(true);
        } else {
          setWidgetPickReplaceInstanceId(null);
          setWidgetPickTargetSectionId(null);
          setPanelOpen(false);
        }
      });
      return next;
    });
  }, []);

  const handleRemoveSection = useCallback((sectionId: string) => {
    const applyRemove = () => {
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
    };

    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> };
    };
    if (typeof doc.startViewTransition === 'function') {
      const vt = doc.startViewTransition(() => {
        flushSync(applyRemove);
      });
      queueMicrotask(blurSectionRowToolbarFocus);
      void vt.finished.finally(() => {
        blurSectionRowToolbarFocus();
      });
    } else {
      applyRemove();
      queueMicrotask(blurSectionRowToolbarFocus);
    }
  }, []);

  const handleMoveSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
    const applyReorder = () => {
      setSections((prev) => {
        const i = prev.findIndex((s) => s.id === sectionId);
        if (i < 0) return prev;
        const j = direction === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= prev.length) return prev;
        return arrayMove(prev, i, j);
      });
    };

    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> };
    };
    if (typeof doc.startViewTransition === 'function') {
      const vt = doc.startViewTransition(() => {
        flushSync(applyReorder);
      });
      queueMicrotask(blurSectionRowToolbarFocus);
      void vt.finished.finally(() => {
        blurSectionRowToolbarFocus();
      });
    } else {
      applyReorder();
      queueMicrotask(blurSectionRowToolbarFocus);
    }
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

  /** Non-placeholder instances per template id (shown in the widget picker). */
  const templateInstanceCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const sec of sections) {
      for (const w of sec.widgets) {
        if (w.placeholder) continue;
        m.set(w.templateId, (m.get(w.templateId) ?? 0) + 1);
      }
    }
    return m;
  }, [sections]);

  const emptyPlaceholderSlotCount = useMemo(() => countPlaceholderSlots(sections), [sections]);

  /** No empty slots left — close picker (requirement 6). */
  useEffect(() => {
    if (!panelOpen) return;
    if (emptyPlaceholderSlotCount === 0) {
      setPanelOpen(false);
      setWidgetPickReplaceInstanceId(null);
      setWidgetPickTargetSectionId(null);
    }
  }, [panelOpen, emptyPlaceholderSlotCount]);

  /** Active slot id no longer on canvas (e.g. section removed) — clear selection. */
  useEffect(() => {
    if (widgetPickReplaceInstanceId == null) return;
    const exists = sections.some((s) =>
      s.widgets.some((w) => w.instanceId === widgetPickReplaceInstanceId)
    );
    if (!exists) {
      setWidgetPickReplaceInstanceId(null);
      setWidgetPickTargetSectionId(null);
      setPanelOpen(false);
    }
  }, [sections, widgetPickReplaceInstanceId]);

  const shareDashboard = useMemo(
    () =>
      shareDashboardId == null ? null : (dashboards.find((d) => d.id === shareDashboardId) ?? null),
    [dashboards, shareDashboardId]
  );

  if (view === 'components') {
    return (
      <Suspense fallback={null}>
        <ComponentsPage onBackToDashboard={() => setView('list')} />
      </Suspense>
    );
  }

  if (view === 'list') {
    return (
      <>
        <DashboardListPage
          dashboards={sortedDashboards}
          onOpenDashboard={handleOpenDashboard}
          onShareDashboard={handleShareDashboard}
          onDeleteDashboard={handleDeleteDashboard}
          onNewReport={openNewReportModal}
          onMenuOpen={() => setNavDrawerOpen(true)}
          onLogoClick={() => {
            setNavDrawerOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenComponents={handleOpenComponents}
          layoutMode={dashboardListLayout}
          previewViewportWidth={previewViewportWidth}
          onPreviewViewportWidthChange={setPreviewViewportWidth}
          reportsContentMaxWidth={reportsContentMaxWidth}
        />
        {shareDashboard ? (
          <ShareDashboardModal
            dashboard={shareDashboard}
            onClose={() => setShareDashboardId(null)}
            onShareEmailsChange={(emails) => handleShareEmailsUpdate(shareDashboard.id, emails)}
          />
        ) : null}
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
        <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#ebebeb] font-[family-name:var(--font-inter)]">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col px-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-4">
            <ViewportSizePresetBar
              selectedWidth={previewViewportWidth}
              onSelectWidth={setPreviewViewportWidth}
            />
            <div
              className={
                previewViewportWidth != null
                  ? 'mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col'
                  : 'flex min-h-0 min-w-0 flex-1 flex-col'
              }
              style={
                previewViewportWidth != null
                  ? { maxWidth: `${previewViewportWidth}px` }
                  : undefined
              }
            >
              <div className="w-full shrink-0">
                <div className="mb-5 flex w-full min-w-0 items-stretch gap-2 sm:gap-3">
                  {effectiveLayoutWidth >= NAV_BURGER_MIN_LAYOUT_WIDTH_PX ? (
                    <AppBurgerButton
                      onClick={() => setNavDrawerOpen(true)}
                      onLogoClick={handleSaveAndClose}
                      className="h-14 min-h-0 w-auto min-w-0 shrink-0 self-stretch rounded-[16px] border-0 bg-white shadow-[var(--shadow-card)] sm:h-16"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <TopBar
                      title={reportTitle}
                      onTitleChange={setReportTitle}
                      onPublish={handleOpenPublishModal}
                      onSaveAndClose={handleSaveAndClose}
                      onBackToReports={handleSaveAndClose}
                      publishDisabled={sections.length === 0}
                      autoSaveStatus={autoSaveStatus}
                      reportStatus={activeReportStatus}
                      effectiveLayoutWidth={effectiveLayoutWidth}
                      timeline={editorTimeline}
                      onTimelineChange={setEditorTimeline}
                      onShare={
                        activeDashboardId && activeReportStatus === 'published'
                          ? () => setShareDashboardId(activeDashboardId)
                          : undefined
                      }
                      onDelete={
                        activeDashboardId != null
                          ? () => handleDeleteDashboard(activeDashboardId)
                          : undefined
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
                <div className="pt-2 pb-6 sm:pt-3">
                  <div
                    className="mx-auto flex w-full flex-col"
                    style={{ maxWidth: `${reportsContentMaxWidth}px` }}
                  >
                    <div className="min-w-0 flex-1 bg-[#ebebeb] px-0 pt-0">
                      <div className="mx-auto flex w-full flex-col gap-0">
                        {publishModalOpen ? (
                          <PublishDashboardModal
                            onClose={() => setPublishModalOpen(false)}
                            onConfirm={handleConfirmPublish}
                            initialTitle={reportTitle}
                          />
                        ) : null}

                        <Suspense fallback={null}>
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
                            effectiveLayoutWidth={effectiveLayoutWidth}
                            timelineValue={editorTimeline}
                          />
                        </Suspense>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <WidgetPickerPanel
            open={panelOpen}
            categories={categories}
            selectedTemplateIds={selectedWidgetTemplateIds}
            templateInstanceCounts={templateInstanceCounts}
            onClose={requestCloseWidgetPicker}
            onPickWidget={handlePickWidgetFromPanel}
            onRemoveFromCanvas={handleRemoveTemplateFromPicker}
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

        {shareDashboard ? (
          <ShareDashboardModal
            dashboard={shareDashboard}
            onClose={() => setShareDashboardId(null)}
            onShareEmailsChange={(emails) => handleShareEmailsUpdate(shareDashboard.id, emails)}
          />
        ) : null}

        <DragOverlay dropAnimation={null}>
          {activePalette ? (
            <div className="flex w-[min(100vw-2rem,16rem)] max-w-full items-center justify-between rounded-xl border border-[#d7d7d7] bg-white px-2 py-3 shadow-[var(--shadow-elevated)] sm:w-64">
              <span className="font-['Poppins',sans-serif] text-sm text-[var(--color-grey-darkest)]/80">{activePalette.label}</span>
            </div>
          ) : null}
        </DragOverlay>
      </WidgetLibraryOpenProvider>
    </DndContext>
  );
}
