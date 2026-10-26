import type { Orientation } from '../core/props.js';
/** Captures the gesture's pointer on its element, including when a drag starts after a threshold. */
export declare function capturePointer(event: {
    currentTarget: Element;
    pointerId: number;
}): void;
/** Releases a capture only while the element still owns it. */
export declare function releasePointer(element: Element, pointerId: number): void;
/** The half of an item under a local point, in reading order along the collection's axis. */
export declare function resolveDropPosition(options: {
    width: number;
    height: number;
    x: number;
    y: number;
    orientation: Orientation;
    isRtl: boolean;
}): 'before' | 'after';
/** Listens outside an uncaptured gesture's element, in that element's own document. */
export declare function listenPointerRelease(options: {
    element: Element;
    pointerId?: number | undefined;
    onRelease: () => void;
    onCancel?: (() => void) | undefined;
}): () => void;
/** Arms a native drag until the press or drag ends, sharing cleanup across handle-driven rows. */
export declare function armElementDrag(element: Element): void;
//# sourceMappingURL=pointer-drag.d.ts.map