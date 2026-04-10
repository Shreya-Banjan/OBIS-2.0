import { Avatar, AvatarGroup, type AvatarGroupItem } from '../Avatar';

const FIGMA_SINGLE =
  'https://www.figma.com/design/aeQeZHeULUG3dyZQaU1S9y/Neuron-2.0?node-id=6154-36696';
const FIGMA_MULTIPLE =
  'https://www.figma.com/design/aeQeZHeULUG3dyZQaU1S9y/Neuron-2.0?node-id=6140-36392';
const FIGMA_OVERFLOW =
  'https://www.figma.com/design/aeQeZHeULUG3dyZQaU1S9y/Neuron-2.0?node-id=6140-36432';

const THREE: AvatarGroupItem[] = [
  { id: '1', name: 'Sam Rowe' },
  { id: '2', name: 'Vera Miles' },
  { id: '3', name: 'Alex Chen' },
];

const MANY: AvatarGroupItem[] = [
  { id: '1', name: 'Sam Rowe' },
  { id: '2', name: 'Alex Chen' },
  { id: '3', name: 'Morgan Lee' },
  { id: '4', name: 'Jordan Kim' },
  { id: '5', name: 'Riley Park' },
];

/**
 * Design-system Avatar — single 24×24 tile, stacked group, and +N overflow when more than three people.
 */
export function AvatarDocsDetail() {
  return (
    <div className="mt-8 flex flex-col gap-8">
      <p className="font-['Inter',sans-serif] text-xs text-[#707070]">
        Figma:{' '}
        <a
          href={FIGMA_SINGLE}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#5360e1] underline decoration-[#5360e1]/35 underline-offset-2 hover:text-[#1e1e1f] hover:decoration-[#1e1e1f]/40"
        >
          Avatar
        </a>
        ,{' '}
        <a
          href={FIGMA_MULTIPLE}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#5360e1] underline decoration-[#5360e1]/35 underline-offset-2 hover:text-[#1e1e1f] hover:decoration-[#1e1e1f]/40"
        >
          Multiple
        </a>
        ,{' '}
        <a
          href={FIGMA_OVERFLOW}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#5360e1] underline decoration-[#5360e1]/35 underline-offset-2 hover:text-[#1e1e1f] hover:decoration-[#1e1e1f]/40"
        >
          More than three
        </a>
      </p>

      <section aria-labelledby="avatar-docs-single">
        <h3
          id="avatar-docs-single"
          className="mb-3 font-['Poppins',sans-serif] text-sm font-semibold text-[#1e1e1f]"
        >
          Single
        </h3>
        <p className="mb-4 max-w-xl font-['Inter',sans-serif] text-sm text-[#707070]">
          24×24px, full round, 1px white border, Poppins 12px initial on a pastel background (or photo).
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <Avatar name="Pat Kim" />
        </div>
      </section>

      <section aria-labelledby="avatar-docs-multiple">
        <h3
          id="avatar-docs-multiple"
          className="mb-3 font-['Poppins',sans-serif] text-sm font-semibold text-[#1e1e1f]"
        >
          Multiple (up to three)
        </h3>
        <p className="mb-4 max-w-xl font-['Inter',sans-serif] text-sm text-[#707070]">
          Avatars overlap by 8px (<code className="rounded bg-[#f0f0f0] px-1.5 py-0.5 text-xs">-ml-2</code> after the
          first).
        </p>
        <AvatarGroup avatars={THREE} aria-label="Three collaborators" />
      </section>

      <section aria-labelledby="avatar-docs-overflow">
        <h3
          id="avatar-docs-overflow"
          className="mb-3 font-['Poppins',sans-serif] text-sm font-semibold text-[#1e1e1f]"
        >
          More than three
        </h3>
        <p className="mb-4 max-w-xl font-['Inter',sans-serif] text-sm text-[#707070]">
          Shows the first two faces plus a rose tile with <span className="font-medium text-[#1e1e1f]">+N</span> for the
          remaining count (10px type).
        </p>
        <AvatarGroup avatars={MANY} aria-label="Five collaborators" />
      </section>
    </div>
  );
}
