import { type KeyboardEvent, type RefObject } from 'react';
import { type PdfZoom } from './pdf-zoom.js';
import type { PdfPagesController } from './use-pdf-pages.js';
import type { PdfZoomState } from './use-pdf-zoom.js';
export interface UsePdfKeyboardOptions {
    isReady: boolean;
    zoom: Pick<PdfZoomState, 'zoom' | 'percent' | 'setZoom'>;
    /** The zoom Ctrl + 0 returns to. */
    defaultZoom: PdfZoom;
    pages: Pick<PdfPagesController, 'currentPage' | 'scrollToPage'>;
    pageCount: number;
    /** The viewer's own find field, which Ctrl + F focuses; empty while the caller draws the find. */
    findFieldRef: RefObject<HTMLInputElement | null>;
}
export interface PdfKeyboard {
    /** Shortcuts anywhere in the viewer and its toolbar. */
    onViewerKeyDown(event: KeyboardEvent<HTMLElement>): void;
    /** Page keys in the page scroller. */
    onScrollerKeyDown(event: KeyboardEvent<HTMLElement>): void;
}
type Shortcut = 'find' | 'zoom-in' | 'zoom-out' | 'zoom-reset';
/** The viewer shortcut a key pressed with Ctrl or Command stands for. */
export declare function readShortcut(key: string): Shortcut | null;
/** The page a page key leads to, or `null` when the key keeps its native scrolling. */
export declare function readPageKey(key: string, { currentPage, pageCount, isPageFit, }: {
    currentPage: number;
    pageCount: number;
    isPageFit: boolean;
}): number | null;
/**
 * The viewer's keyboard: Ctrl or Command with F focuses the find field, with + and - steps the zoom
 * and with 0 returns to the opening zoom, instead of the browser's own. In the page scroller, Home
 * and End go to the first and last page, and Page Up and Page Down turn pages that fit the view.
 */
export declare function usePdfKeyboard(options: UsePdfKeyboardOptions): PdfKeyboard;
export {};
//# sourceMappingURL=use-pdf-keyboard.d.ts.map