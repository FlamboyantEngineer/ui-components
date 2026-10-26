import { type PdfDocument, type PdfDocumentOptions, type PdfEngine, type PdfOutlineNode, type PdfPage, type PdfSource, type PdfTextContent, type PdfViewport } from './pdf-engine.js';
import type { PdfSize } from './pdf-zoom.js';
export type PdfDocumentStatus = 'loading' | 'password' | 'ready' | 'error';
/** An opened document: the engine that opened it, its pages and their text. */
export interface LoadedPdf<V extends PdfViewport = PdfViewport, C extends PdfTextContent = PdfTextContent> {
    engine: PdfEngine<V, C>;
    document: PdfDocument<V, C>;
    pages: PdfPage<V, C>[];
    /** The outline's top-level entries; empty when the document has none. */
    outline: PdfOutlineNode[];
    /** The reader's rotation of every page, in degrees clockwise. */
    rotation: number;
    /** Leaves the pages' annotations and links undrawn (UIC-PDF-VIEWER-2.5). */
    hidesAnnotations?: boolean | undefined;
    /** Each page's size at 100% zoom and the reader's rotation, in points. */
    sizes: PdfSize[];
    /** A page's text content, fetched once and shared by its text layer and the search. */
    getTextContent(pageIndex: number): Promise<C>;
    /** A page's viewport at a scale, shared by everything drawn at that scale. */
    getViewport(pageIndex: number, scale: number): V | undefined;
}
export interface UsePdfDocumentOptions<V extends PdfViewport = PdfViewport, C extends PdfTextContent = PdfTextContent> {
    source: PdfSource | null;
    loadEngine: () => Promise<PdfEngine<V, C>>;
    workerSrc?: string | undefined;
    documentOptions?: PdfDocumentOptions | undefined;
    onError?: ((error: Error) => void) | undefined;
}
/** The engine waits for the document's password. */
export interface PdfPasswordRequest {
    /** How many passwords the engine has turned down. */
    failures: number;
    /** A submitted password is being checked. */
    isChecking: boolean;
    submit(password: string): void;
}
export interface PdfDocumentResult<V extends PdfViewport = PdfViewport, C extends PdfTextContent = PdfTextContent> {
    status: PdfDocumentStatus;
    loaded: LoadedPdf<V, C> | null;
    password: PdfPasswordRequest | null;
    retry(): void;
}
/** The rotation a page shows at: its own, turned further by the reader's, in degrees. */
export declare function toPageRotation(page: Pick<PdfPage, 'rotate'>, rotation: number): number;
/**
 * Viewports at the reader's rotation. Only the applied scale is worth keeping: every part of a page
 * asks for the same one.
 */
export declare function createViewportCache<V extends PdfViewport, C extends PdfTextContent>(pages: readonly PdfPage<V, C>[], rotation: number): LoadedPdf<V, C>['getViewport'];
/**
 * Opens `source` with the injected engine and keeps it open until the source changes or the viewer
 * unmounts, when the engine's loading task (and its worker) is destroyed. A `null` source stays
 * loading. A new array is a new document; a URL, as text or a `URL`, is the same document while its
 * address is. A document that needs its password waits for it.
 */
export declare function usePdfDocument<V extends PdfViewport, C extends PdfTextContent>(options: UsePdfDocumentOptions<V, C>): PdfDocumentResult<V, C>;
//# sourceMappingURL=use-pdf-document.d.ts.map