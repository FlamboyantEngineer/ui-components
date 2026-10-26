import { type PointerEvent } from 'react';
/**
 * When overlay scrollbars show: `auto` while an axis overflows, `always` on every scrolling axis
 * even when the content fits, `scroll` while scrolling, `hover` while the pointer is over the region
 * or it scrolls.
 */
export type ScrollRegionScrollbarVisibility = 'auto' | 'always' | 'scroll' | 'hover';
export interface ScrollActivity {
    /** From a scroll until the hide delay passes without one. */
    isScrolling: boolean;
    /** A mouse or pen pointer is over the region. */
    isHovering: boolean;
    /** Overlay tracks show, before counting a focused or dragged thumb. */
    isScrollbarVisible: boolean;
    onScroll: () => void;
    onPointerEnter: (event: PointerEvent) => void;
    onPointerLeave: (event: PointerEvent) => void;
}
/**
 * Whether the region is scrolling or hovered, and whether its overlay scrollbars show for the
 * visibility mode. Scrolling and a pointer that left keep them shown for `hideDelay` milliseconds.
 */
export declare function useScrollActivity(visibility: ScrollRegionScrollbarVisibility, hideDelay: number): ScrollActivity;
//# sourceMappingURL=use-scroll-activity.d.ts.map