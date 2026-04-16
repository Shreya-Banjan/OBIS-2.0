import type { SharedByInfo } from '../types';

function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

function stackLetter(displayName: string): string {
  const t = displayName.trim();
  return (t.charAt(0) || '?').toUpperCase();
}

type StackCircleProps = {
  person: SharedByInfo;
  stackIndex: number;
};

function StackCircle({ person, stackIndex }: StackCircleProps) {
  const letter = stackLetter(person.displayName);
  const bg = `hsl(${hueFromString(person.displayName)} 42% 88%)`;
  const z = stackIndex + 1;

  if (person.avatarUrl) {
    return (
      <div className="relative -ml-2 first:ml-0" style={{ zIndex: z }}>
        <img
          src={person.avatarUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-6 shrink-0 rounded-full border border-white object-cover"
        />
      </div>
    );
  }

  return (
    <div className="relative -ml-2 first:ml-0" style={{ zIndex: z }}>
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white font-['Poppins',sans-serif] text-xs font-normal leading-none text-[#333]"
        style={{ backgroundColor: bg }}
        aria-hidden
      >
        {letter}
      </span>
    </div>
  );
}

type SharedWithAvatarStackProps = {
  people: SharedByInfo[];
};

/**
 * Overlapping 24px avatars — [Figma 6098:35039](https://www.figma.com/design/aeQeZHeULUG3dyZQaU1S9y/Neuron-2.0?node-id=6098-35039).
 * Up to **3** people: show all circles. **More than 3**: first **two** + **`+N`** (N = remaining after those two).
 */
export function SharedWithAvatarStack({ people }: SharedWithAvatarStackProps) {
  if (people.length === 0) return null;

  const overflow = people.length > 3;
  const shown = overflow ? people.slice(0, 2) : people;
  const restCount = overflow ? people.length - 2 : 0;

  return (
    <div
      className="flex shrink-0 items-center overflow-visible"
      role="group"
      aria-label={`${people.length} collaborator${people.length === 1 ? '' : 's'}`}
    >
      <div className="flex items-center overflow-visible pr-0.5">
        {shown.map((person, i) => (
          <StackCircle key={`${person.displayName}-${i}`} person={person} stackIndex={i} />
        ))}
        {overflow ? (
          <div className="relative -ml-2 z-10">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white bg-[#f6d4d5] font-['Poppins',sans-serif] text-[10px] font-normal leading-none text-[#333]">
              +{restCount}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
