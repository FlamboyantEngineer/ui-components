import { type RefObject } from 'react';
import type { Key } from '../../core/props.js';
import { type TabsShared, type TabListModel } from './tab-actions.js';
/** Checks a new tab name: a message says why it is refused; nothing accepts it. */
export type TabNameValidate = (key: Key, name: string) => string | null | undefined;
/** A list's in-place renaming, shared with its tabs. */
export interface TabRename {
    /** The tab being renamed, or `null`. */
    editingKey: Key | null;
    /** Starts renaming an enabled tab. */
    start: (key: Key) => void;
    /** Closes the field of the tab `key`. */
    end: (key: Key) => void;
    onRename: (key: Key, name: string) => void;
    validate: TabNameValidate | undefined;
}
interface TabRenameOptions {
    shared: TabsShared;
    onRename: ((key: Key, name: string) => void) | undefined;
    validateName: TabNameValidate | undefined;
}
export interface TabRenameOverlayProps {
    rename: TabRename | null;
    state: TabListModel;
    listRef: RefObject<HTMLElement | null>;
}
/** A list's renaming while the owner takes renames. */
export declare function createTabRename({ shared, onRename, validateName }: TabRenameOptions): TabRename | null;
/** The name field of the list's tab being renamed, if any. */
export declare function TabRenameOverlay({ rename, state, listRef }: TabRenameOverlayProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=tab-rename.d.ts.map