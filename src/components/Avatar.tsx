import { singleInitialFromDisplayName } from '../utils/singleInitial';

const FALLBACK_BGS = [
  'bg-[#f5e2ec]',
  'bg-[#c8e3c3]',
  'bg-[#d4ebf6]',
  'bg-[#ebd4f0]',
] as const;

function fallbackBgClassForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return FALLBACK_BGS[Math.abs(h) % FALLBACK_BGS.length]!;
}

const AVATAR_FRAME =
  'box-border flex size-6 shrink-0 items-center justify-center rounded-full border border-solid border-white text-center font-[\'Poppins\',sans-serif] text-[12px] leading-none text-[#333]';

export type AvatarProps = {
  name: string;
  src?: string | null;
  /** Defaults to `name` when `src` is set. */
  alt?: string;
  className?: string;
  /** Overrides automatic pastel when showing initials. */
  fallbackClassName?: string;
};

/** Single 24×24 avatar — image or one initial on a pastel tile ([Figma](https://www.figma.com/design/aeQeZHeULUG3dyZQaU1S9y/Neuron-2.0?node-id=6154-36696)). */
export function Avatar({ name, src, alt, className = '', fallbackClassName }: AvatarProps) {
  const label = alt ?? name;

  if (src) {
    return (
      <img
        src={src}
        alt={label}
        className={`box-border size-6 shrink-0 rounded-full border border-solid border-white object-cover ${className}`.trim()}
      />
    );
  }

  const initial = singleInitialFromDisplayName(name);
  const bg = fallbackClassName ?? fallbackBgClassForName(name);

  return (
    <span className={`${AVATAR_FRAME} ${bg} ${className}`.trim()} aria-label={label}>
      <span aria-hidden className="block">
        {initial}
      </span>
    </span>
  );
}

export type AvatarGroupItem = {
  id: string;
  name: string;
  src?: string | null;
};

export type AvatarGroupProps = {
  avatars: AvatarGroupItem[];
  className?: string;
  'aria-label'?: string;
};

/**
 * Overlapping 24px avatars (−8px overlap). Up to three faces; beyond that, two faces + “+N”
 * ([multiple](https://www.figma.com/design/aeQeZHeULUG3dyZQaU1S9y/Neuron-2.0?node-id=6140-36392),
 * [overflow](https://www.figma.com/design/aeQeZHeULUG3dyZQaU1S9y/Neuron-2.0?node-id=6140-36432)).
 */
export function AvatarGroup({ avatars, className = '', 'aria-label': ariaLabel }: AvatarGroupProps) {
  const n = avatars.length;
  if (n === 0) return null;

  const showOverflow = n > 3;
  const overflowCount = showOverflow ? n - 2 : 0;
  const visible = showOverflow ? avatars.slice(0, 2) : avatars;

  const defaultGroupLabel = `${n} ${n === 1 ? 'person' : 'people'}`;

  return (
    <div
      className={`flex items-center pr-2 ${className}`.trim()}
      role="group"
      aria-label={ariaLabel ?? defaultGroupLabel}
    >
      {visible.map((item, index) => (
        <div
          key={item.id}
          className="-ml-2 first:ml-0"
          style={{ zIndex: index }}
        >
          <Avatar
            name={item.name}
            src={item.src}
            fallbackClassName={FALLBACK_BGS[index % FALLBACK_BGS.length]}
          />
        </div>
      ))}
      {showOverflow ? (
        <div className="-ml-2" style={{ zIndex: visible.length }}>
          <span className={`${AVATAR_FRAME} bg-[#f6d4d5] text-[10px]`} aria-label={`${overflowCount} more`}>
            <span aria-hidden className="block">
              +{overflowCount}
            </span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
