import type { Key } from '../core/props.js';
/** A node of a compared hierarchy. Its children are nodes of the same type. */
export interface CompareTreeNode {
    /** Identifies the node in both trees; unique within each tree. */
    id: Key;
    label: string;
    children?: readonly CompareTreeNode[] | undefined;
}
/** How a row differs between the left and the right tree. */
export type TreeChange = 'unchanged' | 'added' | 'removed' | 'changed' | 'moved';
/** How many nodes were added, removed, changed and moved; a moved node counts once. */
export type TreeChangeCounts = Record<Exclude<TreeChange, 'unchanged'>, number>;
/** One aligned row: a node on the left, on the right or on both sides, and its child rows. */
export interface ComparedTreeRow<T extends CompareTreeNode = CompareTreeNode> {
    /** Unique among rows: the node's id, or an unused `moved-from:<id>` key for its old position. */
    id: Key;
    /** The node's id. */
    nodeId: Key;
    /** The node in the left tree, when the row shows it there. */
    left?: T | undefined;
    /** The node in the right tree, when the row shows it there. */
    right?: T | undefined;
    change: TreeChange;
    /** For a moved node, the id of its row at the other position. */
    counterpartId?: Key | undefined;
    children: Array<ComparedTreeRow<T>>;
}
export interface TreeComparison<T extends CompareTreeNode = CompareTreeNode> {
    rows: Array<ComparedTreeRow<T>>;
    counts: TreeChangeCounts;
}
export interface CompareTreesOptions<T extends CompareTreeNode> {
    /** Whether a node present on both sides is unchanged. Defaults to comparing labels. */
    isEqual?: ((left: T, right: T) => boolean) | undefined;
}
/**
 * Aligns two hierarchies row by row, matching nodes by id. A node on both sides under the same
 * parent and in the same order is one row, `unchanged` or `changed`; a node on one side only is
 * `added` or `removed` with its subtree; a node whose parent or order differs is `moved` and has
 * two rows, its old position (left only, no children) and its new one (right only, its children
 * compared under it), each naming the other as its counterpart.
 */
export declare function compareTrees<T extends CompareTreeNode>(left: readonly T[], right: readonly T[], options?: CompareTreesOptions<T>): TreeComparison<T>;
//# sourceMappingURL=compare-trees.d.ts.map