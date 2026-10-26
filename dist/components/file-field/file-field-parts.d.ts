import type { ReactNode } from 'react';
import type { FileFieldItem } from './file-field-changes.js';
export declare const fileFieldHooks: import("../../core/hooks.js").ComponentHooks<"upload" | "download" | "removed">;
/**
 * A held file's actions: its download link, then the caller's. With neither it returns nothing, so
 * the upload draws no actions part.
 */
export declare function renderFileFieldActions(item: FileFieldItem, renderFileActions: ((file: FileFieldItem) => ReactNode) | undefined): ReactNode;
/** The committed files an edit removed, each with a button that puts it back. */
export declare function RemovedFiles({ removed, isDisabled, onRestore, }: {
    removed: readonly FileFieldItem[];
    /** The field is locked or full: removed files cannot go back. */
    isDisabled: boolean;
    onRestore: (item: FileFieldItem) => void;
}): import("react").JSX.Element[];
/** Hidden inputs that submit each held file's id under the form name; a disabled field submits none. */
export declare function FileFieldInputs({ name, value, isDisabled, }: {
    name: string;
    value: readonly FileFieldItem[];
    isDisabled: boolean;
}): import("react").JSX.Element[];
//# sourceMappingURL=file-field-parts.d.ts.map