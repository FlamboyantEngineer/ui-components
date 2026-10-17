import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  type ComponentPropsWithRef,
  type CSSProperties,
  type Ref,
  type RefCallback,
  type UIEvent,
} from 'react';
import { createHooks, measuredProperty, splitDataAttributes } from '../../core/hooks.js';
import type { ScrollOverviewLayer, ScrollOverviewMarker } from '../../utils/scroll-overview.js';
import {
  layoutGrowValue,
  type GridColumns,
  type GridMinColumnWidth,
  type LayoutAlign,
  type LayoutGrow,
  type LayoutSpace,
} from '../layout/layout.js';
import { useOverlayScrollbars, type ScrollAxis } from './overlay-scrollbars.js';
import { useScrollOverview } from './use-scroll-overview.js';

export type { ScrollAxis } from './overlay-scrollbars.js';
export type ScrollRegionOverscroll = 'contain' | 'auto';
export type ScrollRegionScrollbar = 'native' | 'overlay';
export type ScrollRegionScrollbarInset = 'none' | 'header';

type HeaderRegistration = (element: HTMLElement | null) => (() => void) | undefined;

const HeaderContext = createContext<HeaderRegistration | undefined>(undefined);

/**
 * A ref callback for a sticky header inside an overlay-scrollbar `ScrollRegion` with
 * `scrollbarInset="header"`, so the vertical thumb runs below it. `undefined` elsewhere.
 */
export function useScrollRegionHeaderRef(): RefCallback<HTMLElement> | undefined {
  return useContext(HeaderContext);
}

export interface ScrollRegionProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'className' | 'style'
> {
  /** The axes that scroll. Defaults to `y`. */
  axis?: ScrollAxis | undefined;
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
  /** Growth inside a flex parent. Defaults to `true`. */
  grow?: LayoutGrow | undefined;
  /** Cover the nearest positioned ancestor. */
  fill?: boolean | undefined;
  /** Clip the content. Defaults to true only for `axis="none"`. */
  clip?: boolean | undefined;
  /** Lay the scrolled children out in grid columns. */
  columns?: GridColumns | undefined;
  /** Smallest column width for `columns="fit"`. Defaults to `sm`. */
  minColumnWidth?: GridMinColumnWidth | undefined;
  /** Gap between grid cells, with `columns`. Defaults to `none`. */
  space?: LayoutSpace | undefined;
  /** Grid cell alignment, with `columns`. Defaults to `stretch`. */
  align?: LayoutAlign | undefined;
  className?: string | undefined;
}

const hooks = createHooks('scroll-region', ['viewport', 'overview', 'track', 'thumb']);

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

/**
 * An area that scrolls on its own. The root frames a native scroll viewport; overlay mode adds
 * thumbs over it, and markers add a decorative overview beside the native scrollbar.
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
  fill = false,
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
  const generatedId = useId();
  const viewportId = id ?? (overlay ? `${generatedId}-viewport` : undefined);
  const viewport = useRef<HTMLDivElement | null>(null);
  const setViewport = useCallback(
    (node: HTMLDivElement | null) => {
      viewport.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  const thumbs = useOverlayScrollbars({
    viewport,
    viewportId: viewportId ?? '',
    enabled: overlay,
    axis,
    headerInset: scrollbarInset === 'header',
    hooks,
  });
  const paint = useScrollOverview(
    viewport,
    overlay ? undefined : overview,
    overlay ? undefined : overviewLayers,
  );

  const style: CSSProperties = {
    ...(paint.visible ? measuredProperty('scroll-region-overview-image', paint.image) : {}),
    ...(overlay
      ? {
          ...measuredProperty('scroll-region-header-size', thumbs.header),
          ...measuredProperty('scroll-region-content-lift', thumbs.lift),
        }
      : {}),
  };
  const grid = columns !== undefined;
  const [, viewportProps] = splitDataAttributes(rest);

  return (
    <div
      hidden={hidden}
      style={style}
      {...hooks.root({
        className,
        props: rest,
        data: {
          axis,
          overscroll,
          scrollbar,
          grow: layoutGrowValue(grow, true),
          fill,
          clip: clip ?? axis === 'none',
          columns: grid ? String(columns) : undefined,
          minColumnWidth: columns === 'fit' ? minColumnWidth : undefined,
          space: grid ? space : undefined,
          align: grid ? align : undefined,
          overview: paint.visible,
          overflowX: thumbs.overflowX,
          overflowY: thumbs.overflowY,
        },
      })}
    >
      <HeaderContext value={thumbs.registerHeader}>
        <div
          {...viewportProps}
          {...hooks.slot('viewport')}
          ref={setViewport}
          id={viewportId}
          tabIndex={overlay ? (tabIndex ?? 0) : tabIndex}
          onScroll={(event: UIEvent<HTMLDivElement>) => {
            thumbs.onScroll();
            onScroll?.(event);
          }}
        >
          {children}
        </div>
      </HeaderContext>
      {paint.visible ? (
        <div
          {...hooks.slot('overview')}
          aria-hidden="true"
          style={{ height: paint.height, pointerEvents: 'none' }}
        />
      ) : null}
      {thumbs.controls}
    </div>
  );
}
