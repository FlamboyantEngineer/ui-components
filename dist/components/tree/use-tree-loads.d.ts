import type { Key } from '../../core/props.js';
/** Loading the children of tree branches on demand, branch by branch. */
export interface TreeLoads {
    /** Asks the owner for a branch's children, unless they are loading already. */
    load: (key: Key) => void;
    isLoading: (key: Key) => boolean;
    /** Whether a load of the branch's children succeeded. */
    hasLoaded: (key: Key) => boolean;
    /** Why loading a branch's children failed, or `null`. */
    errorOf: (key: Key) => string | null;
}
/**
 * Loading children on demand, branch by branch: `onLoad` may return a promise; while it is pending
 * the branch is loading, and a rejection keeps its message until the next attempt.
 */
export declare function useTreeLoads(onLoad: ((key: Key) => unknown) | undefined): TreeLoads;
//# sourceMappingURL=use-tree-loads.d.ts.map