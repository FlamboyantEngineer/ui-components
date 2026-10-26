import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useId, } from 'react';
import { measuredProperty, splitDataAttributes } from '../../core/hooks.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { resolveContainment, resolveGridLayout, } from '../layout/layout.js';
import { OverlayScrollbars } from './overlay-scrollbars.js';
import { scrollRegionHooks as hooks } from './styling-hooks.js';
import { useScrollActivity } from './use-scroll-activity.js';
import { useScrollEdges } from './use-scroll-edges.js';
import { useOverlayMetrics, } from './use-overlay-metrics.js';
import { useScrollOverview } from './use-scroll-overview.js';
/** Scrollbars stay shown this long after scrolling or after the pointer leaves, in milliseconds. */
export const DEFAULT_SCROLLBAR_HIDE_DELAY = 600;
const HeaderContext = createContext(undefined);
/**
 * The root's measured properties: the overview image, the edge distances of a scrolling region, and
 * in overlay mode the header and lift.
 */
function resolveRootStyle(paint, overlay, edges) {
    return {
        ...(paint.visible ? measuredProperty('scroll-region-overview-image', paint.image) : {}),
        ...(overlay ? measuredProperty('scroll-region-header-size', overlay.header) : {}),
        ...(overlay ? measuredProperty('scroll-region-content-lift', overlay.lift) : {}),
        ...(edges ? measuredProperty('scroll-region-overflow-y-start', edges.yStart) : {}),
        ...(edges ? measuredProperty('scroll-region-overflow-y-end', edges.yEnd) : {}),
        ...(edges ? measuredProperty('scroll-region-overflow-x-start', edges.xStart) : {}),
        ...(edges ? measuredProperty('scroll-region-overflow-x-end', edges.xEnd) : {}),
    };
}
/** The edge states: content reaches past that edge of the viewport. */
function resolveEdgeStates(edges) {
    return {
        overflowYStart: edges.yStart > 0,
        overflowYEnd: edges.yEnd > 0,
        overflowXStart: edges.xStart > 0,
        overflowXEnd: edges.xEnd > 0,
    };
}
/** Whether overlay content overflows each axis that scrolls, by more than a pixel. */
function resolveOverflow(metrics, axis, overlay) {
    return {
        overflowX: overlay && (axis === 'x' || axis === 'both') && metrics.contentWidth > metrics.width + 1,
        overflowY: overlay && (axis === 'y' || axis === 'both') && metrics.contentHeight > metrics.height + 1,
    };
}
/** The overlay tracks to draw: the overflowing axes, or every scrolling axis with `always`. */
function resolveTracks(overflow, axis, visibility) {
    const always = visibility === 'always';
    return {
        drawX: overflow.overflowX || (always && (axis === 'x' || axis === 'both')),
        drawY: overflow.overflowY || (always && (axis === 'y' || axis === 'both')),
    };
}
/** The viewport's id: the caller's, or a generated one that overlay thumbs can name. */
function useViewportId(id, overlay) {
    const generatedId = useId();
    return id ?? (overlay ? `${generatedId}-viewport` : undefined);
}
/** The decorative overview layer, as tall as the viewport's visible height. */
function ScrollOverview({ paint }) {
    if (!paint.visible)
        return null;
    return (_jsx("div", { ...hooks.slot('overview'), "aria-hidden": "true", style: { height: paint.height, pointerEvents: 'none' } }));
}
/**
 * A ref callback for a sticky header inside an overlay-scrollbar `ScrollRegion` with
 * `scrollbarInset="header"`, so the vertical thumb runs below it. `undefined` elsewhere.
 */
export function useScrollRegionHeaderRef() {
    return useContext(HeaderContext);
}
/** Separates the props that drive the region's behaviour from those its viewport takes. */
function splitRegionBehaviour({ scrollbarInset, scrollbarVisibility, scrollbarHideDelay, stickToBottom, onTopReached, onBottomReached, overview, overviewLayers, ...rest }) {
    const behaviour = { scrollbarInset, scrollbarVisibility, scrollbarHideDelay, stickToBottom };
    return [{ ...behaviour, onTopReached, onBottomReached, overview, overviewLayers }, rest];
}
/**
 * What a region measures and follows: overlay geometry, scrolling and hover activity, edge distances
 * and the overview paint, with the hook values and root style they publish.
 */
function useRegionBehaviour(viewport, { axis, overlay, scrollbarInset, scrollbarVisibility = 'auto', scrollbarHideDelay = DEFAULT_SCROLLBAR_HIDE_DELAY, stickToBottom = false, onTopReached, onBottomReached, overview, overviewLayers, }) {
    const scrolls = axis !== 'none';
    const headerInset = scrollbarInset === 'header';
    const measurement = useOverlayMetrics({ viewport, enabled: overlay, headerInset });
    const overflow = resolveOverflow(measurement.metrics, axis, overlay);
    const activity = useScrollActivity(scrollbarVisibility, scrollbarHideDelay);
    const scrollEdges = useScrollEdges(viewport, {
        enabled: scrolls,
        stickToBottom,
        onTopReached,
        onBottomReached,
    });
    const paint = useScrollOverview(viewport, {
        markers: overview,
        layers: overviewLayers,
        enabled: !overlay,
    });
    return {
        measurement,
        activity,
        tracks: resolveTracks(overflow, axis, scrollbarVisibility),
        data: {
            scrollbarVisibility,
            ...overflow,
            ...resolveEdgeStates(scrollEdges.edges),
            scrolling: activity.isScrolling,
            hovering: activity.isHovering,
            overview: paint.visible,
        },
        style: resolveRootStyle(paint, overlay ? measurement.metrics : null, scrolls ? scrollEdges.edges : null),
        paint,
        onScroll() {
            measurement.schedule();
            activity.onScroll();
            scrollEdges.onScroll();
        },
    };
}
/**
 * An area that scrolls on its own. The root frames a native scroll viewport; overlay mode adds
 * thumbs over it, and markers add a decorative overview beside the native scrollbar. It grows by
 * default, clips only when no axis scrolls, and publishes how far the content reaches past each edge.
 */
export function ScrollRegion({ children, className, id, hidden, axis = 'y', overscroll = 'contain', scrollbar = 'native', grow, fill, clip, columns, minColumnWidth = 'sm', space = 'none', align = 'stretch', tabIndex, onScroll, ref, ...rest }) {
    const overlay = scrollbar === 'overlay';
    const viewportId = useViewportId(id, overlay);
    const [viewport, setViewport] = useForwardedRef(ref);
    const [behaviour, nativeProps] = splitRegionBehaviour(rest);
    const region = useRegionBehaviour(viewport, { axis, overlay, ...behaviour });
    const [callerData, viewportProps] = splitDataAttributes(nativeProps);
    const containment = resolveContainment({ grow, fill, clip }, { grow: true, clip: axis === 'none' });
    const grid = columns === undefined ? {} : resolveGridLayout({ columns, minColumnWidth, space, align });
    const data = { axis, overscroll, scrollbar, ...containment, ...grid, ...region.data };
    return (_jsxs("div", { hidden: hidden, style: region.style, onPointerEnter: region.activity.onPointerEnter, onPointerLeave: region.activity.onPointerLeave, ...hooks.root({ className, props: callerData, data }), children: [_jsx(HeaderContext, { value: region.measurement.registerHeader, children: _jsx("div", { ...viewportProps, ...hooks.slot('viewport'), ref: setViewport, id: viewportId, tabIndex: overlay ? (tabIndex ?? 0) : tabIndex, onScroll: (event) => {
                        region.onScroll();
                        onScroll?.(event);
                    }, children: children }) }), _jsx(ScrollOverview, { paint: region.paint }), overlay ? (_jsx(OverlayScrollbars, { viewport: viewport, viewportId: viewportId, measurement: region.measurement, isVisible: region.activity.isScrollbarVisible, ...region.tracks })) : null] }));
}
export { useScrollSpy } from './use-scroll-spy.js';
export { OverlayScrollbars } from './overlay-scrollbars.js';
export { useOverlayMetrics } from './use-overlay-metrics.js';
//# sourceMappingURL=scroll-region.js.map