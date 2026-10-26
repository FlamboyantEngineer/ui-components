import type { KeyboardEvent, ReactNode, RefObject } from 'react';
import type { PdfSearchControls, PdfSearchState } from './use-pdf-search.js';
import type { PdfZoomState } from './use-pdf-zoom.js';
/** The document commands of the toolbar's menu. */
export interface PdfCommands {
    rotate(degrees: 90 | -90): void;
    print(): void;
    download(): void;
}
export interface PdfViewerToolbarProps {
    label: string;
    isReady: boolean;
    zoom: PdfZoomState;
    pageCount: number;
    currentPage: number;
    onPageChange(pageIndex: number): void;
    search: PdfSearchState;
    /** The viewer's own find field. */
    findFieldRef: RefObject<HTMLInputElement | null>;
    sidebar: {
        isOpen: boolean;
        setOpen(isOpen: boolean): void;
    };
    commands: PdfCommands;
    /** The viewer's keyboard shortcuts. */
    onKeyDown(event: KeyboardEvent<HTMLElement>): void;
    actions?: ReactNode;
    leadingActions?: ReactNode;
    /** Draws the find controls in place of the viewer's own. */
    renderSearch?: ((search: PdfSearchControls) => ReactNode) | undefined;
}
/**
 * The caller's leading actions, the sidebar toggle, zoom with its fit modes, page navigation, find,
 * the document commands and the caller's actions, in one toolbar.
 */
export declare function PdfViewerToolbar({ label, isReady, zoom, search, findFieldRef, sidebar, commands, onKeyDown, actions, leadingActions, renderSearch, ...page }: PdfViewerToolbarProps): import("react").JSX.Element;
//# sourceMappingURL=pdf-viewer-toolbar.d.ts.map