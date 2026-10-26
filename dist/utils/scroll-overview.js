// Maps markers placed in a scroll container's content onto the pixels of its visible height, for a
// decorative overview painted beside the scrollbar.
/** The smallest overview height of a marker, so a one-line mark in a long document stays visible. */
export const SCROLL_OVERVIEW_MIN_MARKER = 2;
function appendPixel(segments, top, color) {
    const last = segments[segments.length - 1];
    if (last && last.top + last.height === top && last.color === color)
        last.height += 1;
    else
        segments.push({ top, height: 1, color });
}
/**
 * Projects markers onto `viewportHeight` overview pixels for content `scrollHeight` pixels tall.
 * Every marker covers at least two pixels, the lowest priority wins a shared pixel whatever the
 * marker order, and adjacent pixels of one colour merge into one segment. Content that fits the
 * viewport has no overview.
 */
export function resolveScrollOverviewSegments(markers, viewportHeight, scrollHeight) {
    if (viewportHeight <= 0 || scrollHeight <= viewportHeight)
        return [];
    const length = Math.ceil(viewportHeight);
    const owners = new Array(length);
    const scale = viewportHeight / scrollHeight;
    for (const marker of markers) {
        if (!Number.isFinite(marker.top) || !Number.isFinite(marker.height) || marker.height <= 0) {
            continue;
        }
        const start = Math.max(0, Math.min(length - SCROLL_OVERVIEW_MIN_MARKER, Math.floor(marker.top * scale)));
        const end = Math.min(length, Math.max(start + SCROLL_OVERVIEW_MIN_MARKER, Math.ceil((marker.top + marker.height) * scale)));
        for (let pixel = start; pixel < end; pixel += 1) {
            const owner = owners[pixel];
            if (!owner || marker.priority < owner.priority)
                owners[pixel] = marker;
        }
    }
    const segments = [];
    owners.forEach((owner, pixel) => {
        if (owner)
            appendPixel(segments, pixel, owner.color);
    });
    return segments;
}
/**
 * Resolves each layer on its own, then combines layers that share a pixel with equal weight, in
 * layer-name order so the result does not depend on the order the caller lists them. A single layer
 * resolves exactly as `resolveScrollOverviewSegments`.
 */
export function resolveLayeredScrollOverviewSegments(layers, viewportHeight, scrollHeight) {
    const pixels = Array.from({ length: Math.max(0, Math.ceil(viewportHeight)) }, () => []);
    const ordered = [...layers].sort((left, right) => left.name.localeCompare(right.name));
    for (const layer of ordered) {
        for (const segment of resolveScrollOverviewSegments(layer.markers, viewportHeight, scrollHeight)) {
            for (let pixel = segment.top; pixel < segment.top + segment.height; pixel += 1) {
                pixels[pixel]?.push(segment.color);
            }
        }
    }
    const segments = [];
    pixels.forEach((colors, pixel) => {
        if (colors.length === 0)
            return;
        // Mixing the n-th colour in at 1/n keeps every layer's share equal.
        const color = colors.reduce((mixed, next, index) => index === 0 ? next : `color-mix(in srgb, ${mixed} ${(index / (index + 1)) * 100}%, ${next})`);
        appendPixel(segments, pixel, color);
    });
    return segments;
}
/**
 * A vertical `linear-gradient` painting each segment in its colour over a transparent ground, for a
 * box `height` pixels tall, or `none` when there is nothing to paint. Opacity is left to the
 * stylesheet.
 */
export function buildScrollOverviewImage(segments, height) {
    if (segments.length === 0 || height <= 0)
        return 'none';
    const stops = ['transparent 0%'];
    for (const segment of segments) {
        const top = (segment.top / height) * 100;
        const bottom = ((segment.top + segment.height) / height) * 100;
        stops.push(`transparent ${top}%`, `${segment.color} ${top}% ${bottom}%`, `transparent ${bottom}%`);
    }
    stops.push('transparent 100%');
    return `linear-gradient(to bottom, ${stops.join(', ')})`;
}
//# sourceMappingURL=scroll-overview.js.map