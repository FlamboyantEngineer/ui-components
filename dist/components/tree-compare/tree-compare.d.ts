import type { AriaLabellingProps, ExpansionProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type CompareTreeNode } from '../../utils/compare-trees.js';
import { type TreeCompareLabelRenderer } from './tree-compare-parts.js';
export type { TreeCompareLabelRenderer, TreeCompareSide } from './tree-compare-parts.js';
export interface TreeCompareProps<T extends CompareTreeNode> extends BaseProps, AriaLabellingProps, ExpansionProps {
    /** The left hierarchy, such as the earlier version. Ids are unique within each tree. */
    left: readonly T[];
    /** The right hierarchy, such as the later version. */
    right: readonly T[];
    /** Heads the left column. Defaults to the provider's `valueBefore` string. */
    leftLabel?: string | undefined;
    /** Heads the right column. Defaults to the provider's `valueAfter` string. */
    rightLabel?: string | undefined;
    /** Whether a node on both sides is unchanged. Defaults to comparing labels. */
    isEqual?: ((left: T, right: T) => boolean) | undefined;
    /** Draws a node's label in one side's cell. Defaults to its `label`. */
    renderLabel?: TreeCompareLabelRenderer<T> | undefined;
    /** Shows only the rows that differ and the rows above them, controlled. */
    changesOnly?: boolean | undefined;
    /** Whether only differences show at first, uncontrolled. */
    defaultChangesOnly?: boolean | undefined;
    /** Called when the reader turns "only differences" on or off. */
    onChangesOnlyChange?: ((changesOnly: boolean) => void) | undefined;
}
/**
 * Two hierarchies aligned row by row on React Aria's tree through `Tree`: each row shows a node's
 * left and right versions side by side, marked added, removed, changed or moved, with one
 * expansion for both sides, a filter that keeps only differences, steps between differences, links
 * between a moved node's two positions and a summary of the counts.
 */
export declare function TreeCompare<T extends CompareTreeNode>(props: TreeCompareProps<T>): import("react").JSX.Element;
//# sourceMappingURL=tree-compare.d.ts.map