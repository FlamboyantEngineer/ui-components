'use client';

import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { createHooks, measuredProperty } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { UNSAFE_PortalProvider as AriaPortalProvider } from '../../primitives/index.js';
import { omitUndefined } from '../../utils/omit-undefined.js';
import { useIsClient } from '../../utils/use-is-client.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
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

export interface PortalHostProps extends RefProps<HTMLDivElement>, BaseProps {
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

/**
 * Chooses the container and layer z-indexes for every `Portal` below it, and points React Aria's
 * own overlays (popovers, menus, dialogs, tooltips, toasts) at the same container, so every
 * library overlay below renders there.
 */
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
  const provided = <PortalContext value={value}>{children}</PortalContext>;
  if (container === undefined) return provided;
  // Any element, an iframe's body too, or `null`, which React Aria renders nothing into. No realm's
  // `HTMLElement` is assumed or even read, so the server, where it does not exist, renders this too.
  return (
    <AriaPortalProvider getContainer={() => container as HTMLElement | null}>
      {provided}
    </AriaPortalProvider>
  );
}

/**
 * Renders its children followed by a container element, and makes that element the container of
 * every `Portal` below. Overlays stay inside the host's part of the page and leave with it.
 */
export function PortalHost({ ref, children, layerZIndex, className, ...rest }: PortalHostProps) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const hostRef = useMergedRefs(setHost, ref);
  return (
    <PortalContainerProvider container={host} layerZIndex={layerZIndex}>
      {children}
      <div {...rest} ref={hostRef} {...hostHooks.root({ className })} />
    </PortalContainerProvider>
  );
}

/** The z-index of `layer` under the nearest provider, for components that position their own layer. */
export function useLayerZIndex(layer: OverlayLayer): number {
  return useContext(PortalContext).zIndex[layer];
}

/** The layer of the overlay the content renders in, when one says so. */
const OverlayLayerContext = createContext<OverlayLayer | undefined>(undefined);

/** Marks content as rendering in an overlay on `layer`, for overlays opened inside it. */
export function OverlayLayerScope({
  layer,
  children,
}: {
  layer: OverlayLayer;
  children: ReactNode;
}) {
  return <OverlayLayerContext value={layer}>{children}</OverlayLayerContext>;
}

/**
 * `layer`, raised to the layer of the overlay the caller renders in when that one stacks higher, so
 * an overlay opened from inside another never paints beneath it.
 */
export function useStackedLayer(layer: OverlayLayer): OverlayLayer {
  const enclosing = useContext(OverlayLayerContext);
  return enclosing && isLayerAbove(enclosing, layer) ? enclosing : layer;
}

/**
 * The container portals under the nearest provider render into: `undefined` for the document body,
 * `null` while the chosen one is not ready. For components whose building block portals itself.
 */
export function usePortalContainer(): Element | null | undefined {
  return useContext(PortalContext).container;
}

/**
 * The element portals under the nearest provider render into, or `null` on the server, during
 * hydration and while the chosen container is not ready. For overlays that position themselves
 * against their containing block and so cannot sit in a `Portal` wrapper.
 */
export function usePortalTarget(): Element | null {
  const { container } = useContext(PortalContext);
  const isClient = useIsClient();
  if (!isClient) return null;
  // Without a portal host, portals render into the script's own document.
  // eslint-disable-next-line no-restricted-globals
  return container === undefined ? document.body : container;
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
  const { zIndex } = useContext(PortalContext);
  const target = usePortalTarget();
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
  if (!target) return null;
  return (
    <>
      {keepsTabOrder ? tabOrder.placeGuards : null}
      {createPortal(wrapper, target)}
    </>
  );
}
