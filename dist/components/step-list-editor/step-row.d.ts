import { type StepListEditorStep } from './step-list.js';
import { type StepDrag } from './use-step-drag.js';
/** A text column every step fills. */
export interface StepListEditorColumn {
    /** The key of the column's text in each step's `values`. */
    id: string;
    /** Names the column's field in every step and heads the column. */
    label: string;
    /** A hint shown while a step's field is empty. */
    placeholder?: string | undefined;
}
/** A step menu's actions. */
export type StepAction = 'insert-above' | 'insert-below' | 'duplicate' | 'up' | 'down' | 'delete';
export interface StepRowProps {
    step: StepListEditorStep;
    index: number;
    count: number;
    /** The step's number as shown. */
    number: string;
    columns: readonly StepListEditorColumn[];
    /** The committed version of the step, while the editor marks changes; `null` when it is new. */
    committed: StepListEditorStep | null | undefined;
    isReadOnly: boolean;
    drag: StepDrag | null;
    onChange: (step: StepListEditorStep) => void;
    onAction: (action: StepAction, id: string) => void;
    /** Moves the step one place by Alt+Arrow keys, keeping focus where it is. */
    onStep: (id: string, delta: -1 | 1) => void;
}
export declare const stepListEditorHooks: import("../../core/hooks.js").ComponentHooks<"number" | "header" | "empty" | "heading" | "add" | "actions" | "steps" | "field" | "step" | "handle" | "fields">;
/**
 * One step: a drag handle, its number, a multi-line text field per column and its menu while
 * editable. Alt+ArrowUp and Alt+ArrowDown anywhere in the step move it.
 */
export declare function StepRow(props: StepRowProps): import("react").JSX.Element;
//# sourceMappingURL=step-row.d.ts.map