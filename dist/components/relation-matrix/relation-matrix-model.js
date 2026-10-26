/**
 * Indexes `relations` by cell, keeping the first relation of a cell and leaving out those whose row
 * or column is not on the matrix, and counts the cells related in each row and column.
 */
export function indexRelations(relations, axes) {
    const rowKeys = new Set(axes.rows.map((row) => row.id));
    const columnKeys = new Set(axes.columns.map((column) => column.id));
    const cells = new Map();
    const rowCounts = new Map();
    const columnCounts = new Map();
    for (const relation of relations) {
        if (!rowKeys.has(relation.row) || !columnKeys.has(relation.column))
            continue;
        const row = cells.get(relation.row) ?? new Map();
        if (row.has(relation.column))
            continue;
        row.set(relation.column, relation);
        cells.set(relation.row, row);
        rowCounts.set(relation.row, (rowCounts.get(relation.row) ?? 0) + 1);
        columnCounts.set(relation.column, (columnCounts.get(relation.column) ?? 0) + 1);
    }
    return {
        get: (row, column) => cells.get(row)?.get(column),
        countRow: (row) => rowCounts.get(row) ?? 0,
        countColumn: (column) => columnCounts.get(column) ?? 0,
    };
}
/**
 * `relations` with the relation of one cell added (with `kind`) or removed: an owner's way to
 * apply a cell action that toggles a relation.
 */
export function toggleRelation(relations, cell) {
    const isCell = (relation) => relation.row === cell.row && relation.column === cell.column;
    if (relations.some(isCell))
        return relations.filter((relation) => !isCell(relation));
    const added = { row: cell.row, column: cell.column };
    if (cell.kind !== undefined)
        added.kind = cell.kind;
    return [...relations, added];
}
//# sourceMappingURL=relation-matrix-model.js.map