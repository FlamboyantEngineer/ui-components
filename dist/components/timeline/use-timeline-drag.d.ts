import { type PointerEvent } from 'react';
import { type ReadItem, type TimelineItemChange } from './timeline-geometry.js';
export interface TimelineDragOptions {
    read: ReadItem;
    dayWidth: number;
    isEditable: boolean;
    /** The change a drag in progress shows, or `null` when it ends. */
    onDraft: (change: TimelineItemChange | null) => void;
    /** The change a finished drag asks for. */
    onCommit: (change: TimelineItemChange) => void;
}
/**
 * Moves an item, or one end of a bar, by whole days under a captured pointer. The days follow the
 * pointer as a draft and are committed when the pointer is released; a cancelled drag drops them.
 */
export declare function useTimelineDrag({ read, dayWidth, isEditable, onDraft, onCommit, }: TimelineDragOptions): {
    isDragging: boolean;
    /** Whether the last press dragged, so the click it ends does not select; reading resets it. */
    consumeDrag: () => boolean;
    handlers: {
        onPointerDown: (event: PointerEvent<HTMLElement>) => void;
        onPointerMove: (event: PointerEvent<HTMLElement>) => void;
        onPointerUp: (event: PointerEvent<HTMLElement>) => void;
        onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
        onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void;
    };
};
//# sourceMappingURL=use-timeline-drag.d.ts.map