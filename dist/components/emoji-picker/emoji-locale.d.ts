import { type NativeEmoji } from './emoji-catalog.js';
import { type EmojiLocale } from './emoji-locales.js';
/**
 * The bundled locale for a BCP 47 language tag: the language with its region (`es-MX`), with its
 * script (`zh-Hant`, also for `zh-TW`), or alone (`fr` for `fr-CA`), and English otherwise.
 */
export declare function resolveEmojiLocale(tag: string): EmojiLocale;
/**
 * The emoji with the names and keywords of a locale's compact text, one `<label>|<keywords>` line
 * per emoji in order. A blank label or keyword list keeps the English one.
 */
export declare function mergeEmojiLocale(emoji: readonly NativeEmoji[], text: string): NativeEmoji[];
/**
 * Loads the bundled standard emoji with their names and keywords in the bundled locale that
 * `resolveEmojiLocale` finds for `locale` (English by default), once per locale, as separate chunks.
 */
export declare function loadEmojiData(locale?: string): Promise<readonly NativeEmoji[]>;
//# sourceMappingURL=emoji-locale.d.ts.map