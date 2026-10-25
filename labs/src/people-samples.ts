import type { AvatarGroupPerson } from '../../src/components/avatar-group/avatar-group.js';

/** Inline pictures, so the labs make no network request. */
export const samplePicture = svgPicture('#0e7490', '#ecfeff');
/** A second inline picture, such as a higher-resolution source. */
export const otherPicture = svgPicture('#9a3412', '#fff7ed');
/** A picture address that fails to decode, to exercise the initials fallback. */
export const brokenPicture = 'data:image/png;base64,AAAA';

/** Sample people with caller-chosen statuses. */
export const samplePeople: readonly AvatarGroupPerson[] = [
  { id: 'maria', name: 'Maria Santos', status: 'active', statusLabel: 'Active' },
  { id: 'jon', name: 'Jon Berg', src: samplePicture, status: 'away', statusLabel: 'Away' },
  { id: 'lena', name: 'Lena Ortiz', status: 'busy', statusLabel: 'Busy' },
  { id: 'sam', name: 'Sam Okafor', status: 'idle', statusLabel: 'Idle' },
  { id: 'priya', name: 'Priya Nair', status: 'active', statusLabel: 'Active' },
  { id: 'tom', name: 'Tom Li', src: otherPicture, status: 'idle', statusLabel: 'Idle' },
];

function svgPicture(ground: string, figure: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${ground}"/><circle cx="16" cy="13" r="6" fill="${figure}"/><rect x="6" y="21" width="20" height="12" rx="6" fill="${figure}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
