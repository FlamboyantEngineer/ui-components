import type { ReactNode } from 'react';
import type { Key } from '../../core/props.js';
/** One file a media viewer shows: an image it draws itself, or another file the caller renders. */
export interface MediaViewerItem {
    /** Unique among the viewer's items. */
    id: Key;
    /** The image's URL, or the file's for the caller's `renderItem`. */
    src: string;
    /** The title while the item shows, and its thumbnail's name. */
    name: string;
    /** The MIME type. Images (`image/*`, or no type) draw built in; other files go to `renderItem`. */
    type?: string | undefined;
    /** The image's text alternative. Defaults to `name`. */
    alt?: string | undefined;
    /** Describes the item under the title. */
    caption?: ReactNode;
    /** A smaller image for the thumbnail strip. Defaults to `src` for an image. */
    thumbnailUrl?: string | undefined;
    /** Where the file downloads from; the viewer then offers a Download link. */
    downloadUrl?: string | undefined;
}
export declare const mediaViewerHooks: import("../../core/hooks.js").ComponentHooks<"canvas" | "image" | "rotate" | "download" | "previous" | "next" | "zoom" | "thumbnails" | "content" | "fallback" | "viewport" | "thumbnail" | "stage" | "fallback-icon" | "counter" | "thumbnail-image" | "thumbnail-icon">;
/** Whether the viewer draws the item itself, as an image. */
export declare function isImageItem(item: MediaViewerItem): boolean;
export interface MediaHeaderActionsProps {
    item: MediaViewerItem;
    position: number;
    count: number;
    zoom: number;
    onZoomChange: (zoom: number) => void;
    onRotate: () => void;
}
/** The header's position, zoom and rotate controls for an image, and the Download link. */
export declare function MediaHeaderActions(props: MediaHeaderActionsProps): import("react").JSX.Element;
/** The thumbnail strip: one button per item, the current one marked, each showing that item. */
export declare function MediaThumbnails({ items, current, onSelect, }: {
    items: readonly MediaViewerItem[];
    current: Key;
    onSelect: (key: Key) => void;
}): import("react").JSX.Element;
//# sourceMappingURL=media-viewer-parts.d.ts.map