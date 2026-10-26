import { type CSSProperties, type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type OverlayLayer } from './layers.js';
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
/** Chooses the container and layer z-indexes for every `Portal` below it. */
export declare function PortalContainerProvider({ container, layerZIndex, children, }: PortalContainerProviderProps): import("react").JSX.Element;
/**
 * Renders its children followed by a container element, and makes that element the container of
 * every `Portal` below. Overlays stay inside the host's part of the page and leave with it.
 */
export declare function PortalHost({ children, layerZIndex, className, ...rest }: PortalHostProps): import("react").JSX.Element;
/** The z-index of `layer` under the nearest provider, for components that position their own layer. */
export declare function useLayerZIndex(layer: OverlayLayer): number;
/**
 * The width of the element a dropdown opens from, published as `--ui-trigger-width` from the
 * building block's measurement, so stylesheets size the list without naming the building block.
 */
export declare const triggerWidthProperty: CSSProperties;
/**
 * Renders its children in the overlay container (the document body unless a provider chooses
 * another), inside a wrapper stacked by its layer. The children stay in the React tree, so context
 * and events follow the component that rendered them.
 */
export declare function Portal({ children, layer, topLayer, inPlace, preserveTabOrder, className, ...rest }: PortalProps): import("react").JSX.Element | null;
//# sourceMappingURL=portal.d.ts.map