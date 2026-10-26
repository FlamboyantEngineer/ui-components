import type { Ref } from 'react';
import type { FolderEdit } from './use-folder-actions.js';
export interface FolderNameInputProps {
    edit: FolderEdit;
    /** The message that describes the field while an attempt was refused. */
    messageId: string | undefined;
    inputRef: Ref<HTMLInputElement>;
    onBlur: (name: string) => void;
}
/** A toolbar action: the button is drawn only when the action is offered. */
export interface FolderToolAction {
    isOffered: boolean;
    isDisabled: boolean;
    /** Why the action is unavailable, shown as the button's tooltip. */
    reason?: string | null | undefined;
    onPress: () => void;
}
export interface FolderToolbarProps {
    create: FolderToolAction;
    rename: FolderToolAction;
    remove: FolderToolAction;
}
export declare const folderManagerHooks: import("../../core/hooks.js").ComponentHooks<"filter" | "message" | "toolbar" | "tree" | "load-error" | "name-input">;
/**
 * The name field of a folder being created or renamed. The folder manager reads its keys: Enter
 * submits the name and Escape abandons the edit.
 */
export declare function FolderNameInput({ edit, messageId, inputRef, onBlur }: FolderNameInputProps): import("react").JSX.Element;
/** New folder, Rename and Delete, acting on the selected folder. */
export declare function FolderToolbar({ create, rename, remove }: FolderToolbarProps): import("react").JSX.Element | null;
//# sourceMappingURL=folder-manager-parts.d.ts.map