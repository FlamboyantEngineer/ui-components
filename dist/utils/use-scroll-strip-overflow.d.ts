import { type RefObject } from 'react';
import type { Orientation } from '../core/props.js';
/** Whether content is hidden past each edge of a scrolling strip, including a partly visible item. */
export interface ScrollStripOverflow {
    start: boolean;
    end: boolean;
}
export interface ScrollStripOptions {
    /** The strip's scrolling axis. A horizontal strip also scrolls with the vertical wheel. */
    orientation?: Orientation | undefined;
    /** Called after wheel input scrolled the strip. */
    onWheelScroll?: (() => void) | undefined;
}
export interface ScrollStripState {
    overflow: ScrollStripOverflow;
    /** Schedules a fresh measurement; call it from the strip's scroll handler and after content changes. */
    syncOverflow: () => void;
}
/**
 * Scrolls a strip to a physical `scrollLeft`. `auto` follows the stylesheet's `scroll-behavior`;
 * `instant` skips any smooth scrolling, for focus that must land at once.
 */
export declare function scrollStripTo(strip: HTMLElement, left: number, behavior: ScrollBehavior): void;
/**
 * Scrolls a horizontal strip by most of its visible width toward its `start` or `end` edge, as a
 * scroll button does. Right-to-left strips (`rtl`, from the locale) scroll with negative offsets.
 */
export declare function scrollStripPage(strip: HTMLElement, { edge, rtl }: {
    edge: 'start' | 'end';
    rtl: boolean;
}): void;
/**
 * Tracks whether a scrolling strip (a row of tabs or tools) hides content past either edge, so the
 * stylesheet can draw a fade there, and lets the vertical wheel scroll a horizontal strip. Scrolling
 * stays free: no snapping, paging or stepper buttons. Measurements coalesce to one read per animation
 * frame and resync when the strip or its children resize and when children mount or unmount. A strip
 * that mounts after the first render, or is replaced, is followed too. Right-to-left strips report
 * and scroll from their inline start.
 */
export declare function useScrollStripOverflow(stripRef: RefObject<HTMLElement | null>, { orientation, onWheelScroll }?: ScrollStripOptions): ScrollStripState;
//# sourceMappingURL=use-scroll-strip-overflow.d.ts.map