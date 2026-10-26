import type { PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { PdfViewerProps } from './pdf-viewer.js';
import type { PdfCommands } from './pdf-viewer-toolbar.js';
import { type LoadedPdf } from './use-pdf-document.js';
/**
 * Everything a viewer holds: the document, its pages, zoom, rotation, find, navigation, links,
 * context menu, keyboard and commands, wired together from the viewer's props.
 */
export declare function usePdfViewer<V extends PdfViewport, C extends PdfTextContent>(props: PdfViewerProps<V, C>): {
    label: string;
    pdf: import("./use-pdf-document.js").PdfDocumentResult<V, C>;
    view: LoadedPdf<V, C> | null;
    isReady: boolean;
    pageCount: number;
    pages: import("./use-pdf-pages.js").PdfPagesController;
    zoom: import("./use-pdf-zoom.js").PdfZoomState;
    search: import("./use-pdf-search.js").PdfSearchState;
    links: import("./use-pdf-links.js").PdfLinks;
    menu: {
        controller: import("../context-menu/menu-controller.js").MenuController;
        onContextMenu: (event: import("react").MouseEvent<HTMLElement>) => void;
    };
    keyboard: import("./use-pdf-keyboard.js").PdfKeyboard;
    commands: PdfCommands;
    sidebar: {
        isOpen: boolean;
        setOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    };
    refs: {
        scrollerRef: import("react").RefObject<HTMLDivElement | null>;
        pagesRef: import("react").RefObject<HTMLDivElement | null>;
        findFieldRef: import("react").RefObject<HTMLInputElement | null>;
    };
};
//# sourceMappingURL=use-pdf-viewer.d.ts.map