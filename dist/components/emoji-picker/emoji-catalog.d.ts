/** The standard emoji categories, in browsing order. */
export type EmojiCategory = 'smileys' | 'people' | 'nature' | 'food' | 'travel' | 'activities' | 'objects' | 'symbols' | 'flags';
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
export type EmojiSelection = {
    kind: 'native';
    emoji: NativeEmoji;
    unicode: string;
    hexcode: string;
    skinTone: SkinTone;
} | {
    kind: 'custom';
    emoji: CustomEmoji;
};
/** Either kind of emoji, as the picker lists it. */
export type EmojiEntry = {
    kind: 'native';
    emoji: NativeEmoji;
} | {
    kind: 'custom';
    emoji: CustomEmoji;
};
export declare const skinTones: readonly SkinTone[];
/** The code points of a glyph in upper-case hex, joined by `-`, without variation selectors. */
export declare function toHexcode(unicode: string): string;
/** Reads the compact emoji format that `scripts/generate-emoji-data.mjs` writes. */
export declare function parseEmojiData(text: string): NativeEmoji[];
/** A single-code-point glyph followed by the modifier for a skin tone (`default` adds none). */
export declare function withSkinTone(glyph: string, tone: SkinTone): string;
/** The glyph for a skin tone, falling back to the plain glyph when the emoji takes no tone. */
export declare function applySkinTone(emoji: NativeEmoji, tone: SkinTone): string;
/** The selection reported for an entry in a skin tone. */
export declare function toEmojiSelection(entry: EmojiEntry, tone: SkinTone): EmojiSelection;
/** The accessible name of an entry. */
export declare function getEmojiLabel(entry: EmojiEntry): string;
/**
 * The key a list of recently used emoji stores for an entry: the plain glyph of a standard emoji,
 * `:shortcode:` for a custom one.
 */
export declare function getEmojiKey(entry: EmojiEntry): string;
/**
 * The entries for stored keys, skipping keys that match no emoji and keys naming an emoji already
 * listed. Tone modifiers are ignored.
 */
export declare function resolveEmojiKeys(keys: readonly string[], emoji: readonly NativeEmoji[], custom: readonly CustomEmoji[]): EmojiEntry[];
/**
 * `recent` with `key` moved to the front and at most `limit` long, keeping one key per emoji: other
 * tones of the same emoji and repeated keys are dropped.
 */
export declare function addRecentEmoji(recent: readonly string[], key: string, limit: number): string[];
/**
 * The entries matching a query by shortcode, label or keyword, best first and at most `limit`.
 * Surrounding colons in the query are ignored; an empty query matches nothing.
 */
export declare function searchEmoji(entries: readonly EmojiEntry[], query: string, limit: number): EmojiEntry[];
//# sourceMappingURL=emoji-catalog.d.ts.map