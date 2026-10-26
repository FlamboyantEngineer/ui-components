import { parseEmojiData } from './emoji-catalog.js';
import { importEmojiLocale, isEmojiLocale } from './emoji-locales.js';
const loaded = new Map();
function loadEnglish() {
    return import('./emoji-data.js').then((module) => parseEmojiData(module.compactEmojiData));
}
function loadLocale(locale) {
    if (locale === 'en')
        return loadEnglish();
    return Promise.all([loadEmojiData('en'), importEmojiLocale(locale)]).then(([emoji, text]) => mergeEmojiLocale(emoji, text));
}
/**
 * The bundled locale for a BCP 47 language tag: the language with its region (`es-MX`), with its
 * script (`zh-Hant`, also for `zh-TW`), or alone (`fr` for `fr-CA`), and English otherwise.
 */
export function resolveEmojiLocale(tag) {
    let locale;
    try {
        locale = new Intl.Locale(tag).maximize();
    }
    catch {
        return 'en';
    }
    const { language, script, region } = locale;
    const candidates = [`${language}-${region}`, `${language}-${script}`, language];
    return candidates.map((candidate) => candidate.toLowerCase()).find(isEmojiLocale) ?? 'en';
}
/**
 * The emoji with the names and keywords of a locale's compact text, one `<label>|<keywords>` line
 * per emoji in order. A blank label or keyword list keeps the English one.
 */
export function mergeEmojiLocale(emoji, text) {
    const lines = text.split('\n');
    return emoji.map((item, index) => {
        const [label = '', keywords = ''] = (lines[index] ?? '').split('|');
        return {
            ...item,
            label: label || item.label,
            keywords: keywords ? keywords.split(',') : item.keywords,
        };
    });
}
/**
 * Loads the bundled standard emoji with their names and keywords in the bundled locale that
 * `resolveEmojiLocale` finds for `locale` (English by default), once per locale, as separate chunks.
 */
export function loadEmojiData(locale = 'en') {
    const resolved = resolveEmojiLocale(locale);
    let emoji = loaded.get(resolved);
    if (!emoji) {
        emoji = loadLocale(resolved);
        loaded.set(resolved, emoji);
        // A failed chunk is fetched again next time.
        emoji.catch(() => loaded.delete(resolved));
    }
    return emoji;
}
//# sourceMappingURL=emoji-locale.js.map