import type { GlyphName } from '../../core/glyphs.js';
/** The kinds an attachment can be: `file` is any other or unknown type. */
export type ChatAttachmentKind = 'image' | 'pdf' | 'archive' | 'text' | 'file';
/** Where an attachment's upload stands: still `uploading`, `complete`, or failed with an `error`. */
export type ChatAttachmentStatus = 'uploading' | 'complete' | 'error';
/** One file attached to a message or to the composer. The host uploads it and reports its status. */
export interface ChatAttachmentData {
    /** Unique among the attachments shown together. */
    id: string;
    /** The file name, with its extension. */
    name: string;
    /** The MIME type, such as `image/png`; empty when unknown. */
    mediaType: string;
    /** In bytes. */
    size?: number | undefined;
    /** Where the file is: an image shows from it, and a complete attachment offers it for download. */
    url?: string | undefined;
    /** A smaller image to show in place of `url`. */
    thumbnailUrl?: string | undefined;
    /** Defaults to `error` when there is an `error`, else `complete`. */
    status?: ChatAttachmentStatus | undefined;
    /** The uploaded share, from 0 to 1, while uploading; without it the progress is indeterminate. */
    progress?: number | undefined;
    /** Why the upload failed. */
    error?: string | undefined;
}
/**
 * The attachment's kind from its media type (`image/*`, `application/pdf`, archive types, `text/*`
 * and structured text), or from its name's extension when the type is empty or
 * `application/octet-stream`.
 */
export declare function getAttachmentKind(mediaType: string, name: string): ChatAttachmentKind;
/** The glyph of a kind; other files take the glyph of their media family (video, audio, file). */
export declare function getAttachmentGlyph(kind: ChatAttachmentKind, mediaType: string): GlyphName;
/** The attachment's status: as given, else `error` with an error, else `complete`. */
export declare function resolveAttachmentStatus(data: Pick<ChatAttachmentData, 'status' | 'error'>): ChatAttachmentStatus;
/** The image an attachment shows, from its thumbnail or its URL, when it is an image. */
export declare function getAttachmentImage(data: Pick<ChatAttachmentData, 'mediaType' | 'name' | 'url' | 'thumbnailUrl'>): string | undefined;
/** The URL when it is relative or uses a scheme an attachment may show, else `undefined`. */
export declare function toAttachmentUrl(url: string | undefined): string | undefined;
//# sourceMappingURL=attachment-model.d.ts.map