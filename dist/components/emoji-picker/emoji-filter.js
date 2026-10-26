const countryFlag = /^[\u{1F1E6}-\u{1F1FF}]{2}$/u;
/** Whether a glyph is a country flag: a pair of regional indicator letters. */
export function isCountryFlag(unicode) {
    return countryFlag.test(unicode);
}
function isOffered(emoji, options) {
    const { maxVersion, hideCountryFlags, filterEmoji } = options;
    if (maxVersion !== undefined && emoji.version !== undefined && emoji.version > maxVersion) {
        return false;
    }
    if (hideCountryFlags && isCountryFlag(emoji.unicode))
        return false;
    return filterEmoji ? filterEmoji(emoji) : true;
}
/** The emoji a picker offers, in the order of `categories` when it is given. */
export function filterNativeEmoji(emoji, options) {
    const { categories } = options;
    const offered = emoji.filter((item) => (!categories || categories.includes(item.category)) && isOffered(item, options));
    if (!categories)
        return offered;
    return offered.sort((a, b) => categories.indexOf(a.category) - categories.indexOf(b.category));
}
//# sourceMappingURL=emoji-filter.js.map