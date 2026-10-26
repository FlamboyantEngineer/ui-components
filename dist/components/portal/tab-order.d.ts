import { type ReactNode } from 'react';
export interface PreservedTabOrder {
    /** The ref for the portal wrapper. */
    wrapperRef: (node: HTMLDivElement | null) => void;
    /** The two guards rendered where the portal is declared. */
    placeGuards: ReactNode;
    /** The guard rendered first in the wrapper. */
    startGuard: ReactNode;
    /** The guard rendered last in the wrapper. */
    endGuard: ReactNode;
}
/**
 * Focus guards that give portalled content the tab order of the place it is declared. Tab reaches
 * the content right after what precedes that place and leaves it to what follows; Shift+Tab does
 * the reverse. Reached through the document's own order instead, the content is skipped.
 */
export declare function usePreservedTabOrder(): PreservedTabOrder;
//# sourceMappingURL=tab-order.d.ts.map