import { createContext, useContext, useId, type CSSProperties, type RefCallback } from 'react';
import { measuredProperty, splitDataAttributes } from '../../core/hooks.js';
import type { BaseProps, NativeProps } from '../../core/props.js';
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
import {
  useOverlayMetrics,
  type HeaderRegistration,
  type OverlayMetrics,
} from './use-overlay-metrics.js';
import { useScrollOverview, type ScrollOverviewPaint } from './use-scroll-overview.js';

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

/** The root's measured properties: the overview image, and in overlay mode the header and lift. */
function resolveRootStyle(
  paint: ScrollOverviewPaint,
  overlay: OverlayMetrics | null,
): CSSProperties {
  return {
    ...(paint.visible ? measuredProperty('scroll-region-overview-image', paint.image) : {}),
    ...(overlay ? measuredProperty('scroll-region-header-size', overlay.header) : {}),
    ...(overlay ? measuredProperty('scroll-region-content-lift', overlay.lift) : {}),
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

/**
 * An area that scrolls on its own. The root frames a native scroll viewport; overlay mode adds
 * thumbs over it, and markers add a decorative overview beside the native scrollbar. It grows by
 * default and clips only when no axis scrolls.
 */
export function ScrollRegion({
  children,
  className,
  id,
  hidden,
  axis = 'y',
  overscroll = 'contain',
  scrollbar = 'native',
  scrollbarInset = 'none',
  overview,
  overviewLayers,
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
  const headerInset = scrollbarInset === 'header';
  const measurement = useOverlayMetrics({ viewport, enabled: overlay, headerInset });
  const overflow = resolveOverflow(measurement.metrics, axis, overlay);
  const paint = useScrollOverview(viewport, {
    markers: overview,
    layers: overviewLayers,
    enabled: !overlay,
  });
  const [callerData, viewportProps] = splitDataAttributes(rest);
  const containment = resolveContainment(
    { grow, fill, clip },
    { grow: true, clip: axis === 'none' },
  );
  const grid =
    columns === undefined ? {} : resolveGridLayout({ columns, minColumnWidth, space, align });
  const data = { axis, overscroll, scrollbar, ...containment, ...grid, ...overflow };

  return (
    <div
      hidden={hidden}
      style={resolveRootStyle(paint, overlay ? measurement.metrics : null)}
      {...hooks.root({ className, props: callerData, data: { ...data, overview: paint.visible } })}
    >
      <HeaderContext value={measurement.registerHeader}>
        <div
          {...viewportProps}
          {...hooks.slot('viewport')}
          ref={setViewport}
          id={viewportId}
          tabIndex={overlay ? (tabIndex ?? 0) : tabIndex}
          onScroll={(event) => {
            measurement.schedule();
            onScroll?.(event);
          }}
        >
          {children}
        </div>
      </HeaderContext>
      <ScrollOverview paint={paint} />
      {overlay ? (
        <OverlayScrollbars
          viewport={viewport}
          viewportId={viewportId}
          measurement={measurement}
          {...overflow}
        />
      ) : null}
    </div>
  );
}
