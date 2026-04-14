import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IconLayoutGrid,
  IconSearch,
  IconUiCategoryColors,
  IconUiCategoryDisplay,
  IconUiCategoryFeedback,
  IconUiCategoryInputs,
  IconUiCategoryNavigation,
  IconUiCategoryOverlay,
} from '../components/Icons';
import { UiComponentDetail } from '../components/UiComponentDetail';
import {
  UI_COMPONENT_CATEGORIES,
  UI_COMPONENT_DEFAULT_ID,
  componentsHashForId,
  getUiComponentById,
  parseComponentsHash,
  type UiComponentTag,
} from '../data/uiComponents';

type ComponentsPageProps = {
  onBackToDashboard: () => void;
};

function NavTagBadge({ kind, selected }: { kind: UiComponentTag; selected: boolean }) {
  if (kind === 'new') {
    return (
      <span
        className={`ml-auto inline-flex shrink-0 rounded px-1.5 py-0.5 font-['Inter',sans-serif] text-[10px] font-semibold uppercase tracking-wide ${
          selected ? 'bg-white/15 text-[#ffb8d9]' : 'text-[#e20074]'
        }`}
      >
        New
      </span>
    );
  }
  return (
    <span
      className={`ml-auto inline-flex shrink-0 rounded px-1.5 py-0.5 font-['Inter',sans-serif] text-[10px] font-semibold uppercase tracking-wide ${
        selected ? 'bg-white/15 text-[#b8c4ff]' : 'text-[#5360e1]'
      }`}
    >
      Updated
    </span>
  );
}

function CategorySectionIcon({ categoryId }: { categoryId: string }) {
  const cls = 'size-4 shrink-0 text-[#707070]';
  switch (categoryId) {
    case 'colors':
      return <IconUiCategoryColors className={cls} aria-hidden />;
    case 'inputs':
      return <IconUiCategoryInputs className={cls} aria-hidden />;
    case 'display':
      return <IconUiCategoryDisplay className={cls} aria-hidden />;
    case 'feedback':
      return <IconUiCategoryFeedback className={cls} aria-hidden />;
    case 'overlay':
      return <IconUiCategoryOverlay className={cls} aria-hidden />;
    case 'navigation':
      return <IconUiCategoryNavigation className={cls} aria-hidden />;
    default:
      return <IconLayoutGrid className={cls} aria-hidden />;
  }
}

export function ComponentsPage({ onBackToDashboard }: ComponentsPageProps) {
  const [activeId, setActiveId] = useState(() =>
    typeof window !== 'undefined' ? parseComponentsHash(window.location.hash) : UI_COMPONENT_DEFAULT_ID
  );

  useEffect(() => {
    const syncFromHash = () => {
      setActiveId(parseComponentsHash(window.location.hash));
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const navigateToComponent = useCallback((id: string) => {
    const next = componentsHashForId(id);
    if (window.location.hash !== next) {
      window.location.hash = next;
    } else {
      setActiveId(id);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = window.location.hash;
    if (!h || h === '#') {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}${componentsHashForId(UI_COMPONENT_DEFAULT_ID)}`
      );
    }
  }, []);

  const active = useMemo(() => getUiComponentById(activeId), [activeId]);

  const [listQuery, setListQuery] = useState('');

  const filteredCategories = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    if (!q) {
      return UI_COMPONENT_CATEGORIES;
    }
    return UI_COMPONENT_CATEGORIES.map((cat) => {
      const categoryMatches = cat.title.toLowerCase().includes(q);
      const items = cat.items.filter((item) => {
        if (categoryMatches) return true;
        if (item.label.toLowerCase().includes(q)) return true;
        const idAsWords = item.id.toLowerCase().replace(/-/g, ' ');
        if (idAsWords.includes(q)) return true;
        return false;
      });
      return { ...cat, items };
    }).filter((cat) => cat.items.length > 0);
  }, [listQuery]);

  const hasListMatches = filteredCategories.some((c) => c.items.length > 0);

  const handleBack = useCallback(() => {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    onBackToDashboard();
  }, [onBackToDashboard]);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-white font-[family-name:var(--font-inter)]">
      {/* Grid: on lg+, column 1 is flush-left nav; column 2 is padded content (max width preserved). */}
      <div className="grid min-h-dvh grid-cols-1 grid-rows-[auto_auto_1fr] gap-6 bg-white lg:grid-cols-[minmax(15rem,16rem)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-x-0 lg:gap-y-0">
        <header className="col-start-1 row-start-1 w-full max-w-none border-b border-[#ebebeb] px-3 pb-4 pt-4 sm:px-4 sm:pb-5 sm:pt-6 lg:col-start-2 lg:row-start-1 lg:w-full lg:justify-self-stretch lg:px-4 lg:pb-5">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 sm:flex-nowrap sm:gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex shrink-0 items-center font-['Inter',sans-serif] text-sm font-medium text-[#e20074] transition-colors hover:text-[#c40062] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e20074]/25 focus-visible:ring-offset-2"
                aria-label="Back to dashboards"
              >
                Back
              </button>
              <span
                className="hidden h-4 w-px shrink-0 self-center bg-[#ebebeb] sm:block"
                aria-hidden="true"
              />
              <h1 className="min-w-0 font-['Poppins',sans-serif] text-[16px] font-semibold leading-snug text-[#1e1e1f] sm:shrink-0 sm:whitespace-nowrap">
                Neuron Design System
              </h1>
            </div>
            <p className="min-w-0 font-['Inter',sans-serif] text-[12px] leading-snug text-[#707070] sm:flex-1 sm:truncate">
              UI primitives for Neuron Builder. Pick a component in the sidebar to open its page.
            </p>
          </div>
        </header>

        <aside
          className="col-start-1 row-start-2 flex min-h-0 w-full flex-col overflow-hidden rounded-none border-[#ebebeb] bg-white sm:mx-3 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:h-full lg:max-h-none lg:w-full lg:max-w-none lg:border-b-0 lg:border-l-0 lg:border-r lg:border-t-0 lg:border-[#ebebeb]"
          aria-label="Component navigation"
        >
            <div className="flex h-[67px] shrink-0 items-center border-b border-[#ebebeb] px-3 sm:px-4 lg:px-4">
              <img
                src="/rhombuz-logo.svg"
                alt="Rhombuz"
                className="h-[28px] w-auto max-w-[min(100%,200px)] object-contain object-left"
                width={118}
                height={28}
                decoding="async"
              />
            </div>
            <div className="p-3 sm:p-4 sm:pb-3">
              <div className="relative min-w-0">
                <label htmlFor="components-nav-search" className="sr-only">
                  Search components
                </label>
                <IconSearch
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#999]"
                  aria-hidden
                />
                <input
                  id="components-nav-search"
                  type="search"
                  value={listQuery}
                  onChange={(e) => setListQuery(e.target.value)}
                  placeholder="Search components…"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full min-w-0 rounded-lg border border-[#ebebeb] bg-[#fafafa] py-2 pl-9 pr-3 font-['Inter',sans-serif] text-sm text-[#1e1e1f] placeholder:text-[#999] outline-none ring-[#1e1e1f] focus:border-[#d7d7d7] focus:bg-white focus:ring-2 focus:ring-offset-0"
                />
              </div>
            </div>
            <nav className="max-h-[min(62dvh,460px)] min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:max-h-none">
              {!hasListMatches ? (
                <p
                  className="px-1 py-4 text-center font-['Inter',sans-serif] text-sm text-[#707070]"
                  role="status"
                  aria-live="polite"
                >
                  No components match “{listQuery.trim()}”.
                </p>
              ) : (
                filteredCategories.map((cat, sectionIndex) => (
                  <div key={cat.id}>
                    {sectionIndex > 0 ? (
                      <div className="my-4 border-t border-[#ebebeb]" role="separator" aria-hidden="true" />
                    ) : null}
                    <div>
                      <h2 className="mb-2 flex items-center gap-2 px-1 font-['Poppins',sans-serif] text-[11px] font-semibold uppercase tracking-wider text-[#999]">
                        <CategorySectionIcon categoryId={cat.id} />
                        <span>{cat.title}</span>
                      </h2>
                      <ul className="flex flex-col gap-0.5" role="list">
                        {cat.items.map((item) => {
                          const selected = item.id === activeId;
                          return (
                            <li key={item.id}>
                              <a
                                href={componentsHashForId(item.id)}
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigateToComponent(item.id);
                                }}
                                className={`flex w-full min-w-0 items-center gap-1 rounded-lg px-2.5 py-2 text-left font-['Inter',sans-serif] text-sm transition-colors ${
                                  selected
                                    ? 'bg-[#1e1e1f] font-medium text-white'
                                    : 'text-[#333] hover:bg-[#f5f5f5]'
                                }`}
                                aria-current={selected ? 'page' : undefined}
                              >
                                <span className="min-w-0 truncate">{item.label}</span>
                                {item.tags?.map((t) => (
                                  <NavTagBadge key={t} kind={t} selected={selected} />
                                ))}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ))
              )}
            </nav>
        </aside>

        <main className="col-start-1 row-start-3 min-h-0 w-full min-w-0 overflow-hidden rounded-2xl bg-white px-5 py-6 sm:mx-3 sm:px-8 sm:py-8 lg:col-start-2 lg:row-start-2 lg:mx-0 lg:max-w-[min(100%,1196px)] lg:justify-self-center lg:px-5 xl:max-w-[min(100%,1204px)]">
          {active ? (
            <UiComponentDetail item={active.item} categoryTitle={active.categoryTitle} />
          ) : (
            <p className="font-['Inter',sans-serif] text-sm text-[#707070]">Component not found.</p>
          )}
        </main>
      </div>
    </div>
  );
}
