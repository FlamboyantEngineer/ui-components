import type { Key, Selection, SelectionMode } from '../../core/props.js';
export interface DiagramSelectionOptions {
    selectionMode: SelectionMode;
    selectedKeys: Iterable<Key> | 'all' | undefined;
    defaultSelectedKeys: Iterable<Key> | 'all' | undefined;
    onSelectionChange: ((keys: Selection) => void) | undefined;
    /** Every node and edge id, which `'all'` stands for. */
    allKeys: readonly Key[];
}
export interface DiagramSelection {
    selected: ReadonlySet<Key>;
    /** Selects `key` alone, or with `toggle` adds or removes it (multiple selection only). */
    select: (key: Key, toggle: boolean) => void;
    /** Selects exactly `keys`, or only the first of them in single selection. */
    replace: (keys: readonly Key[]) => void;
}
/** The selected nodes and edges, controlled or not, in the canvas's selection mode. */
export declare function useDiagramSelection(options: DiagramSelectionOptions): DiagramSelection;
//# sourceMappingURL=use-diagram-selection.d.ts.map