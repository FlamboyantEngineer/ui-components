import { type RefObject } from 'react';
/**
 * The width, in pixels, of the widest of `texts` in the font of `ref`'s element, measured on a
 * canvas once per set of texts and again when the document's fonts finish loading. `null` where
 * no canvas is available.
 */
export declare function useWidestTextWidth(ref: RefObject<Element | null>, texts: readonly string[]): number | null;
//# sourceMappingURL=use-widest-text-width.d.ts.map