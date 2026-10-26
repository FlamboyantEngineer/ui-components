import { type ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import type { RemovalFocus } from '../../utils/use-removal-focus.js';
/** How a listed file differs from a list the owner compares against: `added` by an edit. */
export type FileUploadChange = 'added';
/** A file the upload lists. The host performs the upload and reports its progress and error. */
export interface FileUploadItem {
    /** Unique among the listed files. */
    id: Key;
    name: string;
    /** In bytes. */
    size?: number | undefined;
    /** Percent uploaded, from 0 to 100, while the host uploads the file. */
    progress?: number | undefined;
    /** Why the upload failed. */
    error?: string | undefined;
    /** The chosen file: an image shows as a thumbnail, and a form submits it under the upload's `name`. */
    file?: File | undefined;
    /** A thumbnail for a file that has no `file` here, such as one uploaded earlier. */
    previewUrl?: string | undefined;
    /** The MIME type, for a file that has no `file` here; it picks the glyph of a file without a thumbnail. */
    type?: string | undefined;
    /** Marks a file an edit added to a list the owner compares against. */
    change?: FileUploadChange | undefined;
}
/** What each listed file draws besides its name, size, progress and error. */
export interface FileUploadRowOptions {
    locale: string;
    onRemove: ((id: Key) => void) | undefined;
    removalFocus: RemovalFocus;
    /** Disables the remove buttons. */
    isDisabled: boolean;
    renderFileActions: ((file: FileUploadItem) => ReactNode) | undefined;
    renderFilePreview: ((file: FileUploadItem) => ReactNode) | undefined;
}
export interface FileUploadFilesProps extends FileUploadRowOptions {
    /** Names the list. */
    label: string;
    files: readonly FileUploadItem[];
}
export declare const fileUploadHooks: import("../../core/hooks.js").ComponentHooks<"label" | "error" | "file" | "browse" | "icon" | "description" | "files" | "dropzone" | "rejections" | "file-preview" | "file-media" | "file-icon" | "file-name" | "file-size" | "file-progress" | "file-error" | "file-actions" | "file-remove">;
/** The listed files, each with its preview, size, upload progress or error, actions and remove button. */
export declare function FileUploadFiles({ label, files, ...options }: FileUploadFilesProps): import("react").JSX.Element;
//# sourceMappingURL=file-upload-files.d.ts.map