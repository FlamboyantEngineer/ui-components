import type { ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import { type FieldInputProps } from '../field/field.js';
import { type FileUploadItem, type FileUploadVariant } from '../file-upload/file-upload.js';
import { type FileFieldItem } from './file-field-changes.js';
export type { FileFieldItem } from './file-field-changes.js';
export interface FileFieldProps extends FieldInputProps<FileFieldItem[]> {
    /** Receives the accepted files; the owner uploads them and adds the stored files to the value. */
    onSelect: (files: File[]) => void;
    /** The owner's uploads in flight or failed, listed after the value. */
    uploads?: readonly FileUploadItem[] | undefined;
    /** Removes an upload row: cancels the upload or dismisses its error. */
    onUploadRemove?: ((id: Key) => void) | undefined;
    /** Takes several files; without it the field holds one. */
    allowsMultiple?: boolean | undefined;
    /** Defaults to `button`. */
    variant?: FileUploadVariant | undefined;
    /** Extensions (`.pdf`), MIME types (`image/png`) or MIME families (`image/*`). Any type without. */
    acceptedFileTypes?: readonly string[] | undefined;
    /** The largest accepted file, in bytes. */
    maxSize?: number | undefined;
    /** The most files the field holds, counting the value and the uploads. Defaults to 1 without `allowsMultiple`. */
    maxFiles?: number | undefined;
    /** Trailing actions of a held file, such as an open link, after its download link. */
    renderFileActions?: ((file: FileFieldItem) => ReactNode) | undefined;
    /** Replaces the thumbnail of a held file, such as with an audio or video player. */
    renderFilePreview?: ((file: FileFieldItem) => ReactNode) | undefined;
}
/**
 * A field whose value is a list of stored files: the library's `FileUpload` chooses and checks new
 * files and hands them to the owner, who uploads them, reports the uploads in progress and adds the
 * stored files to the value. Each held file shows its preview or type glyph, its size, a download
 * link and a remove button; while the field is dirty, added files are marked and removed ones can
 * be put back. Running uploads make the field pending. It has the field base's label, validation,
 * dirty state, restore, undo and menu.
 */
export declare function FileField({ onSelect, uploads, onUploadRemove, allowsMultiple, variant, acceptedFileTypes, maxSize, maxFiles, renderFileActions, renderFilePreview, ...props }: FileFieldProps): import("react").JSX.Element;
//# sourceMappingURL=file-field.d.ts.map