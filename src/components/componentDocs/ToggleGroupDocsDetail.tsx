import { useState } from 'react';
import { IconLayoutGrid, IconLayoutList } from '../Icons';
import { ToggleGroup } from '../ToggleGroup';

const FIGMA_TOGGLE_GROUP_URL =
  'https://www.figma.com/design/aeQeZHeULUG3dyZQaU1S9y/Neuron-2.0?node-id=6098-35524';

type LayoutMode = 'grid' | 'list';

/**
 * Live preview for the design-system Toggle Group page — Neuron 2.0 layout toggle (Grid / List).
 */
export function ToggleGroupDocsDetail() {
  const [layout, setLayout] = useState<LayoutMode>('grid');

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
          Neuron 2.0 — Toggle Group
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
          Two-segment icon toggle. Selected segment uses a black pill; the other stays white. Current
          selection: <span className="font-medium text-[#1e1e1f]">{layout}</span>.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <ToggleGroup<LayoutMode>
            aria-label="Dashboard layout"
            value={layout}
            onValueChange={setLayout}
            segments={[
              {
                value: 'grid',
                label: 'Grid layout',
                icon: <IconLayoutGrid className="shrink-0" aria-hidden />,
              },
              {
                value: 'list',
                label: 'List layout',
                icon: <IconLayoutList className="shrink-0" aria-hidden />,
              },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
