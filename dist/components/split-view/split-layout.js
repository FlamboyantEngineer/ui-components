// Sizes of a resizable split's panes: percent panes share the space pixel panes leave, the last
// percent pane (the flexible one) takes what the others leave, and collapsible panes snap shut.
import { clamp } from '../../utils/clamp.js';
const defaultMinSize = 10;
const defaultMaxSize = 90;
function resolvePaneBounds(pane) {
    const pixel = pane?.unit === 'pixel';
    return {
        pixel,
        min: pane?.minSize ?? (pixel ? 0 : defaultMinSize),
        max: pane?.maxSize ?? (pixel ? Number.POSITIVE_INFINITY : defaultMaxSize),
        collapsible: pane?.collapsible ?? false,
        collapsedSize: pane?.collapsedSize ?? 0,
    };
}
function isShut(bounds, size) {
    return bounds.collapsible && size <= bounds.collapsedSize;
}
/** A collapsible pane below half its smallest size snaps shut; other sizes stay. */
function snapShut(bounds, size) {
    const isBelowHalf = size < (bounds.collapsedSize + bounds.min) / 2;
    return bounds.collapsible && isBelowHalf ? bounds.collapsedSize : size;
}
/** A size within a pane's bounds, or its collapsed size once it snaps shut. */
function snapPaneSize(bounds, size) {
    const snapped = snapShut(bounds, size);
    return isShut(bounds, snapped) ? snapped : clamp(snapped, bounds.min, bounds.max);
}
/** The percent pane beside `index` that gives or takes its share: the next one, else the previous. */
function findPercentNeighbour(panes, index) {
    const isPercent = (candidate) => candidate !== index && !resolvePaneBounds(panes[candidate]).pixel;
    const after = panes.findIndex((_, candidate) => candidate > index && isPercent(candidate));
    return after !== -1
        ? after
        : panes.findLastIndex((_, candidate) => candidate < index && isPercent(candidate));
}
/** Whether pane `index` is collapsed at `size`. */
export function isSplitPaneCollapsed(pane, size) {
    return isShut(resolvePaneBounds(pane), size);
}
/** The pane that takes the space the others leave: the last percent pane, else the last pane. */
export function resolveFlexiblePane(panes) {
    const last = panes.findLastIndex((pane) => pane.unit !== 'pixel');
    return last === -1 ? panes.length - 1 : last;
}
/** The sum of the percent panes' sizes other than pane `skip`. */
function sumOtherShares(bounds, sizes, skip) {
    return sizes.reduce((sum, size, index) => {
        return index === skip || bounds[index]?.pixel ? sum : sum + size;
    }, 0);
}
/**
 * Moves `excess` percent into (positive) or out of (negative) the flexible pane's share by taking it
 * from or giving it to the open percent panes `givers`, nearest first, within their bounds. Returns
 * what is left over.
 */
function redistribute(next, { bounds, givers, excess, }) {
    let left = excess;
    for (const index of givers) {
        const pane = bounds[index];
        const size = next[index] ?? 0;
        if (left === 0 || !pane || isShut(pane, size))
            continue;
        const room = left > 0 ? Math.max(0, size - pane.min) : Math.min(0, size - pane.max);
        const delta = left > 0 ? Math.min(left, room) : Math.max(left, room);
        next[index] = size - delta;
        left -= delta;
    }
    return left;
}
/**
 * Keeps a collapsed flexible pane shut: the nearest open percent pane before it takes the share it
 * frees, beyond its own largest size if it must.
 */
function fillCollapsed(next, { bounds, flexible, givers, }) {
    const collapsed = bounds[flexible]?.collapsedSize ?? 0;
    next[flexible] = collapsed;
    const nearest = givers.find((index) => !isShut(bounds[index], next[index] ?? 0));
    if (nearest === undefined)
        return next;
    next[nearest] = (next[nearest] ?? 0) + 100 - collapsed - sumOtherShares(bounds, next, flexible);
    return next;
}
/**
 * Sizes fitted to the panes: each open pane within its bounds, a collapsed one at its collapsed
 * size, and the flexible pane taking what the other percent panes leave of 100. When that breaks
 * the flexible pane's bounds, the nearest percent panes before it give or take the difference, and
 * its smallest size wins over theirs.
 */
export function normalizeSplitSizes(panes, sizes) {
    const bounds = panes.map(resolvePaneBounds);
    const flexible = resolveFlexiblePane(panes);
    const next = bounds.map((pane, index) => snapPaneSize(pane, sizes[index] ?? 0));
    const own = bounds[flexible];
    if (!own || own.pixel)
        return next;
    const givers = bounds
        .map((pane, index) => (index === flexible || pane.pixel ? -1 : index))
        .filter((index) => index !== -1)
        .reverse();
    const given = sizes[flexible];
    if (given !== undefined && isShut(own, given))
        return fillCollapsed(next, { bounds, flexible, givers });
    const share = 100 - sumOtherShares(bounds, next, flexible);
    const wanted = isShut(own, share) ? share : clamp(share, own.min, own.max);
    const left = redistribute(next, { bounds, givers, excess: wanted - share });
    const nearest = givers[0];
    if (left > 0 && nearest !== undefined)
        next[nearest] = Math.max(0, (next[nearest] ?? 0) - left);
    next[flexible] = 100 - sumOtherShares(bounds, next, flexible);
    return next;
}
/** The starting sizes: the given ones, else equal shares for percent panes and the smallest size for pixel panes. */
export function resolveInitialSplitSizes(panes, defaultSizes) {
    const shares = panes.filter((pane) => pane.unit !== 'pixel').length;
    const sizes = panes.map((pane, index) => defaultSizes?.[index] ??
        (pane.unit === 'pixel' ? (pane.minSize ?? 0) : 100 / Math.max(1, shares)));
    return normalizeSplitSizes(panes, sizes);
}
/**
 * The separator between pane `index` and the next one. Between percent panes its value is the pane
 * before it, bounded by both panes (a collapsible pane may go down to its collapsed size); beside a
 * pixel pane its value is that pane's size, up to `available` pixels more (unlimited while the split
 * is unmeasured, up to the pane's largest size).
 */
export function resolveSplitSeparator(panes, sizes, { index, available }) {
    const before = resolvePaneBounds(panes[index]);
    const after = resolvePaneBounds(panes[index + 1]);
    const afterSized = !before.pixel && after.pixel;
    const [sized, partner] = afterSized ? [index + 1, index] : [index, index + 1];
    const own = afterSized ? after : before;
    const other = afterSized ? before : after;
    const value = sizes[sized] ?? 0;
    const lowest = own.collapsible ? own.collapsedSize : own.min;
    const base = { sized, partner, sizedPane: afterSized ? 'after' : 'before', value };
    if (own.pixel) {
        return {
            ...base,
            pixel: true,
            min: lowest,
            max: Math.max(lowest, Math.min(own.max, value + available)),
        };
    }
    const total = value + (sizes[partner] ?? 0);
    const min = own.collapsible ? lowest : Math.max(lowest, total - other.max);
    const max = other.collapsible
        ? total - other.collapsedSize
        : Math.min(own.max, total - other.min);
    const low = clamp(min, 0, total);
    const high = clamp(max, 0, total);
    return { ...base, pixel: false, min: Math.min(low, high), max: high };
}
/**
 * The sizes after a separator moves to `value`: its sized pane takes the value, snapping shut below
 * half its smallest size, and a percent partner takes the complement, snapping shut the same way.
 */
export function applySplitSeparatorValue(panes, sizes, { index, available, value }) {
    const separator = resolveSplitSeparator(panes, sizes, { index, available });
    const own = resolvePaneBounds(panes[separator.sized]);
    const next = [...sizes];
    const raw = clamp(value, separator.min, separator.max);
    if (separator.pixel) {
        const snapped = snapShut(own, raw);
        next[separator.sized] = isShut(own, snapped) ? snapped : clamp(raw, own.min, separator.max);
        return next;
    }
    const other = resolvePaneBounds(panes[separator.partner]);
    const total = separator.value + (sizes[separator.partner] ?? 0);
    let sized = snapShut(own, raw);
    if (!isShut(own, sized)) {
        const partner = snapPaneSize(other, total - sized);
        sized = isShut(other, partner)
            ? total - partner
            : clamp(total - partner, Math.max(own.min, total - other.max), Math.min(own.max, total - other.min));
    }
    next[separator.sized] = sized;
    next[separator.partner] = total - sized;
    return next;
}
/**
 * The sizes with pane `index` collapsed; the neighbouring percent pane, after it when there is one,
 * takes the freed share. A pane that cannot collapse, or already has, keeps the sizes.
 */
export function collapseSplitPane(panes, sizes, index) {
    const pane = resolvePaneBounds(panes[index]);
    const size = sizes[index] ?? 0;
    if (!pane.collapsible || isShut(pane, size))
        return sizes;
    const next = [...sizes];
    next[index] = pane.collapsedSize;
    if (pane.pixel)
        return next;
    const neighbour = findPercentNeighbour(panes, index);
    if (neighbour === -1)
        return sizes;
    next[neighbour] = (next[neighbour] ?? 0) + size - pane.collapsedSize;
    return next;
}
/**
 * The sizes with collapsed pane `index` open again at `size` (its smallest size by default, within
 * its bounds), taking the share from the neighbouring percent pane down to that pane's smallest size,
 * and further when the opened pane would stay below its own.
 */
export function expandSplitPane(panes, sizes, { index, size }) {
    const pane = resolvePaneBounds(panes[index]);
    const current = sizes[index] ?? 0;
    if (!isShut(pane, current))
        return sizes;
    const target = clamp(size ?? pane.min, pane.min, pane.max);
    const next = [...sizes];
    if (pane.pixel) {
        next[index] = target;
        return next;
    }
    const neighbour = findPercentNeighbour(panes, index);
    if (neighbour === -1)
        return sizes;
    const giver = resolvePaneBounds(panes[neighbour]);
    const total = current + (sizes[neighbour] ?? 0);
    const opened = Math.max(pane.min, Math.min(target, total - giver.min));
    next[index] = Math.min(opened, total);
    next[neighbour] = total - next[index];
    return next;
}
/**
 * A pane's inline flex basis: a pixel pane's size, a percent pane's share of the space the pixel
 * panes leave, and none for the flexible pane, which takes what remains.
 */
export function resolveSplitPaneBasis(panes, sizes, index) {
    if (index === resolveFlexiblePane(panes))
        return undefined;
    const size = sizes[index] ?? 0;
    if (panes[index]?.unit === 'pixel')
        return `${size}px`;
    const fixed = panes.reduce((sum, pane, other) => (pane.unit === 'pixel' ? sum + (sizes[other] ?? 0) : sum), 0);
    return fixed === 0 ? `${size}%` : `calc((100% - ${fixed}px) * ${size / 100})`;
}
//# sourceMappingURL=split-layout.js.map