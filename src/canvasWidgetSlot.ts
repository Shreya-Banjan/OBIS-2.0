import type { CSSProperties } from 'react';

/** Canvas slot height — OBIS2.0 editor (Figma slot module; KPI card 716-4250 uses same frame). */
export const CANVAS_WIDGET_SLOT_HEIGHT_PX = 280;
export const CANVAS_WIDGET_SLOT_HEIGHT_L1_PX = 280;

/** PATH-style dashboard banner min height (`--path-banner-height` in `index.css`, 216px). */
export const DASHBOARD_BANNER_SLOT_HEIGHT_PX = 216;

/** Static asset shown when `bannerBackgroundDataUrl` is unset (`public/`). */
export const DASHBOARD_BANNER_DEFAULT_BACKGROUND_PATH = '/banner-default-background.png';

/** Standalone section header strip (full-width `section-header` section). */
export const SECTION_HEADER_SLOT_HEIGHT_PX = 64;

export function canvasWidgetSlotHeightPx(canvasListL1: boolean): number {
  return canvasListL1 ? CANVAS_WIDGET_SLOT_HEIGHT_L1_PX : CANVAS_WIDGET_SLOT_HEIGHT_PX;
}

export function canvasWidgetSlotFrameStyle(canvasListL1: boolean): CSSProperties {
  const h = canvasWidgetSlotHeightPx(canvasListL1);
  return { boxSizing: 'border-box', height: h, minHeight: h };
}
