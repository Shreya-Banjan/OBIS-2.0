import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from 'react';
import { canvasWidgetSlotHeightPx } from '../canvasWidgetSlot';

/** Placeholders shorter than this use a minimal strip layout (icon hidden, tiny type). */
const PLACEHOLDER_COMPACT_STRIP_MAX_PX = 32;
import { useWidgetLibraryOpen } from '../context/WidgetLibraryContext';
import { AddWidgetCta, ADD_WIDGET_CTA_TOP_BAR_LAYOUT_CLASS } from './AddWidgetCta';
import { IconPlusSoft } from './Icons';

/** Inner tile: default no border; brand ring when widget library targets this slot. */
const CANVAS_CLASS_BASE =
  "group min-h-0 min-w-0 h-full w-full box-border flex shrink-0 flex-col items-center justify-center gap-3 rounded-[var(--radius-canvas)] bg-white px-4 py-6 text-center outline-none transition-[background-color,color,border-color] font-['Inter',sans-serif] text-[13px] font-normal text-[var(--color-grey-darkest)]/80 hover:bg-[#fafafa] focus-visible:shadow-[var(--shadow-focus)] active:bg-[#f0f0f0]";

export type EditorAddWidgetCtaProps = {
  layout: 'topBar' | 'canvas';
  placeholderInstanceId?: string;
  /** Widget library is open for this placeholder (outer focus ring + aria). */
  isLibraryTarget?: boolean;
  /** Narrow canvas (below 640px effective width): placeholder height matches `canvasWidgetSlotHeightPx`. */
  canvasListL1?: boolean;
  /** When set (e.g. dashboard banner strip), overrides default canvas slot height. */
  slotHeightPx?: number;
  style?: CSSProperties;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'>;

export const EditorAddWidgetCta = forwardRef<HTMLButtonElement, EditorAddWidgetCtaProps>(
  function EditorAddWidgetCta(
    {
      layout,
      placeholderInstanceId,
      isLibraryTarget,
      canvasListL1 = false,
      slotHeightPx,
      className,
      style,
      onClick,
      ...rest
    },
    ref
  ) {
    const open = useWidgetLibraryOpen();

    if (layout === 'canvas') {
      const h = slotHeightPx ?? canvasWidgetSlotHeightPx(canvasListL1);
      const compactStrip =
        slotHeightPx != null && slotHeightPx <= PLACEHOLDER_COMPACT_STRIP_MAX_PX;
      return (
        <button
          ref={ref}
          type="button"
          {...rest}
          onClick={(e) => {
            onClick?.(e);
            open(null, placeholderInstanceId ?? null);
          }}
          style={{
            ...style,
            boxSizing: 'border-box',
            height: h,
            minHeight: h,
            maxHeight: compactStrip ? h : undefined,
          }}
          className={[
            CANVAS_CLASS_BASE,
            compactStrip
              ? 'gap-0 overflow-hidden px-2 py-0 text-[10px] font-medium leading-none [&_svg]:hidden'
              : '',
            isLibraryTarget
              ? 'border-2 border-solid border-[var(--color-brand-primary)] shadow-[0_0_0_3px_rgba(249,108,80,0.25)]'
              : 'border-0',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          data-neuron-slot="select-widget"
          aria-label="Select Widget"
          aria-pressed={isLibraryTarget ? true : undefined}
          aria-expanded={isLibraryTarget ? true : undefined}
        >
          {!compactStrip ? (
            <IconPlusSoft className="block size-[18px] shrink-0 text-[var(--color-grey-darkest)]/40 transition-colors group-hover:text-[var(--color-brand-primary)]" aria-hidden />
          ) : null}
          <span
            className={
              compactStrip
                ? 'max-w-full truncate text-[var(--color-grey-darkest)]/55'
                : 'max-w-[9rem] text-center text-pretty leading-snug'
            }
          >
            Select Widget
          </span>
        </button>
      );
    }

    return (
      <AddWidgetCta
        ref={ref}
        onClick={() => open(null, null)}
        className={[ADD_WIDGET_CTA_TOP_BAR_LAYOUT_CLASS, className].filter(Boolean).join(' ')}
        style={style}
        {...rest}
      />
    );
  },
);
