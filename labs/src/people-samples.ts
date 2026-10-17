import type { PresencePerson } from '../../src/components/presence-strip/presence-strip.js';

function svgPicture(ground: string, figure: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${ground}"/><circle cx="16" cy="13" r="6" fill="${figure}"/><rect x="6" y="21" width="20" height="12" rx="6" fill="${figure}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Inline pictures, so the labs make no network request. */
export const PICTURE = svgPicture('#0e7490', '#ecfeff');
export const OTHER_PICTURE = svgPicture('#9a3412', '#fff7ed');
/** A picture address that fails to decode, to exercise the initials fallback. */
export const BROKEN_PICTURE = 'data:image/png;base64,AAAA';

/** Sample people with caller-chosen statuses. */
export const SAMPLE_PEOPLE: readonly PresencePerson[] = [
  { id: 'maria', name: 'Maria Santos', status: 'active', statusLabel: 'Active' },
  { id: 'jon', name: 'Jon Berg', src: PICTURE, status: 'away', statusLabel: 'Away' },
  { id: 'lena', name: 'Lena Ortiz', status: 'busy', statusLabel: 'Busy' },
  { id: 'sam', name: 'Sam Okafor', status: 'idle', statusLabel: 'Idle' },
  { id: 'priya', name: 'Priya Nair', status: 'active', statusLabel: 'Active' },
  { id: 'tom', name: 'Tom Li', src: OTHER_PICTURE, status: 'idle', statusLabel: 'Idle' },
];
