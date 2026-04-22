import type { CSSProperties } from 'react';

/** Canvas slot height — OBIS2.0 editor (Figma slot module; KPI card 716-4250 uses same frame). */
export const CANVAS_WIDGET_SLOT_HEIGHT_PX = 320;
export const CANVAS_WIDGET_SLOT_HEIGHT_L1_PX = 270;

export function canvasWidgetSlotHeightPx(canvasListL1: boolean): number {
  return canvasListL1 ? CANVAS_WIDGET_SLOT_HEIGHT_L1_PX : CANVAS_WIDGET_SLOT_HEIGHT_PX;
}

export function canvasWidgetSlotFrameStyle(canvasListL1: boolean): CSSProperties {
  const h = canvasWidgetSlotHeightPx(canvasListL1);
  return { boxSizing: 'border-box', height: h, minHeight: h };
}
