import type { Key } from '../../core/props.js';
/** Which way a relation walk goes from an item. */
export type RelationDirection = 'upstream' | 'downstream';
/** The items chosen on each side of the start item, nearest first. */
export interface RelationColumnsPath {
    upstream: readonly Key[];
    downstream: readonly Key[];
}
/** One column of a relation walk: the items related to `source`, and the one chosen among them. */
export interface RelationColumn<T> {
    /** `item` for the column of the start item. */
    direction: RelationDirection | 'item';
    /** 1 for the columns beside the start item, 2 for the next ones, 0 for the start item's. */
    depth: number;
    /** The item whose related items the column lists (the start item itself in its own column). */
    source: T;
    items: readonly T[];
    /** The chosen item's key, or null. */
    selectedKey: Key | null;
}
export interface RelationColumnsOptions<T extends {
    id: Key;
}> {
    item: T;
    path: RelationColumnsPath;
    getRelated: (item: T, direction: RelationDirection) => readonly T[];
}
export declare const emptyRelationPath: RelationColumnsPath;
/**
 * The columns of a relation walk from `item`, in reading order: the upstream columns, furthest
 * first, the start item's column, then the downstream columns. Each side walks the chosen keys of
 * `path` while each is among the related items of the one before, and ends with the column of
 * the last chosen item's related items.
 */
export declare function resolveRelationColumns<T extends {
    id: Key;
}>(options: RelationColumnsOptions<T>): RelationColumn<T>[];
/** The chosen items along the walk, in reading order: furthest upstream to furthest downstream. */
export declare function listRelationTrail<T extends {
    id: Key;
}>(columns: readonly RelationColumn<T>[]): {
    item: T;
    column: RelationColumn<T>;
}[];
/** `path` with `key` chosen in the column at `depth` of `direction`, dropping the choices past it. */
export declare function chooseRelation(path: RelationColumnsPath, choice: {
    direction: RelationDirection;
    depth: number;
    key: Key | null;
}): RelationColumnsPath;
//# sourceMappingURL=relation-columns-model.d.ts.map