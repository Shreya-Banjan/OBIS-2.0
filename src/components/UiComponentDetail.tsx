import type { UiComponentItem } from '../data/uiComponents';
import { AvatarDocsDetail } from './componentDocs/AvatarDocsDetail';
import { ButtonDocsDetail } from './componentDocs/ButtonDocsDetail';
import { ColorsDocsDetail } from './componentDocs/ColorsDocsDetail';
import { ToggleGroupDocsDetail } from './componentDocs/ToggleGroupDocsDetail';

type UiComponentDetailProps = {
  item: UiComponentItem;
  categoryTitle: string;
};

function TagBadge({ kind }: { kind: 'new' | 'updated' }) {
  if (kind === 'new') {
    return (
      <span className="inline-flex shrink-0 rounded-md bg-[rgba(249,108,80,0.12)] px-2 py-0.5 font-['Inter',sans-serif] text-xs font-medium text-[var(--color-brand-primary)]">
        New
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 rounded-md bg-[rgba(0,107,235,0.1)] px-2 py-0.5 font-['Inter',sans-serif] text-xs font-medium text-[#5360e1]">
      Updated
    </span>
  );
}

export function UiComponentDetail({ item, categoryTitle }: UiComponentDetailProps) {
  return (
    <article
      className="mx-auto min-w-0 w-full max-w-4xl"
      aria-labelledby={`ui-component-${item.id}-title`}
    >
      <div className="flex flex-wrap items-center gap-2 gap-y-1">
        <h2
          id={`ui-component-${item.id}-title`}
          className="font-['Poppins',sans-serif] text-xl font-semibold text-[#1e1e1f] sm:text-2xl"
        >
          {item.label}
        </h2>
        {item.tags?.map((t) => (
          <TagBadge key={t} kind={t} />
        ))}
      </div>
      <p className="mt-1 font-['Inter',sans-serif] text-sm text-[#707070]">
        {categoryTitle} · Reference and examples for this UI primitive.
      </p>

      {item.id === 'button' ? (
        <ButtonDocsDetail />
      ) : item.id === 'colors' ? (
        <ColorsDocsDetail />
      ) : item.id === 'toggle-group' ? (
        <ToggleGroupDocsDetail />
      ) : item.id === 'avatar' ? (
        <AvatarDocsDetail />
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-[#d7d7d7] bg-white p-8">
          <p className="text-center font-['Inter',sans-serif] text-sm text-[#707070]">
            Preview and usage documentation for <strong className="font-medium text-[#1e1e1f]">{item.label}</strong>{' '}
            will appear here.
          </p>
        </div>
      )}
    </article>
  );
}
