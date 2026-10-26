import { type ConflictState, type MergeBlock } from './merge-blocks.js';
import { type MergePaneProps } from './merge-view-sides.js';
/** The sides' labels: our side, the base and their side. */
export interface MergeLabels {
    ours: string;
    base: string;
    theirs: string;
}
interface MergeResultPaneProps extends MergePaneProps {
    blocks: readonly MergeBlock[];
    states: readonly ConflictState[];
    labels: MergeLabels;
    /** Prefix of the conflict blocks' ids. */
    baseId: string;
    onResolve: (conflict: number, state: ConflictState) => void;
}
/** The id of a conflict's block in the result. */
export declare function getConflictId(baseId: string, conflict: number): string;
/**
 * The result pane: each clean chunk's merged lines, and each conflict as a block with its take
 * actions and an editor holding its result.
 */
export declare function MergeResultPane(props: MergeResultPaneProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=merge-view-result.d.ts.map