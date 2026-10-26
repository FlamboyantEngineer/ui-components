export const skinTones = [
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
};
function toneSkins(unicode, rule) {
    if (rule !== '1' && rule !== '2')
        return undefined;
    const [first = '', ...rest] = Array.from(unicode);
    const tail = (rest[0] === '\uFE0F' ? rest.slice(1) : rest).join('');
    return toneModifiers.map((modifier) => rule === '1' ? `${first}${modifier}${tail}` : `${first}${modifier}${tail}${modifier}`);
}
function parseLine(line, category) {
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
function plainGlyph(key) {
    return key.replace(anyToneModifier, '').replace(variationSelector, '');
}
/** The emoji a recent key names: a custom `:shortcode:` as is, a glyph without tone or variation. */
function normalizeRecentKey(key) {
    return key.startsWith(':') ? key : plainGlyph(key);
}
function bestScore(values, query, weights) {
    const [exact = 0, prefix = 0, contains = 0] = weights;
    let best = 0;
    for (const value of values) {
        const text = value.toLowerCase();
        if (text === query)
            return exact;
        if (text.startsWith(query))
            best = Math.max(best, prefix);
        else if (text.includes(query))
            best = Math.max(best, contains);
    }
    return best;
}
function scoreEntry(entry, query) {
    const fields = entry.kind === 'native'
        ? entry.emoji
        : {
            shortcodes: [entry.emoji.shortcode],
            label: getEmojiLabel(entry),
            keywords: entry.emoji.keywords ?? [],
        };
    return Math.max(bestScore(fields.shortcodes, query, searchWeights.shortcodes), bestScore([fields.label], query, searchWeights.label), bestScore(fields.keywords, query, searchWeights.keywords));
}
/** The code points of a glyph in upper-case hex, joined by `-`, without variation selectors. */
export function toHexcode(unicode) {
    return Array.from(unicode.replace(variationSelector, ''), (point) => (point.codePointAt(0) ?? 0).toString(16).toUpperCase()).join('-');
}
/** Reads the compact emoji format that `scripts/generate-emoji-data.mjs` writes. */
export function parseEmojiData(text) {
    const emoji = [];
    let category = 'smileys';
    for (const line of text.split('\n')) {
        if (line.includes('|'))
            emoji.push(parseLine(line, category));
        else if (line)
            category = line;
    }
    return emoji;
}
/** A single-code-point glyph followed by the modifier for a skin tone (`default` adds none). */
export function withSkinTone(glyph, tone) {
    return `${glyph}${toneModifiers[skinTones.indexOf(tone) - 1] ?? ''}`;
}
/** The glyph for a skin tone, falling back to the plain glyph when the emoji takes no tone. */
export function applySkinTone(emoji, tone) {
    const index = skinTones.indexOf(tone) - 1;
    return emoji.skins?.[index] ?? emoji.unicode;
}
/** The selection reported for an entry in a skin tone. */
export function toEmojiSelection(entry, tone) {
    if (entry.kind === 'custom')
        return entry;
    const unicode = applySkinTone(entry.emoji, tone);
    const skinTone = unicode === entry.emoji.unicode ? 'default' : tone;
    return { kind: 'native', emoji: entry.emoji, unicode, hexcode: toHexcode(unicode), skinTone };
}
/** The accessible name of an entry. */
export function getEmojiLabel(entry) {
    return entry.kind === 'native'
        ? entry.emoji.label
        : entry.emoji.label?.trim() || `:${entry.emoji.shortcode}:`;
}
/**
 * The key a list of recently used emoji stores for an entry: the plain glyph of a standard emoji,
 * `:shortcode:` for a custom one.
 */
export function getEmojiKey(entry) {
    return entry.kind === 'native' ? entry.emoji.unicode : `:${entry.emoji.shortcode}:`;
}
/**
 * The entries for stored keys, skipping keys that match no emoji and keys naming an emoji already
 * listed. Tone modifiers are ignored.
 */
export function resolveEmojiKeys(keys, emoji, custom) {
    const byKey = new Map();
    for (const item of emoji)
        byKey.set(plainGlyph(item.unicode), { kind: 'native', emoji: item });
    for (const item of custom)
        byKey.set(`:${item.shortcode}:`, { kind: 'custom', emoji: item });
    const listed = new Set();
    return keys.flatMap((key) => {
        const entry = byKey.get(normalizeRecentKey(key));
        if (!entry || listed.has(entry))
            return [];
        listed.add(entry);
        return [entry];
    });
}
/**
 * `recent` with `key` moved to the front and at most `limit` long, keeping one key per emoji: other
 * tones of the same emoji and repeated keys are dropped.
 */
export function addRecentEmoji(recent, key, limit) {
    const seen = new Set();
    return [key, ...recent]
        .filter((item) => {
        const normalized = normalizeRecentKey(item);
        if (seen.has(normalized))
            return false;
        seen.add(normalized);
        return true;
    })
        .slice(0, limit);
}
/**
 * The entries matching a query by shortcode, label or keyword, best first and at most `limit`.
 * Surrounding colons in the query are ignored; an empty query matches nothing.
 */
export function searchEmoji(entries, query, limit) {
    const normalized = query
        .trim()
        .toLowerCase()
        .replace(/^:+|:+$/g, '');
    if (!normalized)
        return [];
    return entries
        .map((entry) => ({ entry, score: scoreEntry(entry, normalized) }))
        .filter((match) => match.score > 0)
        .sort((a, b) => b.score - a.score || getEmojiLabel(a.entry).localeCompare(getEmojiLabel(b.entry)))
        .slice(0, limit)
        .map((match) => match.entry);
}
//# sourceMappingURL=emoji-catalog.js.map