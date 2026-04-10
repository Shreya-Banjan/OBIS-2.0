/** Matches dashboard tile aspect (see DashboardListPage). */
export const COVER_PREVIEW_ASPECT = 5 / 3;

export type NaturalCropRect = { x: number; y: number; w: number; h: number };

export function maxCenteredCrop(natW: number, natH: number): NaturalCropRect {
  const targetR = COVER_PREVIEW_ASPECT;
  let w = natW;
  let h = w / targetR;
  if (h > natH) {
    h = natH;
    w = h * targetR;
  }
  return {
    x: (natW - w) / 2,
    y: (natH - h) / 2,
    w,
    h,
  };
}

export function clampCrop(c: NaturalCropRect, natW: number, natH: number): NaturalCropRect {
  const targetR = COVER_PREVIEW_ASPECT;
  let { x, y, w, h } = c;
  if (Math.abs(w / h - targetR) > 0.001) {
    h = w / targetR;
  }
  w = Math.min(w, natW);
  h = Math.min(h, natH);
  if (w / h > targetR + 0.001) {
    w = h * targetR;
  } else if (w / h < targetR - 0.001) {
    h = w / targetR;
  }
  x = Math.max(0, Math.min(x, natW - w));
  y = Math.max(0, Math.min(y, natH - h));
  if (x + w > natW) x = natW - w;
  if (y + h > natH) y = natH - h;
  return { x, y, w, h };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

export async function renderCropToDataUrl(
  imageSrc: string,
  crop: NaturalCropRect,
  outMaxWidth = 800
): Promise<string> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const outH = Math.round(outMaxWidth / COVER_PREVIEW_ASPECT);
  canvas.width = outMaxWidth;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, outMaxWidth, outH);
  return canvas.toDataURL('image/jpeg', 0.92);
}
