import type { Key } from '../../core/props.js';
/** A file a file field holds: a reference to a file the owner has stored, not its bytes. */
export interface FileFieldItem {
    /** Unique among the field's files. */
    id: Key;
    name: string;
    /** In bytes. */
    size?: number | undefined;
    /** The MIME type, which picks the file's glyph. */
    type?: string | undefined;
    /** A thumbnail of the file. */
    previewUrl?: string | undefined;
    /** Where the file downloads from; the file then offers a download link. */
    downloadUrl?: string | undefined;
}
/** The files an edit added to the committed files, and the committed files it removed. */
export interface FileFieldChanges {
    added: ReadonlySet<Key>;
    removed: readonly FileFieldItem[];
}
/** Compares the value with the committed value by file id. */
export declare function compareFileItems(value: readonly FileFieldItem[], committed: readonly FileFieldItem[]): FileFieldChanges;
/**
 * The value with a removed committed file put back before the first file that follows it in the
 * committed order, or at the end.
 */
export declare function restoreFileItem(value: readonly FileFieldItem[], committed: readonly FileFieldItem[], item: FileFieldItem): FileFieldItem[];
//# sourceMappingURL=file-field-changes.d.ts.map