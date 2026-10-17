/** The standard emoji categories, in browsing order. */
export type EmojiCategory =
  | 'smileys'
  | 'people'
  | 'nature'
  | 'food'
  | 'travel'
  | 'activities'
  | 'objects'
  | 'symbols'
  | 'flags';

/** A skin tone: `default` draws the emoji without a tone modifier. */
export type SkinTone = 'default' | 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark';

/** One standard emoji. */
export interface NativeEmoji {
  /** The glyph without a skin tone. */
  unicode: string;
  /** The glyph's code points in hex, joined by `-`, without variation selectors. */
  hexcode: string;
  /** Accessible name, such as `grinning face`. */
  label: string;
  /** The category the emoji is browsed under. */
  category: EmojiCategory;
  /** Short names without colons (`thumbsup`). */
  shortcodes: readonly string[];
  /** Further words the search matches. */
  keywords: readonly string[];
  /** The glyph in each skin tone from `light` to `dark`, for an emoji that takes one. */
  skins?: readonly string[] | undefined;
  /** The Emoji version that introduced it (`15.1`). An emoji without one is never left out by version. */
  version?: number | undefined;
}

/** An emoji the caller supplies as an image. */
export interface CustomEmoji {
  /** Unique short name without colons, shown as `:shortcode:`. */
  shortcode: string;
  /** Image URL. */
  src: string;
  /** Accessible name. Defaults to `:shortcode:`. */
  label?: string | undefined;
  /** Further words the search matches. */
  keywords?: readonly string[] | undefined;
}

/** What choosing an emoji reports. */
export type EmojiSelection =
  | { kind: 'native'; emoji: NativeEmoji; unicode: string; hexcode: string; skinTone: SkinTone }
  | { kind: 'custom'; emoji: CustomEmoji };

/** Either kind of emoji, as the picker lists it. */
export type EmojiEntry =
  | { kind: 'native'; emoji: NativeEmoji }
  | { kind: 'custom'; emoji: CustomEmoji };

export const skinTones: readonly SkinTone[] = [
  'default',
  'light',
  'medium-light',
  'medium',
  'medium-dark',
  'dark',
];

const toneModifiers = ['\u{1F3FB}', '\u{1F3FC}', '\u{1F3FD}', '\u{1F3FE}', '\u{1F3FF}'];
const variationSelector = /\uFE0F/g;
const anyToneModifier = /[\u{1F3FB}-\u{1F3FF}]/gu;
const searchWeights = {
  shortcodes: [100, 80, 50],
  label: [70, 60, 40],
  keywords: [30, 25, 10],
} as const;

function toneSkins(unicode: string, rule: string): string[] | undefined {
  if (rule !== '1' && rule !== '2') return undefined;
  const [first = '', ...rest] = Array.from(unicode);
  const tail = (rest[0] === '\uFE0F' ? rest.slice(1) : rest).join('');
  return toneModifiers.map((modifier) =>
    rule === '1' ? `${first}${modifier}${tail}` : `${first}${modifier}${tail}${modifier}`,
  );
}

function parseLine(line: string, category: EmojiCategory): NativeEmoji {
  const [unicode = '', rule = '', label = '', codes = '', keywords = '', version] = line.split('|');
  return {
    unicode,
    hexcode: toHexcode(unicode),
    label,
    category,
    shortcodes: codes ? codes.split(',') : [],
    keywords: keywords ? keywords.split(',') : [],
    skins: toneSkins(unicode, rule),
    version: version ? Number(version) : undefined,
  };
}

function plainGlyph(key: string): string {
  return key.replace(anyToneModifier, '').replace(variationSelector, '');
}

function bestScore(values: readonly string[], query: string, weights: readonly number[]): number {
  const [exact = 0, prefix = 0, contains = 0] = weights;
  let best = 0;
  for (const value of values) {
    const text = value.toLowerCase();
    if (text === query) return exact;
    if (text.startsWith(query)) best = Math.max(best, prefix);
    else if (text.includes(query)) best = Math.max(best, contains);
  }
  return best;
}

function scoreEntry(entry: EmojiEntry, query: string): number {
  const fields =
    entry.kind === 'native'
      ? entry.emoji
      : {
          shortcodes: [entry.emoji.shortcode],
          label: getEmojiLabel(entry),
          keywords: entry.emoji.keywords ?? [],
        };
  return Math.max(
    bestScore(fields.shortcodes, query, searchWeights.shortcodes),
    bestScore([fields.label], query, searchWeights.label),
    bestScore(fields.keywords, query, searchWeights.keywords),
  );
}

/** The code points of a glyph in upper-case hex, joined by `-`, without variation selectors. */
export function toHexcode(unicode: string): string {
  return Array.from(unicode.replace(variationSelector, ''), (point) =>
    (point.codePointAt(0) ?? 0).toString(16).toUpperCase(),
  ).join('-');
}

/** Reads the compact emoji format that `scripts/generate-emoji-data.mjs` writes. */
export function parseEmojiData(text: string): NativeEmoji[] {
  const emoji: NativeEmoji[] = [];
  let category: EmojiCategory = 'smileys';
  for (const line of text.split('\n')) {
    if (line.includes('|')) emoji.push(parseLine(line, category));
    else if (line) category = line as EmojiCategory;
  }
  return emoji;
}

/** A single-code-point glyph followed by the modifier for a skin tone (`default` adds none). */
export function withSkinTone(glyph: string, tone: SkinTone): string {
  return `${glyph}${toneModifiers[skinTones.indexOf(tone) - 1] ?? ''}`;
}

/** The glyph for a skin tone, falling back to the plain glyph when the emoji takes no tone. */
export function applySkinTone(emoji: NativeEmoji, tone: SkinTone): string {
  const index = skinTones.indexOf(tone) - 1;
  return emoji.skins?.[index] ?? emoji.unicode;
}

/** The selection reported for an entry in a skin tone. */
export function toEmojiSelection(entry: EmojiEntry, tone: SkinTone): EmojiSelection {
  if (entry.kind === 'custom') return entry;
  const unicode = applySkinTone(entry.emoji, tone);
  const skinTone = unicode === entry.emoji.unicode ? 'default' : tone;
  return { kind: 'native', emoji: entry.emoji, unicode, hexcode: toHexcode(unicode), skinTone };
}

/** The accessible name of an entry. */
export function getEmojiLabel(entry: EmojiEntry): string {
  return entry.kind === 'native'
    ? entry.emoji.label
    : entry.emoji.label?.trim() || `:${entry.emoji.shortcode}:`;
}

/**
 * The key a list of recently used emoji stores for an entry: the plain glyph of a standard emoji,
 * `:shortcode:` for a custom one.
 */
export function getEmojiKey(entry: EmojiEntry): string {
  return entry.kind === 'native' ? entry.emoji.unicode : `:${entry.emoji.shortcode}:`;
}

/** The entries for stored keys, skipping keys that match no emoji. Tone modifiers are ignored. */
export function resolveEmojiKeys(
  keys: readonly string[],
  emoji: readonly NativeEmoji[],
  custom: readonly CustomEmoji[],
): EmojiEntry[] {
  const byKey = new Map<string, EmojiEntry>();
  for (const item of emoji) byKey.set(plainGlyph(item.unicode), { kind: 'native', emoji: item });
  for (const item of custom) byKey.set(`:${item.shortcode}:`, { kind: 'custom', emoji: item });
  return keys.flatMap((key) => {
    const entry = byKey.get(key.startsWith(':') ? key : plainGlyph(key));
    return entry ? [entry] : [];
  });
}

/** `recent` with `key` moved to the front, without duplicates and at most `limit` long. */
export function addRecentEmoji(recent: readonly string[], key: string, limit: number): string[] {
  return [key, ...recent.filter((item) => item !== key)].slice(0, limit);
}

/**
 * The entries matching a query by shortcode, label or keyword, best first and at most `limit`.
 * Surrounding colons in the query are ignored; an empty query matches nothing.
 */
export function searchEmoji(
  entries: readonly EmojiEntry[],
  query: string,
  limit: number,
): EmojiEntry[] {
  const normalized = query
    .trim()
    .toLowerCase()
    .replace(/^:+|:+$/g, '');
  if (!normalized) return [];
  return entries
    .map((entry) => ({ entry, score: scoreEntry(entry, normalized) }))
    .filter((match) => match.score > 0)
    .sort(
      (a, b) => b.score - a.score || getEmojiLabel(a.entry).localeCompare(getEmojiLabel(b.entry)),
    )
    .slice(0, limit)
    .map((match) => match.entry);
}
