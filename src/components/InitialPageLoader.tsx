import { useEffect, useRef, useState } from 'react';

type InitialPageLoaderProps = {
  /** Called once after fade-out completes (remove loader from tree). */
  onDone: () => void;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Full-viewport splash: brand bars + title, then opacity fade (typical dashboard boot loader).
 */
export function InitialPageLoader({ onDone }: InitialPageLoaderProps) {
  const [exiting, setExiting] = useState(false);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  };

  useEffect(() => {
    let cancelled = false;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const minMs = reduceMotion ? 0 : 650;

    const fontsReady =
      typeof document !== 'undefined' && 'fonts' in document && document.fonts?.ready
        ? document.fonts.ready.catch(() => undefined)
        : Promise.resolve();

    void Promise.all([delay(minMs), fontsReady]).then(() => {
      if (!cancelled) setExiting(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ms = reduceMotion ? 40 : 520;
    const t = window.setTimeout(() => finish(), ms);
    return () => window.clearTimeout(t);
  }, [exiting]);

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== 'opacity' || !exiting) return;
    finish();
  };

  return (
    <div
      role="progressbar"
      aria-label="Loading application"
      aria-busy={!exiting}
      className={`initial-page-loader fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[#ebebeb] font-[family-name:var(--font-inter)] transition-opacity duration-500 ease-out motion-reduce:transition-none ${
        exiting ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="flex h-12 items-end justify-center gap-1.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="initial-loader-bar w-1.5 rounded-full bg-[var(--color-brand-primary)] motion-reduce:animate-none"
            style={{ animationDelay: `${i * 0.09}s` }}
          />
        ))}
      </div>
      <p className="font-[family-name:var(--font-poppins)] text-lg font-semibold tracking-tight text-[#1e1e1f]">
        OBIS 2.0
      </p>
    </div>
  );
}
