import type { RefObject } from 'react';
import type { PdfSearchState } from './use-pdf-search.js';
export interface PdfViewerSearchProps {
    search: PdfSearchState;
    /** The find field's input, which Ctrl + F focuses. */
    fieldRef: RefObject<HTMLInputElement | null>;
}
/** The viewer's find row, a Find Bar: the find box, the result count, the match buttons and the options. */
export declare function PdfViewerSearch({ search, fieldRef }: PdfViewerSearchProps): import("react").JSX.Element;
//# sourceMappingURL=pdf-viewer-search.d.ts.map