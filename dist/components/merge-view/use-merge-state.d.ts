import { type ConflictMarkers, type ConflictState, type MergeBlock, type MergeResolution } from './merge-blocks.js';
/** The merge after a change: the result text and how each conflict stands. */
export interface MergeViewResult {
    /**
     * The merged text: clean changes applied, each resolved conflict's result, and each unresolved
     * conflict's sides between conflict markers.
     */
    text: string;
    /** Each conflict's resolution, in order. */
    resolutions: MergeResolution[];
    /** How many conflicts are unresolved. */
    unresolved: number;
}
interface MergeStateOptions {
    base: string;
    ours: string;
    theirs: string;
    markers: ConflictMarkers;
    onChange: ((result: MergeViewResult) => void) | undefined;
}
/**
 * A merge view's blocks and conflict states for its texts: resolving a conflict makes it current
 * and reports the result; every conflict starts over unresolved when a text changes.
 */
export declare function useMergeState({ base, ours, theirs, markers, onChange }: MergeStateOptions): {
    blocks: MergeBlock[];
    states: readonly ConflictState[];
    current: number | null;
    unresolved: number;
    resolve: (conflict: number, next: ConflictState) => void;
    setCurrent: (conflict: number) => void;
};
export {};
//# sourceMappingURL=use-merge-state.d.ts.map