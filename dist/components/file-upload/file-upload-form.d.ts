import { type ReactNode, type RefObject } from 'react';
import { type FileUploadItem } from './file-upload-files.js';
export interface FileFormInputProps {
    /** The form field name the files are submitted under. */
    name: string | undefined;
    /** The upload is required and lists no file, so a form submit is refused. */
    isRequired: boolean;
    /** The upload is disabled: the input is left out of the form's data and its validation. */
    isDisabled: boolean;
    /** The chosen files of the listed items, submitted with the form. */
    files: readonly File[];
    /** A form submit found the upload required and empty. */
    onInvalid: () => void;
}
export interface FileFormOptions {
    name?: string | undefined;
    isRequired?: boolean | undefined;
    isInvalid?: boolean | undefined;
    isDisabled?: boolean | undefined;
    isReadOnly?: boolean | undefined;
    errorMessage?: ReactNode;
    files: readonly FileUploadItem[];
    /** The command focused when a form submit finds the upload required and empty. */
    commandRef: RefObject<HTMLButtonElement | null>;
}
/** An upload's part in a form: its hidden input, its error message and whether it is invalid. */
export interface FileForm {
    input: ReactNode;
    /** The error message element, if any. */
    message: ReactNode;
    /** Whether there is an error message, which `errorId` names. */
    error: boolean;
    errorId: string;
    isInvalid: boolean;
}
/**
 * The hidden file input that takes part in a form: it holds the listed files, so a native submit
 * or `FormData` carries them under `name`, and it is required when the upload is. A browser that
 * cannot set an input's files (no `DataTransfer`) submits none. The files are set again only when
 * they change, or when a form reset emptied the input, not on every render.
 */
export declare function FileFormInput({ name, isRequired, isDisabled, files, onInvalid, }: FileFormInputProps): import("react").JSX.Element;
/**
 * Lets an upload take part in a form: a hidden input submits the listed files under `name` and
 * refuses a submit while a required upload lists none, which shows the provider's `valueRequired`
 * message and focuses the command. A disabled upload submits nothing and, like a read-only one,
 * refuses no submit. The caller's `errorMessage` shows while `isInvalid`.
 */
export declare function useFileForm(options: FileFormOptions): FileForm;
//# sourceMappingURL=file-upload-form.d.ts.map