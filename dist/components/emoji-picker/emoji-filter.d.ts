import type { EmojiCategory, NativeEmoji } from './emoji-catalog.js';
/** Which standard emoji a picker offers. */
export interface EmojiFilterOptions {
    /** The standard categories to offer, in order. Defaults to all of them, in data order. */
    categories?: readonly EmojiCategory[] | undefined;
    /** The newest Emoji version to offer; emoji without a version always stay. */
    maxVersion?: number | undefined;
    /** Leaves out country flags, for a platform that draws them as letters. */
    hideCountryFlags?: boolean | undefined;
    /** Keeps the emoji for which it returns `true`. */
    filterEmoji?: ((emoji: NativeEmoji) => boolean) | undefined;
}
/** Whether a glyph is a country flag: a pair of regional indicator letters. */
export declare function isCountryFlag(unicode: string): boolean;
/** The emoji a picker offers, in the order of `categories` when it is given. */
export declare function filterNativeEmoji(emoji: readonly NativeEmoji[], options: EmojiFilterOptions): NativeEmoji[];
//# sourceMappingURL=emoji-filter.d.ts.map