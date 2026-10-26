import { type MouseEvent, type RefObject } from 'react';
import type { MenuEntry } from '../menu/menu.js';
import { type PdfPagePoint, type PdfSelection } from './page-geometry.js';
import type { PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { LoadedPdf } from './use-pdf-document.js';
export interface UsePdfContextMenuOptions<V extends PdfViewport = PdfViewport, C extends PdfTextContent = PdfTextContent> {
    loaded: LoadedPdf<V, C> | null;
    /** CSS pixels per point. */
    scale: number;
    scrollerRef: RefObject<HTMLElement | null>;
    elements: RefObject<ReadonlyMap<number, HTMLElement>>;
    getSelectionMenuItems?: ((selection: PdfSelection<V>) => readonly MenuEntry[]) | undefined;
    getPageMenuItems?: ((target: PdfPagePoint<V>) => readonly MenuEntry[]) | undefined;
}
/**
 * The document's context menu: a secondary click never opens the browser's menu over the pages.
 * Over a selection inside the viewer it offers Copy and the caller's selection entries; elsewhere on
 * a page, the caller's page entries; with no entries, nothing opens.
 */
export declare function usePdfContextMenu<V extends PdfViewport, C extends PdfTextContent>(options: UsePdfContextMenuOptions<V, C>): {
    controller: import("../context-menu/menu-controller.js").MenuController;
    onContextMenu: (event: MouseEvent<HTMLElement>) => void;
};
//# sourceMappingURL=use-pdf-context-menu.d.ts.map