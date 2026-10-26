import type { Key } from '../../core/props.js';
import { type FolderItem } from './folder-model.js';
/** A folder being named: a new one under `key`, or the folder `key` being renamed. */
export interface FolderEdit {
    kind: 'create' | 'rename';
    /** The renamed folder, or the new folder's parent (`null`: at the top). */
    key: Key | null;
    /** The name field's starting text: the current name, or the text of a refused attempt. */
    name: string;
    /** The folder's name before the edit; empty for a new folder. */
    original: string;
    isPending: boolean;
}
export interface FolderCallbacks<T extends FolderItem> {
    /** Creates a folder. It may resolve to the new folder's key, which is then selected. */
    onCreate?: ((folder: {
        name: string;
        parentKey: Key | null;
    }) => unknown) | undefined;
    onRename?: ((folder: {
        key: Key;
        name: string;
    }) => unknown) | undefined;
    /** Deletes a folder; deleting several selected folders calls it for each, one after another. */
    onDelete?: ((key: Key) => unknown) | undefined;
    /** Why a folder cannot be deleted, or nothing when it can. */
    getDeleteBlockedReason?: ((folder: T) => string | null | undefined) | undefined;
}
export interface FolderActionsOptions<T extends FolderItem> extends FolderCallbacks<T> {
    folders: readonly T[];
    /** Selects a folder (`null`: no folder) after a create or delete. */
    select: (key: Key | null) => void;
    /** Called when an edit or delete ends, with the folder whose row should take focus. */
    onSettle: (key: Key | null) => void;
}
export interface FolderActions<T extends FolderItem> {
    edit: FolderEdit | null;
    isDeleting: boolean;
    /** The reason of the last refused action. */
    message: string | null;
    startCreate(parentKey: Key | null): void;
    startRename(folder: T): void;
    /** Ends the edit with `name`: a blank or unchanged name abandons it. */
    submit(name: string): Promise<void>;
    cancel(): void;
    /** Deletes the folders, in order, stopping at the first refusal. */
    remove(folders: readonly T[]): Promise<void>;
}
/**
 * The folder manager's edits and deletes. Each runs the caller's callback, which may return a
 * promise: while it is pending the edit ignores further submits, and a refusal keeps the edit open
 * with the typed name and shows the error's message.
 */
export declare function useFolderActions<T extends FolderItem>({ folders, onCreate, onRename, onDelete, getDeleteBlockedReason, select, onSettle, }: FolderActionsOptions<T>): FolderActions<T>;
//# sourceMappingURL=use-folder-actions.d.ts.map