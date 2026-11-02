import type { ReactionEntry } from '../../src/components/reaction-bar/reaction-bar.js';
import type { CustomEmoji } from '../../src/components/emoji-picker/index.js';

function badge(text: string, ground: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="${ground}"/><text x="16" y="21" font-size="13" font-family="sans-serif" text-anchor="middle" fill="#fff">${text}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Inline images, so the lab makes no network request. */
export const customEmoji: CustomEmoji[] = [
  { shortcode: 'ship_it', src: badge('GO', '#15803d'), label: 'Ship it', keywords: ['launch'] },
  { shortcode: 'plus_one', src: badge('+1', '#1d4ed8'), keywords: ['agree'] },
];

export const sets: Record<'empty' | 'one' | 'several', readonly ReactionEntry[]> = {
  empty: [],
  one: [{ emoji: '👍', people: ['Maria Santos'], isReacted: true }],
  several: [
    { emoji: '👍', people: ['You', 'Maria Santos', 'Jon Berg'], isReacted: true },
    { emoji: '🎉', count: 12, people: ['Lena Ortiz', 'Sam Okafor', 'Priya Nair'] },
    { emoji: ':ship_it:', count: 2, people: ['Tom Li', 'Jon Berg'] },
    { emoji: '👀', count: 1 },
  ],
};

const me = 'You';

/** Toggles the reader's reaction in place, as a host keeping the counts would. */
export function toggleReaction(
  reactions: readonly ReactionEntry[],
  emoji: string,
  isReacted: boolean,
): ReactionEntry[] {
  const found = reactions.some((reaction) => reaction.emoji === emoji);
  const next = found ? [...reactions] : [...reactions, { emoji, people: [] }];
  return next.map((reaction) => {
    if (reaction.emoji !== emoji) return reaction;
    const others = (reaction.people ?? []).filter((name) => name !== me);
    return { ...reaction, isReacted, people: isReacted ? [me, ...others] : others };
  });
}
