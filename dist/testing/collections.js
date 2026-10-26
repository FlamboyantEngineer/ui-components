import { within } from '@testing-library/dom';
const CELL = ':scope > :is([role="cell"], [role="gridcell"], [role="rowheader"], [role="columnheader"])';
function cellsOf(row) {
    return [...row.querySelectorAll(CELL)];
}
/** Presses the expand button of the tree row named `name`, expanding or collapsing it. */
export async function toggleTreeItem(user, tree, name) {
    const row = within(tree).getByRole('row', { name });
    const button = row.querySelector('.ui-tree__expand');
    if (!button)
        throw new Error(`The tree row ${String(name)} has no children to expand.`);
    await user.click(button);
}
/**
 * The cell of a table or grid at the row named `rowName` (rows are named by their row header) and
 * the column whose header is named `columnName`.
 */
export function getTableCell(table, rowName, columnName) {
    const queries = within(table);
    const header = queries.getByRole('columnheader', { name: columnName });
    const headerRow = header.closest('[role="row"]');
    const row = queries.getByRole('row', { name: rowName });
    const index = headerRow ? cellsOf(headerRow).indexOf(header) : -1;
    const column = header.getAttribute('aria-colindex');
    const cell = (column ? row.querySelector(`:scope > [aria-colindex="${column}"]`) : null) ??
        cellsOf(row)[index];
    if (!cell)
        throw new Error(`No cell in row ${String(rowName)} under ${String(columnName)}.`);
    return cell;
}
//# sourceMappingURL=collections.js.map