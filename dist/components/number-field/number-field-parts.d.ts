import { type KeyboardEvent } from 'react';
import type { FieldState } from '../field/field.js';
export declare const numberFieldHooks: import("../../core/hooks.js").ComponentHooks<"input" | "start" | "end" | "group" | "box" | "decrement" | "scrubber" | "increment">;
/** The steps a number moves by: `step` alone, `smallStep` with Alt and `largeStep` with Shift. */
export interface NumberSteps {
    step: number;
    smallStep: number | undefined;
    largeStep: number | undefined;
    minValue: number | undefined;
    maxValue: number | undefined;
}
/**
 * The value `delta` away from `value`, kept in the range and rounded to the precision of both, so
 * decimal steps do not drift (0.1 + 0.2). An empty value steps up to the minimum and down to the
 * maximum (zero without one), as React Aria's plain arrow keys do.
 */
export declare function addStep(value: number | null, delta: number, steps: NumberSteps): number;
/**
 * Shift and Alt with Arrow Up or Arrow Down step the value by `largeStep` or `smallStep` and commit
 * it; React Aria steps by `step` only for the plain keys.
 */
export declare function createModifierStepHandler(state: FieldState<number | null>, steps: NumberSteps): (event: KeyboardEvent<HTMLInputElement>) => void;
/** A step button, named by its action and the field label (`Decrease Weight`). */
export declare function Stepper({ slot, labelledBy, }: {
    slot: 'decrement' | 'increment';
    labelledBy?: string | undefined;
}): import("react").JSX.Element;
/**
 * A handle that steps the value as it is dragged sideways: one step every few pixels, toward the
 * end of the line (right in left-to-right text), by `largeStep` with Shift and `smallStep` with Alt.
 * The value commits when the drag ends. It is a pointer shortcut for the arrow keys, so assistive
 * technology does not see it.
 */
export declare function NumberScrubber({ state, steps, }: {
    state: FieldState<number | null>;
    steps: NumberSteps;
}): import("react").JSX.Element;
//# sourceMappingURL=number-field-parts.d.ts.map