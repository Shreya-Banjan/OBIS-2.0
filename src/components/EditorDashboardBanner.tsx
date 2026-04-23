import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { DASHBOARD_BANNER_SLOT_HEIGHT_PX } from '../canvasWidgetSlot';
import type { DashboardSection } from '../types';
import { SecondaryButton } from './SecondaryButton';

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

export type BannerSectionUpdates = Partial<
  Pick<DashboardSection, 'bannerText' | 'bannerBackgroundDataUrl'>
>;

type EditorDashboardBannerProps = {
  section: DashboardSection;
  onChange: (updates: BannerSectionUpdates) => void;
};

/**
 * Dashboard banner editor — layout aligned to MD Anderson_PATH hero patterns
 * (split narrative + photography, navy panel, headline typography). Figma:
 * https://www.figma.com/design/0ItO9owFGDEv0Gkd7DKxrE/MD-Anderson_PATH?node-id=4851-1116
 */
export function EditorDashboardBanner({ section, onChange }: EditorDashboardBannerProps) {
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const headlineRef = useRef<HTMLTextAreaElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const text = section.bannerText ?? '';
  const bg = section.bannerBackgroundDataUrl ?? null;

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

  return (
    <div
      className="relative flex w-full min-w-0 flex-col overflow-hidden rounded-[var(--radius-canvas)] border border-[rgb(11_42_69/0.35)] bg-[var(--path-banner-navy-deep)] shadow-[var(--shadow-subtle)] sm:flex-row"
      style={{ minHeight: DASHBOARD_BANNER_SLOT_HEIGHT_PX }}
    >
      {bg ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${bg})` }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/58 via-black/22 to-transparent sm:from-black/48 sm:via-black/14 sm:to-transparent"
            aria-hidden
          />
        </>
      ) : null}

      {/* Left: headline + draft controls (PATH narrative column) */}
      <div
        className="relative z-[2] flex min-h-0 w-full min-w-0 flex-1 flex-shrink-0 flex-col items-stretch self-stretch border-b border-white/[0.08] px-[24px] pb-[24px] pt-[24px] sm:w-[min(52%,26rem)] sm:flex-none sm:border-b-0 sm:border-r sm:border-white/[0.08]"
        style={{ background: bg ? 'rgb(0 0 0 / 0.48)' : 'var(--path-banner-panel)' }}
      >
        <div className="min-h-0 flex-1 shrink" aria-hidden />
        <label className="sr-only" htmlFor={`${fileInputId}-headline`}>
          Banner headline
        </label>
        <textarea
          ref={headlineRef}
          id={`${fileInputId}-headline`}
          value={text}
          onChange={(e) => onChange({ bannerText: e.target.value })}
          rows={1}
          className="min-h-0 w-full shrink-0 resize-none overflow-hidden border-0 bg-transparent px-0 py-0 text-left font-[family-name:var(--font-poppins)] text-[clamp(1.375rem,2.6vw,1.875rem)] font-semibold leading-[1.2] tracking-[-0.02em] text-white outline-none ring-0 placeholder:text-white/35 focus-visible:outline-none"
          placeholder="Enter headline…"
        />
      </div>

      {/* Right: placeholder only when no image (photo is full-bleed on the root above) */}
      <div className="relative z-[2] min-h-[120px] min-w-0 flex-1 bg-transparent sm:min-h-0">
        {bg ? null : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[var(--path-banner-visual-from)] to-[var(--path-banner-visual-to)] px-4 text-center">
            <span
              className="font-[family-name:var(--font-inter)] text-[11px] font-medium uppercase tracking-[0.16em] text-white/50"
              aria-hidden
            >
              Background
            </span>
            <span className="max-w-[14rem] font-[family-name:var(--font-inter)] text-sm leading-snug text-white/70">
              Use <span className="font-medium text-white/85">Upload background</span> at the lower right to add an
              image.
            </span>
          </div>
        )}
      </div>

      {/* Image actions: bottom-right of banner (24px inset) */}
      <div className="pointer-events-auto absolute bottom-[24px] right-[24px] z-[30] flex max-w-[calc(100%-3rem)] flex-wrap items-center justify-end gap-2 rounded-lg border border-white/20 bg-black/45 px-2 py-2 shadow-[var(--shadow-elevated)] backdrop-blur-sm sm:max-w-[min(48%,20rem)]">
        <input
          ref={fileRef}
          id={fileInputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onPickFile}
        />
        <SecondaryButton type="button" size="small" onClick={openFilePicker}>
          Upload background
        </SecondaryButton>
        {bg ? (
          <button
            type="button"
            onClick={() => {
              setUploadError(null);
              onChange({ bannerBackgroundDataUrl: null });
            }}
            className="rounded-lg border border-white/40 bg-white/10 px-3 py-1.5 font-[family-name:var(--font-inter)] text-xs font-medium text-white transition-colors hover:bg-white/20"
          >
            Remove image
          </button>
        ) : null}
        {uploadError ? (
          <p
            role="alert"
            className="w-full basis-full text-right font-[family-name:var(--font-inter)] text-[11px] leading-snug text-[#ffb4a8]"
          >
            {uploadError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
