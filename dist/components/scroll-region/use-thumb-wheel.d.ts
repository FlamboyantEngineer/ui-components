import { type RefObject } from 'react';
interface ThumbWheelOptions {
    /** The viewport the thumb scrolls. */
    viewport: RefObject<HTMLElement | null>;
    /** Visible length of the viewport, for wheel deltas given in pages. */
    page: number;
    /** The viewport is right to left. */
    rtl: boolean;
}
/**
 * The wheel over a thumb scrolls its viewport. React's wheel listeners are passive, so a native one
 * keeps the page from scrolling too while the viewport can still move that way; at the viewport's
 * edge the wheel scrolls the page, as a native scrollbar's does.
 */
export declare function useThumbWheel(thumb: RefObject<HTMLElement | null>, { viewport, page, rtl }: ThumbWheelOptions): void;
export {};
//# sourceMappingURL=use-thumb-wheel.d.ts.map