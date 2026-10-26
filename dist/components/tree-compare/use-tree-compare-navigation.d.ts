import { type FocusEvent } from 'react';
import type { Key } from '../../core/props.js';
import type { CompareTreeNode } from '../../utils/compare-trees.js';
import { type TreeCompareRowIndex } from './tree-compare-rows.js';
export interface TreeCompareNavigationOptions<T extends CompareTreeNode> {
    index: TreeCompareRowIndex<T>;
    expandedKeys: ReadonlySet<Key>;
    setExpandedKeys: (keys: Set<Key>) => void;
}
/**
 * Reveals rows and moves focus to them: the row's ancestors expand first, then the row takes
 * focus once it has rendered. The row the reader last focused is where a step to the next or the
 * previous difference starts.
 */
export declare function useTreeCompareNavigation<T extends CompareTreeNode>(options: TreeCompareNavigationOptions<T>): {
    treeRef: import("react").RefObject<HTMLDivElement | null>;
    reveal: (key: Key) => void;
    step(step: 1 | -1): void;
    onFocus(event: FocusEvent<HTMLElement>): void;
};
//# sourceMappingURL=use-tree-compare-navigation.d.ts.map