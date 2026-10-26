import type { Key } from '../../core/props.js';
/** A relation between a row item and a column item of a relation matrix. */
export interface RelationMatrixRelation {
    row: Key;
    column: Key;
    /** The relation's kind, one of the matrix's `kinds`. */
    kind?: string | undefined;
}
/** The relations of a matrix by cell, and how many each row and column holds. */
export interface RelationMatrixIndex {
    get: (row: Key, column: Key) => RelationMatrixRelation | undefined;
    countRow: (row: Key) => number;
    countColumn: (column: Key) => number;
}
/**
 * Indexes `relations` by cell, keeping the first relation of a cell and leaving out those whose row
 * or column is not on the matrix, and counts the cells related in each row and column.
 */
export declare function indexRelations(relations: readonly RelationMatrixRelation[], axes: {
    rows: readonly {
        id: Key;
    }[];
    columns: readonly {
        id: Key;
    }[];
}): RelationMatrixIndex;
/**
 * `relations` with the relation of one cell added (with `kind`) or removed: an owner's way to
 * apply a cell action that toggles a relation.
 */
export declare function toggleRelation(relations: readonly RelationMatrixRelation[], cell: {
    row: Key;
    column: Key;
    kind?: string | undefined;
}): RelationMatrixRelation[];
//# sourceMappingURL=relation-matrix-model.d.ts.map