import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';

const FIGMA_BUTTON_URL =
  'https://www.figma.com/design/aeQeZHeULUG3dyZQaU1S9y/Neuron-2.0?node-id=5666-67231';

const SIZE_ROWS = [
  { size: 'large' as const, label: 'Large' },
  { size: 'medium' as const, label: 'Medium' },
  { size: 'small' as const, label: 'Small' },
];

/**
 * Live preview for the design-system Button page, aligned to OBIS 2.0 Figma
 * (`Button_Primary` / `Button_Secondary` — see file link below).
 */
export function ButtonDocsDetail() {
  return (
    <div className="mt-8 flex flex-col gap-8">
      <p className="font-['Inter',sans-serif] text-xs text-[#707070]">
        Figma:{' '}
        <a
          href={FIGMA_BUTTON_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#5360e1] underline decoration-[#5360e1]/35 underline-offset-2 hover:text-[#1e1e1f] hover:decoration-[#1e1e1f]/40"
        >
          OBIS 2.0 — Button (Primary &amp; Secondary)
        </a>
      </p>

      <section aria-labelledby="btn-docs-primary">
        <h3 id="btn-docs-primary" className="mb-3 font-['Poppins',sans-serif] text-sm font-semibold text-[#1e1e1f]">
          Primary
        </h3>
        <div className="flex flex-col gap-5">
          {SIZE_ROWS.map(({ size, label }) => (
            <div key={size}>
              <p className="mb-2 font-['Inter',sans-serif] text-xs font-medium text-[#707070]">{label}</p>
              <div className="flex flex-wrap items-center gap-4">
                <PrimaryButton type="button" size={size}>
                  Publish
                </PrimaryButton>
                <PrimaryButton type="button" size={size} disabled>
                  Publish
                </PrimaryButton>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="btn-docs-secondary">
        <h3 id="btn-docs-secondary" className="mb-3 font-['Poppins',sans-serif] text-sm font-semibold text-[#1e1e1f]">
          Secondary
        </h3>
        <div className="flex flex-col gap-5">
          {SIZE_ROWS.map(({ size, label }) => (
            <div key={size}>
              <p className="mb-2 font-['Inter',sans-serif] text-xs font-medium text-[#707070]">{label}</p>
              <div className="flex flex-wrap items-center gap-4">
                <SecondaryButton type="button" size={size}>
                  Cancel
                </SecondaryButton>
                <SecondaryButton type="button" size={size} disabled>
                  Cancel
                </SecondaryButton>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
