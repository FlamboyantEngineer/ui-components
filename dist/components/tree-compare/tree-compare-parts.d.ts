import type { ReactNode } from 'react';
import type { CompareTreeNode, ComparedTreeRow, TreeChangeCounts } from '../../utils/compare-trees.js';
/** Which tree a cell shows. */
export type TreeCompareSide = 'left' | 'right';
/** Draws a node's label in one side's cell. */
export type TreeCompareLabelRenderer<T extends CompareTreeNode> = (node: T, side: TreeCompareSide) => ReactNode;
/** The hook classes every module of the tree comparison writes (specs/TREE-COMPARE.md). */
export declare const treeCompareHooks: import("../../core/hooks.js").ComponentHooks<"header" | "summary" | "marker" | "count" | "row" | "previous" | "next" | "cell" | "toolbar" | "tree" | "column-label" | "jump" | "changes-only" | "branch">;
/** The summary, the switch that keeps only differences and the buttons that move between them. */
export declare function TreeCompareToolbar(props: {
    counts: TreeChangeCounts;
    changesOnly: boolean;
    onChangesOnlyChange: (changesOnly: boolean) => void;
    hasChanges: boolean;
    onStep: (step: 1 | -1) => void;
}): import("react").JSX.Element;
/** The two column labels above the rows. */
export declare function TreeCompareHeader(props: {
    leftLabel: string;
    rightLabel: string;
}): import("react").JSX.Element;
/**
 * One aligned row: the left node's cell, the change marker and the right node's cell. The tree's
 * own expand button serves the row; the right cell repeats its glyph, decoratively.
 */
export declare function TreeCompareRowContent<T extends CompareTreeNode>(props: {
    row: ComparedTreeRow<T>;
    isExpanded: boolean;
    renderLabel: TreeCompareLabelRenderer<T> | undefined;
}): import("react").JSX.Element;
/** The button on a moved row that goes to the node's other position. */
export declare function TreeCompareJump(props: {
    isOldPosition: boolean;
    onPress: () => void;
}): import("react").JSX.Element;
//# sourceMappingURL=tree-compare-parts.d.ts.map