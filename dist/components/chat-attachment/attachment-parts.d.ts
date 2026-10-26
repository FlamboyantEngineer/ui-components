import type { GlyphName } from '../../core/glyphs.js';
export declare const chatAttachmentHooks: import("../../core/hooks.js").ComponentHooks<"progress" | "name" | "error" | "download" | "remove" | "size" | "icon" | "preview" | "thumbnail">;
/** The image to show, until it fails to load: a broken image falls back to the file chip. */
export declare function useThumbnail(src: string | undefined): {
    src: string | undefined;
    onError: () => void;
};
export interface AttachmentThumbnailProps {
    src: string;
    name: string;
    onPreview: (() => void) | undefined;
    onError: () => void;
}
/**
 * An image attachment's thumbnail: a button that opens its preview, named for viewing the file,
 * else the image itself, named by the file name, since no name shows beside it.
 */
export declare function AttachmentThumbnail({ src, name, onPreview, onError }: AttachmentThumbnailProps): import("react").JSX.Element;
export interface AttachmentChipProps {
    glyph: GlyphName;
    name: string;
    size: number | undefined;
    locale: string;
}
/** A file attachment's chip: its type glyph (decorative), its name and its size. */
export declare function AttachmentChip({ glyph, name, size, locale }: AttachmentChipProps): import("react").JSX.Element;
/** The upload's progress, named for the file: measured from `progress` (0 to 1), else indeterminate. */
export declare function AttachmentProgress({ name, progress }: {
    name: string;
    progress?: number;
}): import("react").JSX.Element;
/** A link that downloads the file under its name. */
export declare function AttachmentDownload({ href, name }: {
    href: string;
    name: string;
}): import("react").JSX.Element;
//# sourceMappingURL=attachment-parts.d.ts.map