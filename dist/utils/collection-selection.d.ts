import type { Key, Selection } from '../core/props.js';
import type { SelectionProps } from '../core/events.js';
/** Restores the caller's key types after a primitive changes selection. */
export declare function fromCollectionSelection(keys: Selection): Selection;
export declare function toCollectionSelection(keys: Iterable<Key> | 'all'): Selection;
export declare function toCollectionSelection(keys: undefined): undefined;
export declare function toCollectionSelection(keys: Iterable<Key> | 'all' | undefined): Selection | undefined;
/** Adapts controlled, initial and disabled selections at a collection boundary. */
export declare function toCollectionSelectionProps({ selectedKeys, defaultSelectedKeys, disabledKeys, onSelectionChange, }: Pick<SelectionProps, 'selectedKeys' | 'defaultSelectedKeys' | 'disabledKeys' | 'onSelectionChange'>): {
    selectedKeys: Selection | undefined;
    defaultSelectedKeys: Selection | undefined;
    disabledKeys: string[] | undefined;
    onSelectionChange: ((keys: Selection) => void) | undefined;
};
//# sourceMappingURL=collection-selection.d.ts.map