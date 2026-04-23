import { useState } from 'react';
import { IconLayoutGrid, IconLayoutList } from '../Icons';
import { ToggleGroup, type ToggleGroupSize } from '../ToggleGroup';

const FIGMA_TOGGLE_GROUP_URL =
  'https://www.figma.com/design/aeQeZHeULUG3dyZQaU1S9y/Neuron-2.0?node-id=6098-35524';

type LayoutMode = 'grid' | 'list';

const SIZE_ROWS: { size: ToggleGroupSize; label: string }[] = [
  { size: 'large', label: 'Large' },
  { size: 'medium', label: 'Medium' },
  { size: 'small', label: 'Small' },
];

const LAYOUT_SEGMENTS = [
  {
    value: 'grid' as const,
    label: 'Grid layout',
    icon: <IconLayoutGrid className="shrink-0" aria-hidden />,
  },
  {
    value: 'list' as const,
    label: 'List layout',
    icon: <IconLayoutList className="shrink-0" aria-hidden />,
  },
] as const;

/**
 * Live preview for the design-system Toggle Group page — OBIS 2.0 layout toggle (Grid / List).
 */
export function ToggleGroupDocsDetail() {
  const [layoutLarge, setLayoutLarge] = useState<LayoutMode>('grid');
  const [layoutMedium, setLayoutMedium] = useState<LayoutMode>('grid');
  const [layoutSmall, setLayoutSmall] = useState<LayoutMode>('grid');

  const layoutBySize: Record<ToggleGroupSize, LayoutMode> = {
    large: layoutLarge,
    medium: layoutMedium,
    small: layoutSmall,
  };
  const setLayoutBySize: Record<ToggleGroupSize, (v: LayoutMode) => void> = {
    large: setLayoutLarge,
    medium: setLayoutMedium,
    small: setLayoutSmall,
  };

  return (
    <div className="mt-8 flex flex-col gap-8">
      <p className="font-['Inter',sans-serif] text-xs text-[#707070]">
        Figma:{' '}
        <a
          href={FIGMA_TOGGLE_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#5360e1] underline decoration-[#5360e1]/35 underline-offset-2 hover:text-[#1e1e1f] hover:decoration-[#1e1e1f]/40"
        >
          OBIS 2.0 — Toggle Group
        </a>
      </p>

      <section aria-labelledby="toggle-group-docs-default">
        <h3
          id="toggle-group-docs-default"
          className="mb-3 font-['Poppins',sans-serif] text-sm font-semibold text-[#1e1e1f]"
        >
          Layout (Grid / List)
        </h3>
        <p className="mb-4 max-w-xl font-['Inter',sans-serif] text-sm text-[#707070]">
          Two-segment icon toggle. The selected thumb is white with a 1px #e8e8e8 frame; active icon #333333, inactive #999999.{' '}
          <span className="font-medium text-[#1e1e1f]">Medium</span> uses a 32×64 outer frame with 12px corners
          and no inner gutter so the thumb meets the shell; large and small scale proportionally.
        </p>
        <div className="flex flex-col gap-5">
          {SIZE_ROWS.map(({ size, label }) => (
            <div key={size}>
              <p className="mb-2 font-['Inter',sans-serif] text-xs font-medium text-[#707070]">{label}</p>
              <div className="flex flex-wrap items-center gap-4">
                <ToggleGroup<LayoutMode>
                  aria-label={`Dashboard layout (${label})`}
                  size={size}
                  value={layoutBySize[size]}
                  onValueChange={setLayoutBySize[size]}
                  segments={LAYOUT_SEGMENTS}
                />
                <span className="font-['Inter',sans-serif] text-xs text-[#707070]">
                  {layoutBySize[size]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
