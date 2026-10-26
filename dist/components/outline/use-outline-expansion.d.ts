import type { ExpansionProps } from '../../core/events.js';
import type { OutlineEntry } from './outline-tree.js';
export interface OutlineExpansionOptions extends ExpansionProps {
    /** Entries at this level or deeper start collapsed, unless expanded keys say otherwise. */
    collapseBelowLevel?: number | undefined;
}
/**
 * Which entries with children are expanded: the controlled keys; else the reader's own toggles over
 * the default keys or, without them, over `collapseBelowLevel` (every entry when it is not set).
 */
export declare function useOutlineExpansion(parents: readonly OutlineEntry[], { expandedKeys, defaultExpandedKeys, onExpandedChange, collapseBelowLevel, }: OutlineExpansionOptions): {
    isExpanded: ({ heading }: OutlineEntry) => boolean;
    setExpanded: (entry: OutlineEntry, next: boolean) => void;
};
//# sourceMappingURL=use-outline-expansion.d.ts.map