import type { SelectionMode } from '../../core/props.js';
import type { DiagramRect } from './edge-route.js';
import type { DiagramController } from './use-diagram-controller.js';
/**
 * Pointer drags on the canvas background: a drag pans the view, a Shift drag draws a marquee that
 * selects the nodes it touches, and a press that does not move clears the selection and gives up a
 * connection in progress.
 */
export declare function useBackgroundPointer(controller: DiagramController, selectionMode: SelectionMode): {
    marquee: DiagramRect | null;
    pointerProps: {
        onPointerDown: (event: import("react").PointerEvent<HTMLElement>) => void;
        onPointerMove: (event: import("react").PointerEvent<HTMLElement>) => void;
        onPointerUp: (event: import("react").PointerEvent<HTMLElement>) => void;
        onPointerCancel: (event: import("react").PointerEvent<HTMLElement>) => void;
        onLostPointerCapture: (event: import("react").PointerEvent<HTMLElement>) => void;
    };
};
//# sourceMappingURL=use-background-pointer.d.ts.map