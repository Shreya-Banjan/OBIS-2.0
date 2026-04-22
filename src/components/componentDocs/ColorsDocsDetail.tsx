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
 * Design-token reference for OBIS 2.0 brand colors — Primary and Secondary on one page.
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
            Brand coral for emphasis, selected filters, focus rings, and interactive highlights. Primary
            actions use the separate CTA fill below.
          </p>

          <div className="overflow-hidden rounded-2xl border border-[#ebebeb] bg-[#fafafa] p-6">
            <div
              className="h-28 w-full max-w-md rounded-xl shadow-[var(--shadow-card)]"
              style={{ backgroundColor: '#f96c50' }}
              aria-hidden
            />
            <dl className="mt-4 grid gap-2 font-['Inter',sans-serif] text-sm">
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <dt className="text-[#707070]">Hex</dt>
                <dd className="font-mono text-[#1e1e1f]">#F96C50</dd>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <dt className="text-[#707070]">RGB</dt>
                <dd className="font-mono text-[#1e1e1f]">rgb(249, 108, 80)</dd>
              </div>
            </dl>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#ebebeb] bg-[#fafafa] p-6">
            <p className="mb-3 font-['Inter',sans-serif] text-xs font-medium text-[#707070]">
              Primary CTA (filled buttons)
            </p>
            <div
              className="h-20 w-full max-w-md rounded-xl shadow-[var(--shadow-card)]"
              style={{ backgroundColor: '#333333' }}
              aria-hidden
            />
            <dl className="mt-4 grid gap-2 font-['Inter',sans-serif] text-sm">
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <dt className="text-[#707070]">Hex</dt>
                <dd className="font-mono text-[#1e1e1f]">#333333</dd>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <dt className="text-[#707070]">RGB</dt>
                <dd className="font-mono text-[#1e1e1f]">rgb(51, 51, 51)</dd>
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
            Neutral outline treatment: white surface, darkest grey border, dark text. Used for secondary
            actions alongside primary brand color. Matches{' '}
            <span className="font-medium text-[#1e1e1f]">SecondaryButton</span>.
          </p>

          <div className="flex flex-col gap-4 rounded-2xl border border-[#ebebeb] bg-[#fafafa] p-6">
            <SwatchRow
              label="Border"
              hex="#333333"
              className="bg-white ring-2 ring-inset ring-[var(--color-grey-darkest)]"
            />
            <SwatchRow label="Surface" hex="#FFFFFF" className="bg-white" />
            <SwatchRow label="Label (default)" hex="#333333" className="bg-[var(--color-grey-darkest)]" />
          </div>

          <p className="max-w-xl font-['Inter',sans-serif] text-xs text-[#707070]">
            Body copy often uses ink <span className="font-mono text-[#1e1e1f]">#1E1E1F</span> (
            <code className="font-mono">--color-ink</code>); secondary labels use{' '}
            <span className="font-mono text-[#1e1e1f]">#333333</span> (
            <code className="font-mono">--color-grey-darkest</code>) for maximum contrast on white.
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
