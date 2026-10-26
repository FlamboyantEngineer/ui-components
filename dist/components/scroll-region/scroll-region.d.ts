import { type RefCallback } from 'react';
import type { BaseProps, NativeProps } from '../../core/props.js';
import type { ScrollOverviewLayer, ScrollOverviewMarker } from '../../utils/scroll-overview.js';
import { type GridColumns, type GridMinColumnWidth, type LayoutAlign, type LayoutContainmentProps, type LayoutSpace } from '../layout/layout.js';
import { type ScrollRegionScrollbarVisibility } from './use-scroll-activity.js';
export type ScrollRegionAxis = 'x' | 'y' | 'both' | 'none';
export type ScrollRegionOverscroll = 'contain' | 'auto';
export type ScrollRegionScrollbar = 'native' | 'overlay';
export type ScrollRegionScrollbarInset = 'none' | 'header';
export interface ScrollRegionProps extends NativeProps<'div'>, BaseProps, LayoutContainmentProps {
    /** The axes that scroll. Defaults to `y`. */
    axis?: ScrollRegionAxis | undefined;
    /** Whether scroll chaining stops at this region. Defaults to `contain`. */
    overscroll?: ScrollRegionOverscroll | undefined;
    /** `overlay` hides the native scrollbars and draws thumbs that take no layout space. */
    scrollbar?: ScrollRegionScrollbar | undefined;
    /** `header` keeps the overlay vertical thumb below registered sticky headers. */
    scrollbarInset?: ScrollRegionScrollbarInset | undefined;
    /** When overlay scrollbars show: `auto` (default), `always`, `scroll` or `hover`. */
    scrollbarVisibility?: ScrollRegionScrollbarVisibility | undefined;
    /** How long scrolling and a pointer that left keep scrollbars shown, in milliseconds. Defaults to 600. */
    scrollbarHideDelay?: number | undefined;
    /** Keep the viewport at the bottom as content grows while the reader is there, as in a log. */
    stickToBottom?: boolean | undefined;
    /** Called when scrolling reaches the top, for example to load earlier content. */
    onTopReached?: (() => void) | undefined;
    /** Called when scrolling reaches the bottom, for example to load more content. */
    onBottomReached?: (() => void) | undefined;
    /** Decorative markers painted beside the native vertical scrollbar. */
    overview?: readonly ScrollOverviewMarker[] | undefined;
    /** Named marker layers, combined with equal weight where they meet. Replaces `overview`. */
    overviewLayers?: readonly ScrollOverviewLayer[] | undefined;
    /** Lay the scrolled children out in grid columns. */
    columns?: GridColumns | undefined;
    /** Smallest column width for `columns="fit"`. Defaults to `sm`. */
    minColumnWidth?: GridMinColumnWidth | undefined;
    /** Gap between grid cells, with `columns`. Defaults to `none`. */
    space?: LayoutSpace | undefined;
    /** Grid cell alignment, with `columns`. Defaults to `stretch`. */
    align?: LayoutAlign | undefined;
}
/** Scrollbars stay shown this long after scrolling or after the pointer leaves, in milliseconds. */
export declare const DEFAULT_SCROLLBAR_HIDE_DELAY = 600;
/**
 * A ref callback for a sticky header inside an overlay-scrollbar `ScrollRegion` with
 * `scrollbarInset="header"`, so the vertical thumb runs below it. `undefined` elsewhere.
 */
export declare function useScrollRegionHeaderRef(): RefCallback<HTMLElement> | undefined;
/**
 * An area that scrolls on its own. The root frames a native scroll viewport; overlay mode adds
 * thumbs over it, and markers add a decorative overview beside the native scrollbar. It grows by
 * default, clips only when no axis scrolls, and publishes how far the content reaches past each edge.
 */
export declare function ScrollRegion({ children, className, id, hidden, axis, overscroll, scrollbar, grow, fill, clip, columns, minColumnWidth, space, align, tabIndex, onScroll, ref, ...rest }: ScrollRegionProps): import("react").JSX.Element;
export { useScrollSpy } from './use-scroll-spy.js';
export { OverlayScrollbars } from './overlay-scrollbars.js';
export { useOverlayMetrics } from './use-overlay-metrics.js';
//# sourceMappingURL=scroll-region.d.ts.map