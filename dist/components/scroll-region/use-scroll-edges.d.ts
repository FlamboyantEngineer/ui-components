import { type RefObject } from 'react';
/** How far the content reaches past each edge of the viewport, in whole pixels. */
export interface ScrollEdges {
    /** Scrolled past the top. */
    yStart: number;
    /** Left below the bottom. */
    yEnd: number;
    /** Scrolled past the inline start (the left edge, or the right edge right to left). */
    xStart: number;
    /** Left beyond the inline end. */
    xEnd: number;
}
export interface ScrollEdgesOptions {
    /** Measure at all; a region that scrolls on no axis has no edges. */
    enabled: boolean;
    /** Keep the viewport at the bottom while the reader is there. */
    stickToBottom: boolean;
    /** Called when scrolling reaches the top. */
    onTopReached?: (() => void) | undefined;
    /** Called when scrolling reaches the bottom. */
    onBottomReached?: (() => void) | undefined;
}
/** The distances from the viewport's edges to the content's, in whole pixels. */
export declare function readScrollEdges(element: HTMLElement): ScrollEdges;
/**
 * The viewport's edge distances, read when it scrolls, resizes or its children change (without
 * waiting for an animation frame, so scrolling and resizing schedule none). Scrolling to the top or
 * bottom calls the edge callbacks; with `stickToBottom` a viewport scrolled to the bottom follows
 * new content until the reader scrolls up.
 */
export declare function useScrollEdges(viewport: RefObject<HTMLDivElement | null>, { enabled, stickToBottom, onTopReached, onBottomReached }: ScrollEdgesOptions): {
    edges: ScrollEdges;
    onScroll: () => void;
};
//# sourceMappingURL=use-scroll-edges.d.ts.map