import type { PointerEvent } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
export interface DragHandleProps extends BaseProps, AriaLabellingProps {
    /** Refuses dragging, for a row that cannot move. */
    isDisabled?: boolean | undefined;
    /** Keeps the handle out of the tab sequence. Defaults to `true`; the arrow keys reach it. */
    excludeFromTabOrder?: boolean | undefined;
}
/**
 * Lets a pointer drag start from the cell that holds a row's drag handle. Call it on a pointer
 * press inside a collection whose rows drag from anywhere: a primary press in that cell keeps
 * focus on the row for the press, so React Aria does not move it into the handle and cancel the
 * drag. `armHandleDrag` does this itself.
 */
export declare function keepHandleCellDraggable(event: PointerEvent<Element>): void;
/**
 * Lets only the handle start a row's pointer drag. Call it on a pointer press inside a collection
 * whose rows render without `draggable`: a primary press on a row's enabled handle makes that row
 * draggable until the press or the drag ends, so a press elsewhere in the row never drags it. React
 * Aria keeps the handle itself out of pointer hit testing, so the press is matched by position.
 */
export declare function armHandleDrag(event: PointerEvent<Element>): void;
/**
 * The drag button of a row in a library collection that reorders by drag and drop. The collection
 * names it after the row and starts the row's keyboard drag from it; it stays out of the tab
 * sequence, since the collection reaches it with the arrow keys.
 */
export declare function DragHandle({ className, excludeFromTabOrder, ...rest }: DragHandleProps): import("react").JSX.Element;
//# sourceMappingURL=drag-handle.d.ts.map