import { measuredProperty } from '../../core/hooks.js';
/** The keys of the selection and actions columns. */
export const selectionColumnId = 'ui-table-selection';
export const actionsColumnId = 'ui-table-actions';
/** The columns that name a row: those marked `isRowHeader`, else the first. */
export function getRowHeaderColumns(columns) {
    const marked = columns.filter((column) => column.isRowHeader);
    return marked.length > 0 ? marked : columns.slice(0, 1);
}
/** The number of columns a row spans: data columns plus the selection and actions columns. */
export function countTableColumns(structure) {
    return structure.columns.length + Number(structure.hasSelection) + Number(structure.hasActions);
}
/**
 * The edge a column is pinned to. The selection column pins with the start columns and the actions
 * column with the end columns, so they stay beside the rows they act on.
 */
export function getColumnPin(structure, column) {
    if (structure.isVirtualized)
        return undefined;
    if (typeof column === 'object')
        return column.pin;
    const edge = column === 'selection' ? 'start' : 'end';
    return structure.columns.some((candidate) => candidate.pin === edge) ? edge : undefined;
}
/** The inline style of a pinned header or cell: its measured distance from its edge. */
export function getPinStyle(pin, offset) {
    return pin ? measuredProperty('table-pin-offset', offset ?? 0) : undefined;
}
//# sourceMappingURL=table-structure.js.map