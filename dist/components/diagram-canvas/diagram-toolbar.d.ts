import type { DiagramController } from './use-diagram-controller.js';
/** `canvas` draws the diagram; `outline` lists its nodes and their links. */
export type DiagramView = 'canvas' | 'outline';
export interface DiagramToolbarProps {
    controller: DiagramController;
    view: DiagramView;
    onViewChange: (view: DiagramView) => void;
}
/** The zoom control and fit button of the canvas, and the switch between canvas and outline. */
export declare function DiagramToolbar({ controller, view, onViewChange }: DiagramToolbarProps): import("react").JSX.Element;
//# sourceMappingURL=diagram-toolbar.d.ts.map