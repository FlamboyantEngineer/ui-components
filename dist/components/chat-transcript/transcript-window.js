import { readOffset } from './transcript-geometry.js';
/** What an unmeasured child is taken to be before anything is measured, in pixels. */
const FALLBACK_HEIGHT = 64;
/** How many children the window holds before the viewport can be measured. */
export const INITIAL_WINDOW = 30;
/** The last `INITIAL_WINDOW` children, where a transcript starts. */
export function resolveTailRange(keys) {
    const last = keys.at(-1);
    const first = keys[Math.max(0, keys.length - INITIAL_WINDOW)];
    return first === undefined || last === undefined ? null : { first, last };
}
/** Creates the model; children it has not measured count as the measured average. */
export function createWindowModel() {
    const heights = new Map();
    const spacers = new WeakSet();
    let gap = 0;
    let total = 0;
    const estimate = (key) => heights.get(key) ?? (heights.size > 0 ? total / heights.size : FALLBACK_HEIGHT);
    return {
        spacerRef(element) {
            if (element)
                spacers.add(element);
        },
        isSpacer: (element) => spacers.has(element),
        measure(feed, mounted) {
            const elements = [...feed.children].filter((child) => !spacers.has(child));
            // A child that drew no element, or several, would pair heights with the wrong keys.
            if (elements.length !== mounted.length)
                return;
            const style = feed.ownerDocument.defaultView?.getComputedStyle(feed);
            gap = Number.parseFloat(style?.rowGap ?? '') || 0;
            elements.forEach((element, index) => {
                const key = mounted[index];
                total -= heights.get(key) ?? 0;
                const height = element.getBoundingClientRect().height;
                heights.set(key, height);
                total += height;
            });
        },
        range(viewport, feed, keys) {
            // A viewport the stylesheet left unbounded is seen through the window at most.
            const view = Math.min(viewport.clientHeight, feed.ownerDocument.defaultView?.innerHeight ?? 0);
            if (view <= 0)
                return resolveTailRange(keys);
            const feedTop = readOffset(feed, viewport);
            const top = -feedTop - view;
            const bottom = -feedTop + 2 * view;
            let offset = 0;
            let first;
            let last;
            for (const key of keys) {
                const height = estimate(key);
                if (first === undefined && offset + height > top)
                    first = key;
                if (offset < bottom)
                    last = key;
                offset += height + gap;
            }
            return first === undefined || last === undefined ? resolveTailRange(keys) : { first, last };
        },
        gapHeight(keys, start, end) {
            let height = 0;
            for (let index = start; index < end; index += 1)
                height += estimate(keys[index]);
            return height + Math.max(0, end - start - 1) * gap;
        },
    };
}
/**
 * The indices to mount: the window's run plus the children that must stay mounted (the focused
 * message, the anchored one, the newest), in order.
 */
export function selectMounted(indexOf, range, forced) {
    const mounted = new Set();
    const first = range ? indexOf.get(range.first) : undefined;
    const last = range ? indexOf.get(range.last) : undefined;
    if (first !== undefined && last !== undefined) {
        for (let index = first; index <= last; index += 1)
            mounted.add(index);
    }
    for (const key of forced) {
        const index = key === null || key === undefined ? undefined : indexOf.get(key);
        if (index !== undefined)
            mounted.add(index);
    }
    return [...mounted].sort((left, right) => left - right);
}
//# sourceMappingURL=transcript-window.js.map