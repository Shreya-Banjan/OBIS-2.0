import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from 'react';
import { useWidgetLibraryOpen } from '../context/WidgetLibraryContext';
import { AddWidgetCta, ADD_WIDGET_CTA_TOP_BAR_LAYOUT_CLASS } from './AddWidgetCta';
import { IconPlusSoft } from './Icons';

/** Fixed height for canvas placeholder tiles (also set inline so flex/dnd cannot collapse it). */
const CANVAS_PLACEHOLDER_HEIGHT_PX = 280;

/** Inner tile: no border (no shadow). */
const CANVAS_CLASS =
  "group min-w-0 w-full box-border flex shrink-0 flex-col items-center justify-center gap-3 rounded-[var(--radius-canvas)] border-0 bg-white px-4 py-6 text-center outline-none transition-[background-color,color] font-['Inter',sans-serif] text-[13px] font-normal text-black/80 hover:bg-[#fafafa] focus-visible:shadow-[var(--shadow-focus)] active:bg-[#f0f0f0]";

export type EditorAddWidgetCtaProps = {
  layout: 'topBar' | 'canvas';
  placeholderInstanceId?: string;
  /** Widget library is open for this placeholder (outer focus ring + aria). */
  isLibraryTarget?: boolean;
  style?: CSSProperties;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'>;

export const EditorAddWidgetCta = forwardRef<HTMLButtonElement, EditorAddWidgetCtaProps>(
  function EditorAddWidgetCta(
    { layout, placeholderInstanceId, isLibraryTarget, className, style, onClick, ...rest },
    ref
  ) {
    const open = useWidgetLibraryOpen();

    if (layout === 'canvas') {
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
            height: CANVAS_PLACEHOLDER_HEIGHT_PX,
            minHeight: CANVAS_PLACEHOLDER_HEIGHT_PX,
          }}
          className={[CANVAS_CLASS, className].filter(Boolean).join(' ')}
          data-neuron-slot="select-widget"
          aria-label="Select widget"
          aria-expanded={isLibraryTarget ? true : undefined}
        >
          <IconPlusSoft className="size-[18px] shrink-0 text-black/40 transition-colors group-hover:text-[#E20074]" aria-hidden />
          <span className="max-w-[9rem] text-center text-pretty leading-snug">Select widget</span>
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
