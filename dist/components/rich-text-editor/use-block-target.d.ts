import { type FocusEvent } from 'react';
/** The block a handle serves and where it sits, with the handle's own focus and drag state. */
export interface BlockTarget {
    /** The block's position in the document. */
    pos: number;
    /** The block's top edge in the surface, in pixels. */
    top: number;
    isDragging: boolean;
    setDragging: (isDragging: boolean) => void;
    onFocus: () => void;
    onBlur: (event: FocusEvent) => void;
}
/**
 * The block under the pointer, or else the block holding the selection while the document or the
 * handle has focus (or `isHeld`, as while the handle's menu is open), placed against the surface.
 */
export declare function useBlockTarget(isHeld: boolean): BlockTarget | null;
//# sourceMappingURL=use-block-target.d.ts.map