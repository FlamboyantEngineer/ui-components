import type { DiagramController } from './use-diagram-controller.js';
export interface DiagramMinimapProps {
    controller: DiagramController;
}
/**
 * A small overview of every node and the part of the diagram in view. Pressing or dragging on it
 * centres the view there. It repeats what the canvas shows, so it is hidden from assistive
 * technology.
 */
export declare function DiagramMinimap({ controller }: DiagramMinimapProps): import("react").JSX.Element | null;
//# sourceMappingURL=diagram-minimap.d.ts.map