'use client';

import {
  createContext,
  useContext,
  useId,
  type CSSProperties,
  type RefCallback,
  type RefObject,
} from 'react';
import { measuredProperty, splitDataAttributes } from '../../core/hooks.js';
import type { BaseProps, ContainerProps } from '../../core/props.js';
import type { ScrollOverviewLayer, ScrollOverviewMarker } from '../../utils/scroll-overview.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import {
  resolveContainment,
  resolveGridLayout,
  type GridColumns,
  type GridMinColumnWidth,
  type LayoutAlign,
  type LayoutContainmentProps,
  type LayoutSpace,
} from '../layout/layout.js';
import { OverlayScrollbars } from './overlay-scrollbars.js';
import { scrollRegionHooks as hooks } from './styling-hooks.js';
import { useScrollActivity, type ScrollRegionScrollbarVisibility } from './use-scroll-activity.js';
import { useScrollEdges, type ScrollEdges } from './use-scroll-edges.js';
import {
  useOverlayMetrics,
  type HeaderRegistration,
  type OverlayMetrics,
} from './use-overlay-metrics.js';
import { useScrollOverview, type ScrollOverviewPaint } from './use-scroll-overview.js';
import { useSharedViewportObserver } from './use-shared-viewport-observer.js';
import { DEFAULT_SCROLLBAR_HIDE_DELAY } from './scroll-region-defaults.js';

export type ScrollRegionAxis = 'x' | 'y' | 'both' | 'none';
export type ScrollRegionOverscroll = 'contain' | 'auto';
export type ScrollRegionScrollbar = 'native' | 'overlay';
export type ScrollRegionScrollbarInset = 'none' | 'header';

export interface ScrollRegionProps
  extends ContainerProps<'div'>, BaseProps, LayoutContainmentProps {
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

const HeaderContext = createContext<HeaderRegistration | undefined>(undefined);

/**
 * The root's measured properties: the overview image, the edge distances of a scrolling region, and
 * in overlay mode the header and lift.
 */
function resolveRootStyle(
  paint: ScrollOverviewPaint,
  overlay: OverlayMetrics | null,
  edges: ScrollEdges | null,
): CSSProperties {
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
function resolveEdgeStates(edges: ScrollEdges) {
  return {
    overflowYStart: edges.yStart > 0,
    overflowYEnd: edges.yEnd > 0,
    overflowXStart: edges.xStart > 0,
    overflowXEnd: edges.xEnd > 0,
  };
}

/** Whether overlay content overflows each axis that scrolls, by more than a pixel. */
function resolveOverflow(metrics: OverlayMetrics, axis: ScrollRegionAxis, overlay: boolean) {
  return {
    overflowX:
      overlay && (axis === 'x' || axis === 'both') && metrics.contentWidth > metrics.width + 1,
    overflowY:
      overlay && (axis === 'y' || axis === 'both') && metrics.contentHeight > metrics.height + 1,
  };
}

/** The overlay tracks to draw: the overflowing axes, or every scrolling axis with `always`. */
function resolveTracks(
  overflow: { overflowX: boolean; overflowY: boolean },
  axis: ScrollRegionAxis,
  visibility: ScrollRegionScrollbarVisibility,
) {
  const always = visibility === 'always';
  return {
    drawX: overflow.overflowX || (always && (axis === 'x' || axis === 'both')),
    drawY: overflow.overflowY || (always && (axis === 'y' || axis === 'both')),
  };
}

/** The viewport's id: the caller's, or a generated one that overlay thumbs can name. */
function useViewportId(id: string | undefined, overlay: boolean): string | undefined {
  const generatedId = useId();
  return id ?? (overlay ? `${generatedId}-viewport` : undefined);
}

/** The decorative overview layer, as tall as the viewport's visible height. */
function ScrollOverview({ paint }: { paint: ScrollOverviewPaint }) {
  if (!paint.visible) return null;
  return (
    <div
      {...hooks.slot('overview')}
      aria-hidden="true"
      style={{ height: paint.height, pointerEvents: 'none' }}
    />
  );
}

/**
 * A ref callback for a sticky header inside an overlay-scrollbar `ScrollRegion` with
 * `scrollbarInset="header"`, so the vertical thumb runs below it. `undefined` elsewhere.
 */
export function useScrollRegionHeaderRef(): RefCallback<HTMLElement> | undefined {
  return useContext(HeaderContext);
}

type RegionBehaviourProps = Pick<
  ScrollRegionProps,
  | 'scrollbarInset'
  | 'scrollbarVisibility'
  | 'scrollbarHideDelay'
  | 'stickToBottom'
  | 'onTopReached'
  | 'onBottomReached'
  | 'overview'
  | 'overviewLayers'
>;

type RegionBehaviourOptions = RegionBehaviourProps & { axis: ScrollRegionAxis; overlay: boolean };

/** Separates the props that drive the region's behaviour from those its viewport takes. */
function splitRegionBehaviour<P extends RegionBehaviourProps>({
  scrollbarInset,
  scrollbarVisibility,
  scrollbarHideDelay,
  stickToBottom,
  onTopReached,
  onBottomReached,
  overview,
  overviewLayers,
  ...rest
}: P): [RegionBehaviourProps, Omit<P, keyof RegionBehaviourProps>] {
  const behaviour = { scrollbarInset, scrollbarVisibility, scrollbarHideDelay, stickToBottom };
  return [{ ...behaviour, onTopReached, onBottomReached, overview, overviewLayers }, rest];
}

/**
 * What a region measures and follows: overlay geometry, scrolling and hover activity, edge distances
 * and the overview paint, with the hook values and root style they publish.
 */
function useRegionBehaviour(
  viewport: RefObject<HTMLDivElement | null>,
  {
    axis,
    overlay,
    scrollbarInset,
    scrollbarVisibility = 'auto',
    scrollbarHideDelay = DEFAULT_SCROLLBAR_HIDE_DELAY,
    stickToBottom = false,
    onTopReached,
    onBottomReached,
    overview,
    overviewLayers,
  }: RegionBehaviourOptions,
) {
  const scrolls = axis !== 'none';
  const headerInset = scrollbarInset === 'header';
  const observer = useSharedViewportObserver(viewport);
  const measurement = useOverlayMetrics({ viewport, observer, enabled: overlay, headerInset });
  const overflow = resolveOverflow(measurement.metrics, axis, overlay);
  const activity = useScrollActivity(scrollbarVisibility, scrollbarHideDelay);
  const scrollEdges = useScrollEdges(viewport, observer, {
    enabled: scrolls,
    stickToBottom,
    onTopReached,
    onBottomReached,
  });
  const paint = useScrollOverview(viewport, observer, {
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
    style: resolveRootStyle(
      paint,
      overlay ? measurement.metrics : null,
      scrolls ? scrollEdges.edges : null,
    ),
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
export function ScrollRegion({
  children,
  className,
  id,
  hidden,
  axis = 'y',
  overscroll = 'contain',
  scrollbar = 'native',
  grow,
  fill,
  clip,
  columns,
  minColumnWidth = 'sm',
  space = 'none',
  align = 'stretch',
  tabIndex,
  onScroll,
  ref,
  ...rest
}: ScrollRegionProps) {
  const overlay = scrollbar === 'overlay';
  const viewportId = useViewportId(id, overlay);
  const [viewport, setViewport] = useForwardedRef(ref);
  const [behaviour, nativeProps] = splitRegionBehaviour(rest);
  const region = useRegionBehaviour(viewport, { axis, overlay, ...behaviour });
  const [callerData, viewportProps] = splitDataAttributes(nativeProps);
  const containment = resolveContainment(
    { grow, fill, clip },
    { grow: true, clip: axis === 'none' },
  );
  const grid =
    columns === undefined ? {} : resolveGridLayout({ columns, minColumnWidth, space, align });
  const data = { axis, overscroll, scrollbar, ...containment, ...grid, ...region.data };

  return (
    <div
      hidden={hidden}
      style={region.style}
      onPointerEnter={region.activity.onPointerEnter}
      onPointerLeave={region.activity.onPointerLeave}
      {...hooks.root({ className, props: callerData, data })}
    >
      <HeaderContext value={region.measurement.registerHeader}>
        <div
          {...viewportProps}
          {...hooks.slot('viewport')}
          ref={setViewport}
          id={viewportId}
          tabIndex={overlay ? (tabIndex ?? 0) : tabIndex}
          onScroll={(event) => {
            region.onScroll();
            onScroll?.(event);
          }}
        >
          {children}
        </div>
      </HeaderContext>
      <ScrollOverview paint={region.paint} />
      {overlay ? (
        <OverlayScrollbars
          viewport={viewport}
          viewportId={viewportId}
          measurement={region.measurement}
          isVisible={region.activity.isScrollbarVisible}
          {...region.tracks}
        />
      ) : null}
    </div>
  );
}

export { useScrollSpy } from './use-scroll-spy.js';

export { OverlayScrollbars } from './overlay-scrollbars.js';
export { useOverlayMetrics } from './use-overlay-metrics.js';
export { useSharedViewportObserver } from './use-shared-viewport-observer.js';

export {
  DEFAULT_SCROLLBAR_HIDE_DELAY,
  MIN_THUMB_SIZE,
  THUMB_ARROW_STEP,
} from './scroll-region-defaults.js';
