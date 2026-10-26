// The pure model of a grid size picker: where a key moves the previewed size, and how far the grid
// grows to show it.
function limit(value, max) {
    return Math.max(1, Math.min(max, value));
}
/**
 * The size a navigation key moves `size` to inside `max`, or `null` for any other key. Left and
 * right follow the reading `direction`; Home and End reach the row's ends, and with Ctrl or Cmd the
 * grid's corners.
 */
export function moveGridSize(size, { key, isRtl, isCorner, max }) {
    const forward = isRtl ? -1 : 1;
    const steps = {
        ArrowUp: { rows: size.rows - 1, columns: size.columns },
        ArrowDown: { rows: size.rows + 1, columns: size.columns },
        ArrowLeft: { rows: size.rows, columns: size.columns - forward },
        ArrowRight: { rows: size.rows, columns: size.columns + forward },
        Home: { rows: isCorner ? 1 : size.rows, columns: 1 },
        End: { rows: isCorner ? max.rows : size.rows, columns: max.columns },
    };
    const next = steps[key];
    return next
        ? { rows: limit(next.rows, max.rows), columns: limit(next.columns, max.columns) }
        : null;
}
/** The rows and columns shown: one past `size` each way, at least `min` and at most `max`. */
export function getShownGridSize(size, { min, max }) {
    return {
        rows: Math.min(max.rows, Math.max(min.rows, size.rows + 1)),
        columns: Math.min(max.columns, Math.max(min.columns, size.columns + 1)),
    };
}
//# sourceMappingURL=grid-size.js.map