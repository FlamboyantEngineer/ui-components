import { toCollectionKey } from '../../utils/to-collection-key.js';
/** A one-cell range at `position`. */
export function createCellRange(position) {
    return { anchor: position, focus: position };
}
/** The grid of the visible rows and drawn columns, with lookups by key and id. */
export function createCellGrid(rows, columns) {
    return {
        rows,
        columns,
        rowIndex: new Map(rows.map((row, index) => [toCollectionKey(row.id), index])),
        columnIndex: new Map(columns.map((column, index) => [column.id, index])),
    };
}
/** The cell at row and column indices, if both are in the grid. */
export function getCellPosition(grid, at) {
    const row = grid.rows[at.row];
    const column = grid.columns[at.column];
    return row && column ? { rowKey: row.id, columnId: column.id } : null;
}
/** A cell's row and column indices, or null when the grid does not show it. */
export function locateCell(grid, position) {
    const row = grid.rowIndex.get(toCollectionKey(position.rowKey));
    const column = grid.columnIndex.get(position.columnId);
    return row === undefined || column === undefined ? null : { row, column };
}
/** The rectangle a range covers, or null when the grid shows neither of its corners. */
export function getRangeBounds(grid, range) {
    if (!range)
        return null;
    const anchor = locateCell(grid, range.anchor);
    const focus = locateCell(grid, range.focus) ?? anchor;
    if (!anchor || !focus)
        return null;
    return {
        top: Math.min(anchor.row, focus.row),
        bottom: Math.max(anchor.row, focus.row),
        start: Math.min(anchor.column, focus.column),
        end: Math.max(anchor.column, focus.column),
    };
}
/** The cell `rows` and `columns` steps from `position`, kept inside the grid. */
export function stepCell(grid, position, step) {
    const at = locateCell(grid, position);
    if (!at)
        return position;
    const row = Math.min(Math.max(at.row + step.rows, 0), grid.rows.length - 1);
    const column = Math.min(Math.max(at.column + step.columns, 0), grid.columns.length - 1);
    return getCellPosition(grid, { row, column }) ?? position;
}
/** Where the cell at row and column indices sits in `bounds`. */
export function placeInBounds(bounds, at) {
    const isInRange = bounds !== null &&
        at.row >= bounds.top &&
        at.row <= bounds.bottom &&
        at.column >= bounds.start &&
        at.column <= bounds.end;
    const isBottom = isInRange && at.row === bounds.bottom;
    const isEnd = isInRange && at.column === bounds.end;
    return {
        isInRange,
        isTop: isInRange && at.row === bounds.top,
        isBottom,
        isStart: isInRange && at.column === bounds.start,
        isEnd,
        isCorner: isBottom && isEnd,
    };
}
/** The rows and columns of `bounds`, each cell as its row and column. */
export function listBoundsCells(grid, bounds) {
    const rows = grid.rows.slice(bounds.top, bounds.bottom + 1);
    const columns = grid.columns.slice(bounds.start, bounds.end + 1);
    return rows.map((row) => columns.map((column) => ({ row, column })));
}
/** The range spanning `bounds`, anchored at its top start cell. */
export function createBoundsRange(grid, bounds) {
    const anchor = getCellPosition(grid, { row: bounds.top, column: bounds.start });
    const focus = getCellPosition(grid, { row: bounds.bottom, column: bounds.end });
    return anchor && focus ? { anchor, focus } : null;
}
/** Whether two ranges cover the same cells from the same anchor. */
export function isSameCellRange(left, right) {
    const same = (a, b) => a.rowKey === b.rowKey && a.columnId === b.columnId;
    if (!left || !right)
        return left === right;
    return same(left.anchor, right.anchor) && same(left.focus, right.focus);
}
/** The data cell of the table whose root is `root` that holds `target`, if any. */
export function findDataCell(target, root) {
    const cell = target instanceof Element ? target.closest('.ui-table__cell[data-kind="data"]') : null;
    if (!(cell instanceof HTMLElement))
        return null;
    return cell.closest('.ui-table__body')?.closest('.ui-table') === root ? cell : null;
}
/** The position of a data cell element in the grid, or null for cells the grid does not hold. */
export function readCellPosition(grid, cell) {
    const rowKey = cell.closest('[role="row"]')?.getAttribute('data-key');
    const index = rowKey == null ? undefined : grid.rowIndex.get(rowKey);
    const row = index === undefined ? undefined : grid.rows[index];
    const columnId = cell.dataset['column'];
    return row && columnId !== undefined && grid.columnIndex.has(columnId)
        ? { rowKey: row.id, columnId }
        : null;
}
//# sourceMappingURL=table-cell-range.js.map