import type { Key } from '../../core/props.js';
/** The version a dialog is open for: its key, the name it shows and its current name. */
export interface VersionDialogTarget {
    key: Key;
    /** The version's name, or its time when it has none. */
    title: string;
    /** The version's own name; empty for a version without one. */
    label: string;
}
interface DialogProps<Action> {
    /** The version the dialog is for; it stays set while the dialog closes. */
    target: VersionDialogTarget | null;
    isOpen: boolean;
    onClose: () => void;
    onAction: Action;
}
/** Confirms bringing a version back as the current one before `onAction` restores it. */
export declare function RestoreVersionDialog({ target, isOpen, onClose, onAction, }: DialogProps<(key: Key) => void | Promise<unknown>>): import("react").JSX.Element;
/**
 * Names a version, or renames it. Saving a changed name (trimmed; empty removes the name) calls
 * `onAction` and closes the dialog; saving the same name only closes it. Enter in the field saves
 * through the dialog's action, so it is pending until a returned promise settles and shows a failure.
 */
export declare function RenameVersionDialog({ target, isOpen, onClose, onAction, }: DialogProps<(key: Key, label: string) => void | Promise<unknown>>): import("react").JSX.Element;
export {};
//# sourceMappingURL=version-dialogs.d.ts.map