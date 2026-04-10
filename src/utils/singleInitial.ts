/** First character of the display name (uppercase) — Neuron 2.0 24px avatar tiles use a single letter. */
export function singleInitialFromDisplayName(name: string): string {
  const t = name.trim();
  if (!t) return '?';
  return t[0]!.toUpperCase();
}
