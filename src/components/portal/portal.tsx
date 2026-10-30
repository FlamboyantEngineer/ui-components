'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { createHooks, measuredProperty } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { omitUndefined } from '../../utils/omit-undefined.js';
import { defaultLayerZIndex, isLayerAbove, type OverlayLayer } from './layers.js';
import { usePreservedTabOrder } from './tab-order.js';

export type LayerZIndex = Partial<Record<OverlayLayer, number>>;

export interface PortalContainerProviderProps {
  /** Where portals below render; `null` renders none yet, and leaving it out inherits the outer one. */
  container?: Element | null | undefined;
  /** Replaces the z-index of some layers, merged over the outer provider's. */
  layerZIndex?: LayerZIndex | undefined;
  /** The content whose portals use this container. */
  children?: ReactNode;
}

export interface PortalHostProps extends BaseProps {
  /** The content whose portals render into the host's container. */
  children?: ReactNode;
  /** Replaces the z-index of some layers for portals in this host. */
  layerZIndex?: LayerZIndex | undefined;
}

export interface PortalProps extends BaseProps {
  /** The content to render in the overlay container. */
  children?: ReactNode;
  /** The overlay layer, which sets the stacking order. Defaults to `dropdown`. */
  layer?: OverlayLayer | undefined;
  /** Keep the content usable while a React Aria modal is open. Defaults to true above `modal`. */
  topLayer?: boolean | undefined;
  /** Render the wrapper where the portal is declared instead of in the container, keeping its layer. */
  inPlace?: boolean | undefined;
  /** Give the content the tab order of the place the portal is declared. */
  preserveTabOrder?: boolean | undefined;
}

interface PortalContextValue {
  /** `undefined`: no provider chose one, use the document body. `null`: the chosen one is not ready. */
  container: Element | null | undefined;
  zIndex: Readonly<Record<OverlayLayer, number>>;
}

const PortalContext = createContext<PortalContextValue>({
  container: undefined,
  zIndex: defaultLayerZIndex,
});

const hostHooks = createHooks('portal-host');
const hooks = createHooks('portal');

const subscribeToNothing = () => () => {};

/** False on the server and during hydration, true once rendering in the browser. */
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

/** Chooses the container and layer z-indexes for every `Portal` below it. */
export function PortalContainerProvider({
  container,
  layerZIndex,
  children,
}: PortalContainerProviderProps) {
  const parent = useContext(PortalContext);
  const value = useMemo<PortalContextValue>(
    () => ({
      container: container === undefined ? parent.container : container,
      zIndex: layerZIndex ? { ...parent.zIndex, ...omitUndefined(layerZIndex) } : parent.zIndex,
    }),
    [parent, container, layerZIndex],
  );
  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

/**
 * Renders its children followed by a container element, and makes that element the container of
 * every `Portal` below. Overlays stay inside the host's part of the page and leave with it.
 */
export function PortalHost({ children, layerZIndex, className, ...rest }: PortalHostProps) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <PortalContainerProvider container={host} layerZIndex={layerZIndex}>
      {children}
      <div {...rest} ref={setHost} {...hostHooks.root({ className })} />
    </PortalContainerProvider>
  );
}

/** The z-index of `layer` under the nearest provider, for components that position their own layer. */
export function useLayerZIndex(layer: OverlayLayer): number {
  return useContext(PortalContext).zIndex[layer];
}

/**
 * The container portals under the nearest provider render into: `undefined` for the document body,
 * `null` while the chosen one is not ready. For components whose building block portals itself.
 */
export function usePortalContainer(): Element | null | undefined {
  return useContext(PortalContext).container;
}

/**
 * The width of the element a dropdown opens from, published as `--ui-trigger-width` from the
 * building block's measurement, so stylesheets size the list without naming the building block.
 */
export const triggerWidthProperty = measuredProperty(
  'trigger-width',
  'var(--trigger-width)',
) as CSSProperties;

/**
 * Renders its children in the overlay container (the document body unless a provider chooses
 * another), inside a wrapper stacked by its layer. The children stay in the React tree, so context
 * and events follow the component that rendered them.
 */
export function Portal({
  children,
  layer = 'dropdown',
  topLayer,
  inPlace = false,
  preserveTabOrder = false,
  className,
  ...rest
}: PortalProps) {
  const { container, zIndex } = useContext(PortalContext);
  const isClient = useIsClient();
  const tabOrder = usePreservedTabOrder();
  const keepsTabOrder = preserveTabOrder && !inPlace;
  const isTopLayer = topLayer ?? isLayerAbove(layer, 'modal');
  const wrapper = (
    <div
      {...rest}
      {...hooks.root({ className, data: { layer } })}
      {...(isTopLayer ? { 'data-react-aria-top-layer': 'true' } : {})}
      ref={keepsTabOrder ? tabOrder.wrapperRef : undefined}
      style={{ position: 'absolute', top: 0, left: 0, zIndex: zIndex[layer] }}
    >
      {keepsTabOrder ? tabOrder.startGuard : null}
      {children}
      {keepsTabOrder ? tabOrder.endGuard : null}
    </div>
  );
  if (inPlace) return wrapper;
  if (!isClient) return null;
  const target = container === undefined ? document.body : container;
  if (!target) return null;
  return (
    <>
      {keepsTabOrder ? tabOrder.placeGuards : null}
      {createPortal(wrapper, target)}
    </>
  );
}
