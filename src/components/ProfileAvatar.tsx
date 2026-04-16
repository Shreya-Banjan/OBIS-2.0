import type { SharedByInfo } from '../types';

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

type ProfileAvatarProps = {
  sharedBy: SharedByInfo;
  size?: 'sm' | 'md';
};

const sizeClasses = {
  sm: 'size-6 text-[10px]',
  md: 'size-8 text-xs',
} as const;

export function ProfileAvatar({ sharedBy, size = 'md' }: ProfileAvatarProps) {
  const { displayName, avatarUrl } = sharedBy;
  const initials = initialsFromName(displayName);
  const bg = `hsl(${hueFromString(displayName)} 42% 88%)`;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className={`${sizeClasses[size]} shrink-0 rounded-full object-cover ring-1 ring-black/5`}
      />
    );
  }

  return (
    <span
      className={`inline-flex ${sizeClasses[size]} shrink-0 items-center justify-center rounded-full font-['Inter',sans-serif] font-semibold text-[#1e1e1f]/85 ring-1 ring-black/5`}
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
