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

const countryFlag = /^[\u{1F1E6}-\u{1F1FF}]{2}$/u;

/** Whether a glyph is a country flag: a pair of regional indicator letters. */
export function isCountryFlag(unicode: string): boolean {
  return countryFlag.test(unicode);
}

function isOffered(emoji: NativeEmoji, options: EmojiFilterOptions): boolean {
  const { maxVersion, hideCountryFlags, filterEmoji } = options;
  if (maxVersion !== undefined && emoji.version !== undefined && emoji.version > maxVersion) {
    return false;
  }
  if (hideCountryFlags && isCountryFlag(emoji.unicode)) return false;
  return filterEmoji ? filterEmoji(emoji) : true;
}

/** The emoji a picker offers, in the order of `categories` when it is given. */
export function filterNativeEmoji(
  emoji: readonly NativeEmoji[],
  options: EmojiFilterOptions,
): NativeEmoji[] {
  const { categories } = options;
  const offered = emoji.filter(
    (item) => (!categories || categories.includes(item.category)) && isOffered(item, options),
  );
  if (!categories) return offered;
  return offered.sort((a, b) => categories.indexOf(a.category) - categories.indexOf(b.category));
}
