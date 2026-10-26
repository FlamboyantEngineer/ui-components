import { toPageRotation } from './use-pdf-document.js';
function isRef(value) {
    return typeof value === 'object' && value !== null && 'num' in value && 'gen' in value;
}
function readNumber(destination, index) {
    const value = destination[index];
    return typeof value === 'number' ? value : null;
}
/** The corner an explicit destination puts at the top left of the view, by its kind. */
function readDestinationPoint(destination) {
    const kind = destination[1];
    const name = typeof kind === 'object' && kind !== null && 'name' in kind ? kind.name : null;
    switch (name) {
        case 'XYZ':
            return { x: readNumber(destination, 2), y: readNumber(destination, 3) };
        case 'FitH':
        case 'FitBH':
            return { x: null, y: readNumber(destination, 2) };
        case 'FitV':
        case 'FitBV':
            return { x: readNumber(destination, 2), y: null };
        case 'FitR':
            return { x: readNumber(destination, 2), y: readNumber(destination, 5) };
        default:
            return { x: null, y: null };
    }
}
/** The page an explicit destination's first entry names: a page reference or a page index. */
async function readPageIndex(loaded, target) {
    if (isRef(target))
        return loaded.document.getPageIndex(target);
    return typeof target === 'number' && Number.isInteger(target) ? target : -1;
}
/**
 * A point in a page's user space as page coordinates: points from the top-left corner of the page
 * as displayed, after its own rotation and the reader's.
 */
export function toDisplayedPoint(page, rotation, point) {
    const [left = 0, bottom = 0, right = 0, top = 0] = page.view;
    const across = point.x - left;
    const down = top - point.y;
    const width = right - left;
    const height = top - bottom;
    switch (toPageRotation(page, rotation)) {
        case 90:
            return { left: height - down, top: across };
        case 180:
            return { left: width - across, top: height - down };
        case 270:
            return { left: down, top: width - across };
        default:
            return { left: across, top: down };
    }
}
/**
 * Where a destination (a name the document defines, or an explicit destination) sends the reader:
 * its page, and the spot the destination puts at the top of the view, or `null` when the
 * destination is unknown. A destination that names no spot lands on the page's top.
 */
export async function resolveDestination(loaded, destination) {
    try {
        const explicit = typeof destination === 'string'
            ? await loaded.document.getDestination(destination)
            : destination;
        if (!Array.isArray(explicit))
            return null;
        const pageIndex = await readPageIndex(loaded, explicit[0]);
        const page = loaded.pages[pageIndex];
        if (!page)
            return null;
        const { x, y } = readDestinationPoint(explicit);
        if (x === null && y === null)
            return { pageIndex, rect: null };
        const [left = 0, , , top = 0] = page.view;
        const point = toDisplayedPoint(page, loaded.rotation, { x: x ?? left, y: y ?? top });
        return { pageIndex, rect: { ...point, width: 0, height: 0 } };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=pdf-destination.js.map