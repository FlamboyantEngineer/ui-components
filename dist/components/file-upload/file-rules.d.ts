/** Why an offered file was refused. */
export type FileRejectionReason = 'type' | 'size' | 'min-size' | 'count' | 'invalid';
/** An offered file the upload refused, and why. */
export interface FileRejection {
    file: File;
    reason: FileRejectionReason;
    /** The caller's message, for a file its `validate` refused. */
    message?: string | undefined;
}
/**
 * The caller's check of one offered file, given the files of the same offer accepted before it:
 * a message refuses the file. It may answer later, as a promise.
 */
export type FileValidator = (file: File, accepted: readonly File[]) => string | null | undefined | Promise<string | null | undefined>;
export interface FileRules {
    /** Extensions (`.pdf`), MIME types (`image/png`) or MIME families (`image/*`). Any type without. */
    acceptedFileTypes?: readonly string[] | undefined;
    /** The largest accepted file, in bytes. No limit without. */
    maxSize?: number | undefined;
    /** The smallest accepted file, in bytes. No limit without. */
    minSize?: number | undefined;
    /** The most files the upload holds, counting the listed ones. No limit without. */
    maxFiles?: number | undefined;
    /** The caller's check of each file that passes the other rules. */
    validate?: FileValidator | undefined;
}
/** The accepted files of an offer and the refusals, in the order they were offered. */
export interface FilePartition {
    accepted: File[];
    rejections: FileRejection[];
}
/** A dragged item as the browser reports it before the drop: its kind and MIME type only. */
export interface DraggedItem {
    kind: string;
    type: string;
}
/**
 * Sorts offered files into the accepted ones and the refusals, keeping their order: a file must
 * match the types, fit the size limits, pass `validate` and fit within `maxFiles`, where `held`
 * files are already listed. The result is immediate unless `validate` answers with a promise.
 */
export declare function partitionFiles(files: readonly File[], rules: FileRules, held?: number): FilePartition | Promise<FilePartition>;
/**
 * Whether dragged items would pass the rules a drag can check: the count against `maxFiles`, and
 * each MIME type against the MIME rules. Extensions, sizes and `validate` wait for the drop, so a
 * file they could refuse counts as passing.
 */
export declare function canAcceptDrag(items: readonly DraggedItem[], rules: FileRules, held?: number): boolean;
//# sourceMappingURL=file-rules.d.ts.map