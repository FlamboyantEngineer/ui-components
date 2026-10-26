import { type HTMLAttributes, type RefObject } from 'react';
import type { PressEvent } from '../../core/events.js';
import { type StepListEditorStep, type StepMove } from './step-list.js';
/** What every step's drag and drop shares: the editor's media type, the dragged step and the move. */
export interface StepDrag {
    /** Unique to the editor, so other editors and drop targets refuse its steps. */
    dragType: string;
    dragging: RefObject<string | null>;
    /** The move a drop of the dragged step on `targetKey` makes. */
    resolveDrop: (targetKey: string) => StepMove | null;
    onMove: (move: StepMove) => void;
}
interface StepDragSource {
    steps: readonly StepListEditorStep[];
    onMove: (move: StepMove) => void;
}
/** The editor's step drag and drop, each drop checked against the steps last rendered. */
export declare function useStepDrag(source: StepDragSource): StepDrag;
/** A step's drag and drop: props for the step and its handle, and its states. */
export interface StepRowDrag {
    ref: RefObject<HTMLLIElement | null>;
    /** Spread on the step: it drags and takes drops. */
    props: HTMLAttributes<HTMLLIElement>;
    /** Spread on the handle: a pointer press arms the drag, a keyboard press starts it. */
    handleProps: {
        onPressStart: (event: PressEvent) => void;
        onPress: (event: PressEvent) => void;
    };
    isDragging: boolean;
    dropPosition: StepMove['position'] | null;
}
/**
 * One step's drag and drop: it drags from its handle, by pointer or by keyboard and screen reader
 * from the handle's press, and takes drops of the editor's other steps.
 */
export declare function useStepRowDrag({ id, label, drag, }: {
    id: string;
    label: string;
    drag: StepDrag | null;
}): StepRowDrag;
export {};
//# sourceMappingURL=use-step-drag.d.ts.map