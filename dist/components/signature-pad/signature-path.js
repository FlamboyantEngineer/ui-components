// Pure geometry of drawn signatures: smoothed stroke paths and standalone SVG output.
/** The drawing space of a new signature: three times as wide as it is high. */
export const signatureSpace = { width: 600, height: 200 };
/** Points closer than this to the previous kept point add nothing a reader can see. */
const minimumStep = 1.5;
/** The pen width of a standalone signature, in drawing-space units. */
const exportStrokeWidth = 3;
function formatCoordinate(value) {
    const rounded = Math.round(value * 10) / 10;
    return Object.is(rounded, -0) ? '0' : String(rounded);
}
function formatPoint({ x, y }) {
    return `${formatCoordinate(x)} ${formatCoordinate(y)}`;
}
function isFarEnough(from, to) {
    return Math.hypot(to.x - from.x, to.y - from.y) >= minimumStep;
}
/** Drops points too close to the last one kept, always keeping the first and the last point. */
function simplifyStroke(points) {
    const kept = [];
    for (const point of points) {
        const last = kept.at(-1);
        if (!last || isFarEnough(last, point))
            kept.push(point);
    }
    const final = points.at(-1);
    if (final && kept.length > 1 && kept.at(-1) !== final)
        kept[kept.length - 1] = final;
    return kept;
}
/**
 * The SVG path data of one stroke: a quadratic curve through the midpoints between the pointer
 * positions, which smooths the jitter of a hand-drawn line. A single point is a zero-length line,
 * which a round line cap draws as a dot.
 */
export function formatSignatureStroke(points) {
    const kept = simplifyStroke(points);
    const [first, ...rest] = kept;
    if (!first)
        return '';
    if (rest.length === 0)
        return `M${formatPoint(first)} L${formatPoint(first)}`;
    const curves = rest.slice(0, -1).map((point, index) => {
        const next = rest[index + 1];
        const middle = { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 };
        return `Q${formatPoint(point)} ${formatPoint(middle)}`;
    });
    return [`M${formatPoint(first)}`, ...curves, `L${formatPoint(rest.at(-1))}`].join(' ');
}
function escapeAttribute(value) {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
/**
 * A drawn signature as standalone SVG markup: round, unfilled strokes in `currentColor`, so the
 * markup inlined in a page takes the text colour and an image of it draws in black.
 */
export function formatSignatureSvg(drawing) {
    const width = Number(drawing.width);
    const height = Number(drawing.height);
    const paths = drawing.paths.map((path) => `<path d="${escapeAttribute(path)}"/>`).join('');
    return (`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ` +
        `width="${width}" height="${height}" fill="none" stroke="currentColor" ` +
        `stroke-width="${exportStrokeWidth}" stroke-linecap="round" stroke-linejoin="round">` +
        `${paths}</svg>`);
}
/** A drawn signature as a `data:` URL of its SVG markup, for an image source or a stored file. */
export function formatSignatureDataUrl(drawing) {
    return `data:image/svg+xml,${encodeURIComponent(formatSignatureSvg(drawing))}`;
}
//# sourceMappingURL=signature-path.js.map