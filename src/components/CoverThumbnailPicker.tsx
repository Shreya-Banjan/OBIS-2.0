import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  COVER_PREVIEW_ASPECT,
  clampCrop,
  maxCenteredCrop,
  renderCropToDataUrl,
  type NaturalCropRect,
} from '../utils/coverThumbnail';

const PRESETS = [
  { id: 'azure', src: '/covers/preset-azure.svg', label: 'Azure' },
  { id: 'rose', src: '/covers/preset-rose.svg', label: 'Rose' },
  { id: 'forest', src: '/covers/preset-forest.svg', label: 'Forest' },
  { id: 'slate', src: '/covers/preset-slate.svg', label: 'Slate' },
] as const;

export type CoverThumbnailPickerHandle = {
  /** Returns JPEG data URL of the preview crop, or null if no image. */
  getCroppedDataUrl: () => Promise<string | null>;
};

type CoverThumbnailPickerProps = {
  className?: string;
};

export const CoverThumbnailPicker = forwardRef<CoverThumbnailPickerHandle, CoverThumbnailPickerProps>(
  function CoverThumbnailPicker({ className }, ref) {
    const fileInputId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
    const [crop, setCrop] = useState<NaturalCropRect | null>(null);
    const [layout, setLayout] = useState<{
      scale: number;
      offX: number;
      offY: number;
      dispW: number;
      dispH: number;
    } | null>(null);

    const recomputeLayout = useCallback(() => {
      const el = containerRef.current;
      const img = imgRef.current;
      const nat = natural;
      if (!el || !img || !nat) return;
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      const ir = nat.w / nat.h;
      const cr = cw / ch;
      let dispW: number;
      let dispH: number;
      let offX: number;
      let offY: number;
      if (ir > cr) {
        dispW = cw;
        dispH = cw / ir;
        offX = 0;
        offY = (ch - dispH) / 2;
      } else {
        dispH = ch;
        dispW = ch * ir;
        offX = (cw - dispW) / 2;
        offY = 0;
      }
      const scale = dispW / nat.w;
      setLayout({ scale, offX, offY, dispW, dispH });
    }, [natural]);

    useLayoutEffect(() => {
      recomputeLayout();
    }, [recomputeLayout, imageSrc, natural]);

    useEffect(() => {
      const onResize = () => recomputeLayout();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, [recomputeLayout]);

    const onImgLoad = useCallback(() => {
      const img = imgRef.current;
      if (!img) return;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) return;
      setNatural({ w, h });
      setCrop(maxCenteredCrop(w, h));
    }, []);

    const setSrcAndReset = useCallback((src: string) => {
      setImageSrc(src);
      setNatural(null);
      setCrop(null);
      setLayout(null);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        getCroppedDataUrl: async () => {
          if (!imageSrc || !crop || !natural) return null;
          try {
            return await renderCropToDataUrl(imageSrc, crop);
          } catch {
            return null;
          }
        },
      }),
      [imageSrc, crop, natural]
    );

    const natToScreen = useCallback(
      (c: NaturalCropRect) => {
        if (!layout) return null;
        return {
          left: layout.offX + c.x * layout.scale,
          top: layout.offY + c.y * layout.scale,
          width: c.w * layout.scale,
          height: c.h * layout.scale,
        };
      },
      [layout]
    );

    const startMove = useCallback(
      (e: React.PointerEvent) => {
        if (!crop || !natural || !layout) return;
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const startCrop = { ...crop };
        const scale = layout.scale;
        const natW = natural.w;
        const natH = natural.h;

        const handleMove = (ev: PointerEvent) => {
          const ndx = (ev.clientX - startX) / scale;
          const ndy = (ev.clientY - startY) / scale;
          setCrop(
            clampCrop(
              {
                x: startCrop.x + ndx,
                y: startCrop.y + ndy,
                w: startCrop.w,
                h: startCrop.h,
              },
              natW,
              natH
            )
          );
        };

        const handleUp = () => {
          window.removeEventListener('pointermove', handleMove);
          window.removeEventListener('pointerup', handleUp);
          window.removeEventListener('pointercancel', handleUp);
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
        window.addEventListener('pointercancel', handleUp);
      },
      [crop, natural, layout]
    );

    const startResize = useCallback(
      (e: React.PointerEvent) => {
        if (!crop || !natural || !layout) return;
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startCrop = { ...crop };
        const scale = layout.scale;
        const natW = natural.w;
        const natH = natural.h;
        const targetR = COVER_PREVIEW_ASPECT;

        const handleMove = (ev: PointerEvent) => {
          const ndx = (ev.clientX - startX) / scale;
          let w = startCrop.w + ndx;
          let h = w / targetR;
          if (w < 24 || h < 24) return;
          const maxW = natW - startCrop.x;
          const maxH = natH - startCrop.y;
          w = Math.min(w, maxW);
          h = Math.min(h, maxH);
          if (h * targetR < w) w = h * targetR;
          else h = w / targetR;
          setCrop(clampCrop({ x: startCrop.x, y: startCrop.y, w, h }, natW, natH));
        };

        const handleUp = () => {
          window.removeEventListener('pointermove', handleMove);
          window.removeEventListener('pointerup', handleUp);
          window.removeEventListener('pointercancel', handleUp);
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
        window.addEventListener('pointercancel', handleUp);
      },
      [crop, natural, layout]
    );

    const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f || !f.type.startsWith('image/')) return;
      const r = new FileReader();
      r.onload = () => {
        const url = typeof r.result === 'string' ? r.result : null;
        if (url) setSrcAndReset(url);
      };
      r.readAsDataURL(f);
      e.target.value = '';
    }, [setSrcAndReset]);

    const screenBox = crop && natural && layout ? natToScreen(crop) : null;

    return (
      <div className={className}>
        <p className="mb-1.5 font-['Inter',sans-serif] text-xs font-medium text-[#1e1e1f]">Cover thumbnail</p>
        <p className="mb-3 font-['Inter',sans-serif] text-xs text-[#707070]">
          Choose a preset or upload an image, then drag or resize the frame to set the preview area.
        </p>

        <div className="mb-3 flex flex-wrap gap-2" role="listbox" aria-label="Preset cover images">
          {PRESETS.map((p) => {
            const selected = imageSrc === p.src;
            return (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => setSrcAndReset(p.src)}
                className={[
                  'relative h-14 w-[4.67rem] shrink-0 overflow-hidden rounded-lg border-2 bg-[#f5f5f5] transition-colors',
                  selected ? 'border-[#2563eb] ring-2 ring-[#2563eb]/25' : 'border-transparent hover:border-[#e4e4e4]',
                ].join(' ')}
                title={p.label}
              >
                <img
                  src={p.src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
          <label
            htmlFor={fileInputId}
            className="flex h-14 min-w-[4.67rem] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[#d4d4d4] bg-[#fafafa] px-2 font-['Inter',sans-serif] text-xs font-medium text-[#606060] transition-colors hover:border-[#a3a3a3] hover:bg-[#f5f5f5]"
          >
            Upload
          </label>
          <input id={fileInputId} type="file" accept="image/*" className="sr-only" onChange={onFileChange} />
        </div>

        {imageSrc ? (
          <div
            ref={containerRef}
            className="relative h-48 w-full overflow-hidden rounded-xl bg-[#0a0a0a] sm:h-52"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt=""
              loading="eager"
              decoding="async"
              className="pointer-events-none h-full w-full object-contain"
              onLoad={onImgLoad}
              draggable={false}
            />
            {screenBox ? (
              <>
                <div
                  role="presentation"
                  className="absolute z-[1] cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45),0_0_0_1px_rgba(0,0,0,0.35)]"
                  style={{
                    left: screenBox.left,
                    top: screenBox.top,
                    width: screenBox.width,
                    height: screenBox.height,
                  }}
                  onPointerDown={startMove}
                />
                <button
                  type="button"
                  aria-label="Resize preview area"
                  className="absolute z-[2] size-4 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize rounded-sm border-2 border-white bg-white shadow-md"
                  style={{
                    left: screenBox.left + screenBox.width,
                    top: screenBox.top + screenBox.height,
                  }}
                  onPointerDown={startResize}
                />
              </>
            ) : null}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-[#e4e4e4] bg-[#fafafa] px-4 text-center font-['Inter',sans-serif] text-xs text-[#707070]">
            Select a preset or upload an image to set a cover thumbnail.
          </div>
        )}
      </div>
    );
  }
);
