import { type DiagramViewport } from './diagram-model.js';
import type { DiagramPoint, DiagramRect } from './edge-route.js';
export interface DiagramViewportOptions {
    viewport: DiagramViewport | undefined;
    defaultViewport: DiagramViewport | undefined;
    onViewportChange: ((viewport: DiagramViewport) => void) | undefined;
    /** The viewport element, once mounted. */
    element: HTMLElement | null;
    /** The box around every node, or null without nodes. */
    bounds: DiagramRect | null;
}
export interface DiagramViewportState {
    viewport: DiagramViewport;
    setViewport: (viewport: DiagramViewport) => void;
    /** Zooms to `zoom` percent around a point of the viewport element, by default its centre. */
    zoomTo: (zoom: number, at?: DiagramPoint) => void;
    /** Zooms to the next zoom level up (`1`) or down (`-1`). */
    stepZoom: (direction: 1 | -1) => void;
    /** Shows every node. */
    fit: () => void;
    /** Pans the least that brings a box, in diagram coordinates, into view. */
    reveal: (rect: DiagramRect) => void;
    /** The size of the viewport element, or null before it is measured. */
    size: {
        width: number;
        height: number;
    } | null;
}
export declare const diagramZoomRange: readonly [number, number];
/**
 * The canvas's pan and zoom, controlled or not. Without a viewport from the caller, the view fits
 * every node once the viewport element is first measured.
 */
export declare function useDiagramViewport(options: DiagramViewportOptions): DiagramViewportState;
//# sourceMappingURL=use-diagram-viewport.d.ts.map