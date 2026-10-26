/**
 * A stable colour slot for a key (a name or an id): an integer from 0 to `count - 1` that is the
 * same on every render, page and device. Leading and trailing whitespace in the key is ignored. A
 * `count` below one yields 0.
 */
export function getColorIndex(key, count) {
    const slots = Math.trunc(count);
    if (!Number.isFinite(slots) || slots < 1)
        return 0;
    const normalized = key.trim();
    let hash = 0;
    for (let index = 0; index < normalized.length; index += 1) {
        hash = (hash << 5) - hash + normalized.charCodeAt(index);
        hash |= 0;
    }
    return Math.abs(hash) % slots;
}
//# sourceMappingURL=color-index.js.map