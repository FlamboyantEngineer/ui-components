import type { PdfLinkService } from './pdf-engine.js';
export interface LinkServiceActions {
    /** Sends the reader to a destination of the document. */
    followDestination(destination: unknown): void;
    /** Sends the reader to a page, zero-based. */
    goToPage(pageIndex: number): void;
    /** The page the reader is on and the number of pages. */
    readPosition(): {
        currentPage: number;
        pageCount: number;
    };
}
/** The page a named navigation action of the document leads to, or `null` for another action. */
export declare function resolveNamedAction(action: string, { currentPage, pageCount }: {
    currentPage: number;
    pageCount: number;
}): number | null;
/**
 * What the engine's annotation layer calls when it draws and follows links. Links to the web open
 * in a new tab, so the reader never leaves the screen the viewer is on; links inside the document
 * move the viewer instead of the browser.
 */
export declare function createLinkService(actions: LinkServiceActions): PdfLinkService;
//# sourceMappingURL=pdf-link-service.d.ts.map