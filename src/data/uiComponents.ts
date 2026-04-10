/** Tag shown next to nav items when a component is new or updated. */
export type UiComponentTag = 'new' | 'updated';

export type UiComponentItem = {
  id: string;
  label: string;
  /** Optional: set `tags: ['new']` or `['updated']` (or both) so the sidebar and detail header show badges. */
  tags?: UiComponentTag[];
};

export type UiComponentCategory = {
  id: string;
  title: string;
  items: UiComponentItem[];
};

export const UI_COMPONENT_CATEGORIES: UiComponentCategory[] = [
  {
    id: 'inputs',
    title: 'Inputs',
    items: [
      { id: 'button', label: 'Button' },
      { id: 'input', label: 'Input' },
      { id: 'textarea', label: 'Textarea' },
      { id: 'select', label: 'Select' },
      { id: 'checkbox', label: 'Checkbox' },
      { id: 'radio-group', label: 'Radio Group' },
      { id: 'switch', label: 'Switch' },
      { id: 'toggle', label: 'Toggle' },
      { id: 'toggle-group', label: 'Toggle Group' },
      { id: 'slider', label: 'Slider' },
      { id: 'form', label: 'Form' },
      { id: 'label', label: 'Label' },
    ],
  },
  {
    id: 'display',
    title: 'Display',
    items: [
      { id: 'card', label: 'Card' },
      { id: 'avatar', label: 'Avatar' },
      { id: 'badge', label: 'Badge' },
      { id: 'table', label: 'Table' },
      { id: 'accordion', label: 'Accordion' },
      { id: 'tabs', label: 'Tabs' },
      { id: 'separator', label: 'Separator' },
      { id: 'skeleton', label: 'Skeleton' },
      { id: 'progress', label: 'Progress' },
      { id: 'calendar', label: 'Calendar' },
      { id: 'collapsible', label: 'Collapsible' },
      { id: 'scroll-area', label: 'Scroll Area' },
    ],
  },
  {
    id: 'feedback',
    title: 'Feedback',
    items: [
      { id: 'alert', label: 'Alert' },
      { id: 'sonner', label: 'Sonner' },
      { id: 'spinner', label: 'Spinner' },
      { id: 'toast', label: 'Toast message' },
    ],
  },
  {
    id: 'overlay',
    title: 'Overlay',
    items: [
      { id: 'dialog', label: 'Dialog' },
      { id: 'alert-dialog', label: 'Alert Dialog' },
      { id: 'sheet', label: 'Sheet' },
      { id: 'drawer', label: 'Drawer' },
      { id: 'popover', label: 'Popover' },
      { id: 'tooltip', label: 'Tooltip' },
      { id: 'hover-card', label: 'Hover Card' },
      { id: 'command', label: 'Command' },
    ],
  },
  {
    id: 'navigation',
    title: 'Navigation',
    items: [
      { id: 'breadcrumb', label: 'Breadcrumb' },
      { id: 'dropdown-menu', label: 'Dropdown Menu' },
      { id: 'context-menu', label: 'Context Menu' },
      { id: 'menubar', label: 'Menubar' },
      { id: 'navigation-menu', label: 'Navigation Menu' },
      { id: 'pagination', label: 'Pagination' },
    ],
  },
];

const flatItems: { item: UiComponentItem; categoryTitle: string }[] = [];
for (const cat of UI_COMPONENT_CATEGORIES) {
  for (const item of cat.items) {
    flatItems.push({ item, categoryTitle: cat.title });
  }
}

const validIds = new Set(flatItems.map(({ item }) => item.id));

export const UI_COMPONENT_DEFAULT_ID = 'button';

export function isUiComponentId(id: string): boolean {
  return validIds.has(id);
}

export function getUiComponentById(id: string): { item: UiComponentItem; categoryTitle: string } | undefined {
  return flatItems.find(({ item }) => item.id === id);
}

export function parseComponentsHash(hash: string): string {
  const m = /^#\/components\/([^/]+)\/?$/.exec(hash);
  if (!m) return UI_COMPONENT_DEFAULT_ID;
  const id = decodeURIComponent(m[1]);
  return isUiComponentId(id) ? id : UI_COMPONENT_DEFAULT_ID;
}

export function componentsHashForId(id: string): string {
  return `#/components/${encodeURIComponent(id)}`;
}
