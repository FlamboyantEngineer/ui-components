import { type RefObject } from 'react';
import type { Key } from '../../core/props.js';
import { type FolderItem, type FolderNode } from './folder-model.js';
/** `single` selects one folder; `multiple` lets the reader select several. */
export type FolderSelectionMode = 'single' | 'multiple';
/**
 * What `onSelectionChange` receives: the set of selected folders in multiple selection, as React
 * Aria reports it, else the selected folder (`null`: none).
 */
export type FolderSelectionHandler<M extends FolderSelectionMode> = [M] extends ['multiple'] ? (keys: Set<Key>) => void : (key: Key | null) => void;
export interface FolderSelectionOptions<M extends FolderSelectionMode = FolderSelectionMode> {
    /** `single` (the default) selects one folder; `multiple` lets the reader select several. */
    selectionMode?: M | undefined;
    /** The selected folder (`null`: none), controlled, in single selection. */
    selectedKey?: Key | null | undefined;
    defaultSelectedKey?: Key | null | undefined;
    /** Called with the selection after each change: the folder, or the set of folders when multiple. */
    onSelectionChange?: FolderSelectionHandler<M> | undefined;
    /** The selected folders, controlled, in multiple selection. */
    selectedKeys?: Iterable<Key> | undefined;
    defaultSelectedKeys?: Iterable<Key> | undefined;
}
export interface FolderExpansion {
    expandedKeys: Key[];
    onExpandedChange: (keys: Set<Key>) => void;
    /** Expands these rows, so a row below them is in view. */
    reveal: (keys: readonly Key[]) => void;
}
/** The selected folders, in single or multiple selection, controlled or held here. */
export declare function useFolderSelection<M extends FolderSelectionMode>(options: FolderSelectionOptions<M>): [Key[], (keys: Key[]) => void];
/**
 * Every row with children is expanded unless the reader collapsed it, so a folder created deep in
 * the tree is in view as soon as it appears. A folder whose subfolders are not loaded yet starts
 * collapsed; expanding it calls `onOpen`, which loads them.
 */
export declare function useFolderExpansion<T extends FolderItem>(nodes: readonly FolderNode<T>[], onOpen: (key: Key) => void): FolderExpansion;
/**
 * Moves focus to the row of `request.key` once that row is rendered: after an edit or a delete,
 * the field or row that held focus is gone. The tree renders new rows after its owner, and the
 * owner may update its folders later still, so the request waits for the row to appear.
 */
export declare function useRowFocus(regionRef: RefObject<HTMLElement | null>, request: {
    key: Key;
} | null, done: () => void): void;
//# sourceMappingURL=use-folder-tree.d.ts.map