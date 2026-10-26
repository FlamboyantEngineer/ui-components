import type { PdfPasswordRequest } from './use-pdf-document.js';
export interface PdfViewerPasswordProps {
    request: PdfPasswordRequest;
}
/**
 * Asks for the password of a protected document. A password the engine turns down stays in the
 * field, marked incorrect until it is changed.
 */
export declare function PdfViewerPassword({ request }: PdfViewerPasswordProps): import("react").JSX.Element;
//# sourceMappingURL=pdf-viewer-password.d.ts.map