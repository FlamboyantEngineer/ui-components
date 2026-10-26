import { type ReactNode } from 'react';
import type { OpenStateProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import { type MediaViewerItem } from './media-viewer-parts.js';
export type { MediaViewerItem } from './media-viewer-parts.js';
export interface MediaViewerProps extends BaseProps, OpenStateProps {
    /** The files to page through, in order. */
    items: readonly MediaViewerItem[];
    /** The item shown, controlled. */
    selectedKey?: Key | undefined;
    /** The item shown first, uncontrolled. Defaults to the first item. */
    defaultSelectedKey?: Key | undefined;
    /** Called with the item moved to. */
    onSelectionChange?: ((key: Key) => void) | undefined;
    /** Renders a file that is not an image, such as a PDF in the library's `PdfViewer`. */
    renderItem?: ((item: MediaViewerItem) => ReactNode) | undefined;
}
/**
 * A lightbox over the page, on the library's `Modal`: it shows one file of a set at a time with its
 * name and caption, moves to the previous and next file from buttons, a thumbnail strip and the
 * arrow keys, and zooms (`ZoomControl`, `+` and `-`), turns and scrolls images. Other files, such as
 * PDFs, render through `renderItem`. Each file with a download URL offers a Download link. Escape
 * closes it.
 */
export declare function MediaViewer({ items, selectedKey, defaultSelectedKey, onSelectionChange, renderItem, className, ...rest }: MediaViewerProps): import("react").JSX.Element | null;
//# sourceMappingURL=media-viewer.d.ts.map