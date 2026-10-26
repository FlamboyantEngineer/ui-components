import { type ReactNode, type Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import { type FileRejection, type FileRules } from './file-rules.js';
import { type FileUploadItem } from './file-upload-files.js';
/** `button` is one command among others; `dropzone` is a drop target that also offers Browse. */
export type FileUploadVariant = 'button' | 'dropzone';
export interface FileUploadProps extends BaseProps, FileRules, Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby' | 'aria-describedby'> {
    /** The command's text: the button label, or the drop zone's title. */
    label: string;
    /** Takes several files at once from the chooser and a drop. */
    allowsMultiple?: boolean | undefined;
    /** The chooser picks a folder, and a dropped folder is read for its files; implies several files. */
    acceptDirectory?: boolean | undefined;
    /** Help below the command. Defaults to the accepted types and the size and count limits. */
    description?: ReactNode;
    /** Defaults to `button`. */
    variant?: FileUploadVariant | undefined;
    /** Receives the chosen or dropped files that pass the rules. */
    onSelect: (files: File[]) => void;
    /** Receives the chosen or dropped files that were refused, and why. */
    onReject?: ((rejections: FileRejection[]) => void) | undefined;
    isDisabled?: boolean | undefined;
    /** Files to list below the command, with their upload progress or error. */
    files?: readonly FileUploadItem[] | undefined;
    /** Shows a remove button on each listed file. */
    onRemove?: ((id: Key) => void) | undefined;
    /** Submits the listed files' `file`s with a form under this name. */
    name?: string | undefined;
    /** A form submit is refused while no file is listed. */
    isRequired?: boolean | undefined;
    /** Shows `errorMessage` and marks the upload invalid. */
    isInvalid?: boolean | undefined;
    /** Why the upload is invalid, shown while `isInvalid`. */
    errorMessage?: ReactNode;
    /** Lists the files without the command and remove buttons, keeping their previews and actions. */
    isReadOnly?: boolean | undefined;
    /** The button that opens the chooser (the drop zone's Browse button), for an owner that focuses it. */
    commandRef?: Ref<HTMLButtonElement> | undefined;
    /** Trailing actions of a listed file, such as open or download links. */
    renderFileActions?: ((file: FileUploadItem) => ReactNode) | undefined;
    /** Replaces the thumbnail of a listed file, such as with an audio or video player; nothing keeps it. */
    renderFilePreview?: ((file: FileUploadItem) => ReactNode) | undefined;
}
/**
 * Chooses files or folders from the system file chooser or by drag and drop, checks them against
 * the accepted types, the size and count limits and the caller's own check, and hands the accepted
 * ones to `onSelect`. Refusals are reported below the command and to `onReject`; a drag says
 * whether it would be accepted. Listed files show image thumbnails or type glyphs, the upload
 * progress and errors the host reports and the owner's actions, and can take part in a form under
 * `name`.
 */
export declare function FileUpload(props: FileUploadProps): import("react").JSX.Element;
export type { FileRejection, FileRejectionReason, FileValidator } from './file-rules.js';
export type { FileUploadChange, FileUploadItem } from './file-upload-files.js';
//# sourceMappingURL=file-upload.d.ts.map