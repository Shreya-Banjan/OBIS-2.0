import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';

function SwatchRow({
  label,
  hex,
  className,
}: {
  label: string;
  hex: string;
  className: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div
        className={`size-16 shrink-0 rounded-xl border border-[#ebebeb] shadow-[var(--shadow-subtle)] ${className}`}
        aria-hidden
      />
      <div className="min-w-0 font-['Inter',sans-serif] text-sm">
        <p className="font-medium text-[#1e1e1f]">{label}</p>
        <p className="mt-0.5 font-mono text-xs text-[#707070]">{hex}</p>
      </div>
    </div>
  );
}

/**
 * Design-token reference for Neuron 2.0 brand colors — Primary and Secondary on one page.
 */
export function ColorsDocsDetail() {
  return (
    <div className="mt-8 flex flex-col gap-10">
      <section aria-labelledby="colors-docs-primary">
        <h3
          id="colors-docs-primary"
          className="mb-4 font-['Poppins',sans-serif] text-sm font-semibold text-[#1e1e1f]"
        >
          Primary
        </h3>
        <div className="flex flex-col gap-6">
          <p className="max-w-xl font-['Inter',sans-serif] text-sm text-[#707070]">
            Brand magenta for primary actions, emphasis, and interactive highlights. Matches{' '}
            <span className="font-medium text-[#1e1e1f]">PrimaryButton</span> fill and focus rings that
            reference this hue.
          </p>

          <div className="overflow-hidden rounded-2xl border border-[#ebebeb] bg-[#fafafa] p-6">
            <div
              className="h-28 w-full max-w-md rounded-xl shadow-[var(--shadow-card)]"
              style={{ backgroundColor: '#e20074' }}
              aria-hidden
            />
            <dl className="mt-4 grid gap-2 font-['Inter',sans-serif] text-sm">
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <dt className="text-[#707070]">Hex</dt>
                <dd className="font-mono text-[#1e1e1f]">#E20074</dd>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <dt className="text-[#707070]">RGB</dt>
                <dd className="font-mono text-[#1e1e1f]">rgb(226, 0, 116)</dd>
              </div>
            </dl>
          </div>

          <div>
            <p className="mb-3 font-['Inter',sans-serif] text-xs font-medium text-[#707070]">In context</p>
            <div className="flex flex-wrap items-center gap-4">
              <PrimaryButton type="button" size="large">
                Publish
              </PrimaryButton>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="colors-docs-secondary">
        <h3
          id="colors-docs-secondary"
          className="mb-4 font-['Poppins',sans-serif] text-base font-medium text-[#1e1e1f]"
        >
          Secondary
        </h3>
        <div className="flex flex-col gap-6">
          <p className="max-w-xl font-['Inter',sans-serif] text-sm text-[#707070]">
            Neutral outline treatment: white surface, black border, dark text. Used for secondary actions
            alongside primary brand color. Matches{' '}
            <span className="font-medium text-[#1e1e1f]">SecondaryButton</span>.
          </p>

          <div className="flex flex-col gap-4 rounded-2xl border border-[#ebebeb] bg-[#fafafa] p-6">
            <SwatchRow label="Border" hex="#000000" className="bg-white ring-2 ring-inset ring-black" />
            <SwatchRow label="Surface" hex="#FFFFFF" className="bg-white" />
            <SwatchRow label="Label (default)" hex="#000000" className="bg-black" />
          </div>

          <p className="max-w-xl font-['Inter',sans-serif] text-xs text-[#707070]">
            Body copy often uses ink <span className="font-mono text-[#1e1e1f]">#1E1E1F</span> (
            <code className="font-mono">--color-ink</code>); buttons use solid black for maximum contrast on
            secondary controls.
          </p>

          <div>
            <p className="mb-3 font-['Inter',sans-serif] text-xs font-medium text-[#707070]">In context</p>
            <div className="flex flex-wrap items-center gap-4">
              <SecondaryButton type="button" size="large">
                Cancel
              </SecondaryButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
