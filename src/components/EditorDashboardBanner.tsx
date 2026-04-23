import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import {
  DASHBOARD_BANNER_DEFAULT_BACKGROUND_PATH,
  DASHBOARD_BANNER_SLOT_HEIGHT_PX,
  SECTION_HEADER_SLOT_HEIGHT_PX,
} from '../canvasWidgetSlot';
import type { DashboardSection } from '../types';
import { IconImageUpload } from './Icons';

/** Stored on the section as a data URL; keep bounded for localStorage + in-memory dashboards. */
const MAX_IMAGE_DATA_URL_CHARS = 2_400_000;

const IMAGE_EXT = /\.(apng|png|jpe?g|gif|webp|bmp|heic|heif|avif|svg)$/i;

function fileLooksLikeImage(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  if (file.type) return false;
  return IMAGE_EXT.test(file.name);
}

function readWholeFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r !== 'string') reject(new Error('invalid result'));
      else resolve(r);
    };
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

/** Downscale + JPEG encode so phone photos fit under `MAX_IMAGE_DATA_URL_CHARS`. */
async function compressImageFileToDataUrl(file: File, maxDimPx: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    let w = bitmap.width;
    let h = bitmap.height;
    const scale = Math.min(1, maxDimPx / Math.max(w, h, 1));
    w = Math.round(w * scale);
    h = Math.round(h * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.drawImage(bitmap, 0, 0, w, h);
    let q = 0.88;
    let data = canvas.toDataURL('image/jpeg', q);
    while (data.length > MAX_IMAGE_DATA_URL_CHARS && q > 0.42) {
      q -= 0.07;
      data = canvas.toDataURL('image/jpeg', q);
    }
    if (data.length > MAX_IMAGE_DATA_URL_CHARS) throw new Error('still too large');
    return data;
  } finally {
    bitmap.close();
  }
}

/** Sample the left ~52% of the image (headline column) to pick dark vs light text. */
function estimateHeadlineAreaIsLight(imageDataUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const sampleW = 72;
        const sampleH = 72;
        const canvas = document.createElement('canvas');
        canvas.width = sampleW;
        canvas.height = sampleH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(false);
          return;
        }
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, sampleW, sampleH);
        const stripW = Math.max(1, Math.floor(sampleW * 0.52));
        const { data } = ctx.getImageData(0, 0, stripW, sampleH);
        let sum = 0;
        let count = 0;
        let minL = 1;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]!;
          const g = data[i + 1]!;
          const b = data[i + 2]!;
          const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          minL = Math.min(minL, l);
          sum += l;
          count++;
        }
        const avg = count ? sum / count : 0;
        /** Dark ink (#333) only when the strip reads clearly light overall *and* nowhere very dark (avoids dark-on-dark when the average is lifted by a bright corner). */
        const useDarkText = avg > 0.46 && minL > 0.26;
        resolve(useDarkText);
      } catch {
        resolve(false);
      }
    };
    img.onerror = () => resolve(false);
    img.src = imageDataUrl;
  });
}

export type BannerSectionUpdates = Partial<
  Pick<DashboardSection, 'bannerText' | 'bannerBackgroundDataUrl'>
>;

type EditorDashboardBannerProps = {
  section: DashboardSection;
  onChange: (updates: BannerSectionUpdates) => void;
  /** Full hero (`banner-top`) vs compact title row (`section-header`). */
  variant?: 'hero' | 'section-strip';
};

/** Matches `SecondaryButton` (Add widget, etc.) — used for banner upload / remove CTAs. */
const BANNER_EDITOR_SECONDARY_CTA_CLASS = [
  'inline-flex h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-[12px] box-border border-0 bg-white px-3 text-center font-[family-name:var(--font-inter)] text-sm font-medium text-[var(--color-grey-darkest)] outline-none',
  'transition-[box-shadow,filter,scale,background-color] duration-200 ease-out',
  'hover:shadow-[var(--shadow-focus-cta)] hover:brightness-[1.06]',
  'focus-visible:shadow-[var(--shadow-focus-cta)] focus-visible:brightness-[1.06]',
  'active:scale-[0.97] active:bg-[var(--color-brand-press-surface)] active:shadow-[var(--shadow-focus-brand)] active:brightness-100',
  'motion-reduce:transition-[box-shadow,filter,background-color] motion-reduce:active:scale-100',
].join(' ');

/**
 * Dashboard banner editor — layout aligned to MD Anderson_PATH hero patterns
 * (split narrative + photography, navy panel, headline typography). Figma:
 * https://www.figma.com/design/0ItO9owFGDEv0Gkd7DKxrE/MD-Anderson_PATH?node-id=4851-1116
 */
export function EditorDashboardBanner({
  section,
  onChange,
  variant = 'hero',
}: EditorDashboardBannerProps) {
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const headlineRef = useRef<HTMLTextAreaElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [headlineOnLightBg, setHeadlineOnLightBg] = useState(false);
  const text = section.bannerText ?? '';
  const bg = section.bannerBackgroundDataUrl ?? null;
  const displayBackgroundUrl = bg ?? DASHBOARD_BANNER_DEFAULT_BACKGROUND_PATH;
  const headlineLight = headlineOnLightBg;
  const isStrip = variant === 'section-strip';

  useEffect(() => {
    if (isStrip && !bg) {
      setHeadlineOnLightBg(false);
      return;
    }
    let cancelled = false;
    void estimateHeadlineAreaIsLight(displayBackgroundUrl).then((light) => {
      if (!cancelled) setHeadlineOnLightBg(light);
    });
    return () => {
      cancelled = true;
    };
  }, [displayBackgroundUrl, isStrip, bg]);

  useLayoutEffect(() => {
    const el = headlineRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  const onPickFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      if (!fileLooksLikeImage(file)) {
        setUploadError('Choose an image file.');
        return;
      }
      setUploadError(null);
      void (async () => {
        try {
          const data = await compressImageFileToDataUrl(file, 2400);
          onChange({ bannerBackgroundDataUrl: data });
        } catch {
          try {
            const raw = await readWholeFileAsDataUrl(file);
            if (raw.length > MAX_IMAGE_DATA_URL_CHARS) {
              setUploadError('Image is too large to store in this report.');
              return;
            }
            onChange({ bannerBackgroundDataUrl: raw });
          } catch {
            setUploadError('Could not read this image.');
          }
        }
      })();
    },
    [onChange]
  );

  const openFilePicker = useCallback(() => {
    setUploadError(null);
    fileRef.current?.click();
  }, []);

  if (isStrip) {
    const headlineLight = bg ? headlineOnLightBg : true;
    return (
      <div
        className="relative flex w-full min-w-0 flex-row items-stretch overflow-hidden rounded-[var(--radius-canvas)] shadow-[var(--shadow-subtle)]"
        style={{ minHeight: SECTION_HEADER_SLOT_HEIGHT_PX, maxHeight: SECTION_HEADER_SLOT_HEIGHT_PX }}
      >
        <label htmlFor={`${fileInputId}-strip-bg`} className="sr-only">
          Upload section header background image
        </label>
        <input
          ref={fileRef}
          id={`${fileInputId}-strip-bg`}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onPickFile}
        />
        <div
          className={
            bg
              ? 'pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat'
              : 'pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-[#fafbfc] via-[#f0f1f3] to-[#e3e4e7]'
          }
          style={bg ? { backgroundImage: `url(${bg})` } : undefined}
          aria-hidden
        />
        {bg ? (
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-black/40 via-black/14 to-transparent sm:from-black/32 sm:via-black/10"
            aria-hidden
          />
        ) : null}

        <div className="relative z-[2] flex min-h-0 min-w-0 flex-1 flex-row items-center gap-3 px-4 py-0">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center">
            <label className="sr-only" htmlFor={`${fileInputId}-section-headline`}>
              Section title
            </label>
            <textarea
              ref={headlineRef}
              id={`${fileInputId}-section-headline`}
              value={text}
              onChange={(e) => onChange({ bannerText: e.target.value })}
              rows={1}
              className={[
                'min-h-0 max-h-full w-full shrink-0 cursor-text resize-none overflow-y-auto border-0 bg-transparent px-2 py-1 text-left font-[family-name:var(--font-inter)] text-[20px] font-semibold leading-snug outline-none ring-0 transition-colors duration-200 ease-out focus-visible:outline-none rounded-lg',
                headlineLight
                  ? 'text-[var(--color-grey-darkest)] placeholder:text-[var(--color-grey-darkest)]/45 hover:bg-black/[0.04] focus-visible:bg-black/[0.05]'
                  : 'text-white placeholder:text-white/35 [text-shadow:0_1px_2px_rgb(0_0_0/0.45)] hover:bg-white/12 focus-visible:bg-white/15',
              ].join(' ')}
              placeholder="Enter headline…"
            />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 py-1">
            {bg ? (
              <button
                type="button"
                onClick={() => {
                  setUploadError(null);
                  onChange({ bannerBackgroundDataUrl: null });
                }}
                className={BANNER_EDITOR_SECONDARY_CTA_CLASS}
              >
                Remove Image
              </button>
            ) : (
              <button type="button" onClick={openFilePicker} className={BANNER_EDITOR_SECONDARY_CTA_CLASS}>
                <IconImageUpload className="size-[18px] shrink-0" />
                Upload Background
              </button>
            )}
            {uploadError ? (
              <p
                role="alert"
                className={`max-w-[11rem] text-right font-[family-name:var(--font-inter)] text-[11px] leading-snug ${
                  headlineLight
                    ? 'text-[#b42318]'
                    : 'text-[#ffb4a8] [text-shadow:0_1px_3px_rgb(0_0_0/0.65)]'
                }`}
              >
                {uploadError}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex w-full min-w-0 flex-col overflow-hidden rounded-[var(--radius-canvas)] shadow-[var(--shadow-subtle)] sm:flex-row ${bg ? 'bg-[var(--path-banner-navy-deep)]' : 'bg-white'}`}
      style={{ minHeight: DASHBOARD_BANNER_SLOT_HEIGHT_PX }}
    >
      <label htmlFor={fileInputId} className="sr-only">
        Upload banner background image
      </label>
      <input
        ref={fileRef}
        id={fileInputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onPickFile}
      />
      <div
        className={`pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat ${bg ? '' : 'opacity-70'}`}
        style={{ backgroundImage: `url(${displayBackgroundUrl})` }}
        aria-hidden
      />
      {bg ? (
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/58 via-black/22 to-transparent sm:from-black/48 sm:via-black/14 sm:to-transparent"
          aria-hidden
        />
      ) : null}

      {/* Left: headline over banner (default or custom image full-bleed behind) */}
      <div className="relative z-[2] flex min-h-0 w-full min-w-0 flex-1 flex-shrink-0 flex-col justify-end items-stretch self-stretch px-[24px] pb-[24px] pt-[24px] sm:w-[min(52%,26rem)] sm:flex-none">
        <label className="sr-only" htmlFor={`${fileInputId}-headline`}>
          Banner headline
        </label>
        <textarea
          ref={headlineRef}
          id={`${fileInputId}-headline`}
          value={text}
          onChange={(e) => onChange({ bannerText: e.target.value })}
          rows={1}
          className={[
            'min-h-0 w-full shrink-0 cursor-text resize-none overflow-hidden border-0 bg-transparent px-2 py-1 text-left font-[family-name:var(--font-poppins)] text-[clamp(1.375rem,2.6vw,1.875rem)] font-semibold leading-[1.2] tracking-[-0.02em] outline-none ring-0 transition-colors duration-200 ease-out focus-visible:outline-none rounded-lg',
            headlineLight
              ? 'text-[#333333] placeholder:text-[#333333]/45 hover:bg-[#f5f5f5] focus-visible:bg-[#f5f5f5]'
              : 'text-white placeholder:text-white/35 [text-shadow:0_1px_2px_rgb(0_0_0/0.45)] hover:bg-white/12 focus-visible:bg-white/15',
          ].join(' ')}
          placeholder="Enter headline…"
        />
      </div>

      {/* Replace default / remove custom — bare CTAs top-right; upload errors stack below */}
      <div className="pointer-events-auto absolute right-[24px] top-[24px] z-[30] flex max-w-[calc(100%-3rem)] flex-col items-end gap-1 sm:max-w-[min(48%,20rem)]">
        {bg ? (
          <button
            type="button"
            onClick={() => {
              setUploadError(null);
              onChange({ bannerBackgroundDataUrl: null });
            }}
            className={BANNER_EDITOR_SECONDARY_CTA_CLASS}
          >
            Remove Image
          </button>
        ) : (
          <button
            type="button"
            onClick={openFilePicker}
            className={BANNER_EDITOR_SECONDARY_CTA_CLASS}
          >
            <IconImageUpload className="size-[18px] shrink-0" />
            Upload Background
          </button>
        )}
        {uploadError ? (
          <p
            role="alert"
            className="max-w-[14rem] text-right font-[family-name:var(--font-inter)] text-[11px] leading-snug text-[#ffb4a8] [text-shadow:0_1px_3px_rgb(0_0_0/0.65)]"
          >
            {uploadError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
