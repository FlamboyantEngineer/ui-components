import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { createHooks } from '../../core/hooks.js';
import { defaultLayerZIndex, isLayerAbove, type OverlayLayer } from './layers.js';

export type LayerZIndex = Partial<Record<OverlayLayer, number>>;

interface PortalContextValue {
  /** `undefined`: no provider chose one, use the document body. `null`: the chosen one is not ready. */
  container: Element | null | undefined;
  zIndex: Readonly<Record<OverlayLayer, number>>;
}

const PortalContext = createContext<PortalContextValue>({
  container: undefined,
  zIndex: defaultLayerZIndex,
});

function definedEntries(values: LayerZIndex): LayerZIndex {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => typeof value === 'number'),
  ) as LayerZIndex;
}

export interface PortalContainerProviderProps {
  /**
   * Where portals below render. `null` means the container is not available yet: portals render
   * nothing until it is. Left out, the outer provider's container (or the document body) applies.
   */
  container?: Element | null | undefined;
  /** Replaces the z-index of some layers, merged over the outer provider's. */
  layerZIndex?: LayerZIndex | undefined;
  children?: ReactNode;
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
      zIndex: layerZIndex ? { ...parent.zIndex, ...definedEntries(layerZIndex) } : parent.zIndex,
    }),
    [parent, container, layerZIndex],
  );
  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export interface PortalHostProps {
  children?: ReactNode;
  /** Replaces the z-index of some layers for portals in this host. */
  layerZIndex?: LayerZIndex | undefined;
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hostHooks = createHooks('portal-host');

/**
 * Renders its children followed by a container element, and makes that element the container of
 * every `Portal` below. Overlays stay inside the host's part of the page and leave with it.
 */
export function PortalHost({ children, layerZIndex, className, id, ...rest }: PortalHostProps) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <PortalContainerProvider container={host} layerZIndex={layerZIndex}>
      {children}
      <div ref={setHost} {...hostHooks.root({ className, props: rest })} id={id} />
    </PortalContainerProvider>
  );
}

/** The z-index of `layer` under the nearest provider, for components that position their own layer. */
export function useLayerZIndex(layer: OverlayLayer): number {
  return useContext(PortalContext).zIndex[layer];
}

const subscribeToNothing = () => () => {};

/** False on the server and during hydration, true once rendering in the browser. */
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

export interface PortalProps {
  children?: ReactNode;
  /** The overlay layer, which sets the stacking order. Defaults to `dropdown`. */
  layer?: OverlayLayer | undefined;
  /**
   * Keep the content usable while a React Aria modal is open: not hidden from assistive technology,
   * reachable by focus, and not dismissing React Aria overlays when used. Defaults to true for layers
   * above `modal`.
   */
  topLayer?: boolean | undefined;
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('portal');

/**
 * Renders its children in the overlay container (the document body unless a provider chooses
 * another), inside a wrapper stacked by its layer. The children stay in the React tree, so context
 * and events follow the component that rendered them.
 */
export function Portal({
  children,
  layer = 'dropdown',
  topLayer,
  className,
  id,
  ...rest
}: PortalProps) {
  const { container, zIndex } = useContext(PortalContext);
  const isClient = useIsClient();
  if (!isClient) return null;
  const target = container === undefined ? document.body : container;
  if (!target) return null;
  const isTopLayer = topLayer ?? isLayerAbove(layer, 'modal');
  return createPortal(
    <div
      {...hooks.root({ className, props: rest, data: { layer } })}
      id={id}
      {...(isTopLayer ? { 'data-react-aria-top-layer': 'true' } : {})}
      style={{ position: 'absolute', top: 0, left: 0, zIndex: zIndex[layer] }}
    >
      {children}
    </div>,
    target,
  );
}
