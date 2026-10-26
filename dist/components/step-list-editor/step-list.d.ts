/** One step: its key and its text per column, keyed by column id. */
export interface StepListEditorStep {
    /** Unique within the list. */
    id: string;
    /** The step's text per column id; a missing column reads as empty. */
    values: Readonly<Record<string, string>>;
}
/** A move of one step beside another, as a drag and drop reports it. */
export interface StepMove {
    key: string;
    targetKey: string;
    position: 'before' | 'after';
}
/** Inserts `step` at `index` (clamped to the list). */
export declare function insertStep(steps: readonly StepListEditorStep[], index: number, step: StepListEditorStep): StepListEditorStep[];
/** Replaces the step with `step.id`. */
export declare function updateStep(steps: readonly StepListEditorStep[], step: StepListEditorStep): StepListEditorStep[];
export declare function removeStep(steps: readonly StepListEditorStep[], id: string): StepListEditorStep[];
/** Moves a step before or after another; a move onto itself or an unknown step changes nothing. */
export declare function moveStep(steps: readonly StepListEditorStep[], { key, targetKey, position }: StepMove): readonly StepListEditorStep[];
/** The move of a step one place up (-1) or down (1), or null at either end. */
export declare function resolveStepMove(steps: readonly StepListEditorStep[], id: string, delta: -1 | 1): StepMove | null;
/**
 * The move a drop of the step `key` on the step `targetKey` makes: it takes the target's place,
 * landing after it when dragged down and before it when dragged up. Null on itself or unknown steps.
 */
export declare function resolveStepDrop(steps: readonly StepListEditorStep[], { key, targetKey }: Pick<StepMove, 'key' | 'targetKey'>): StepMove | null;
/** A step's text in a column. */
export declare function readStepValue(step: StepListEditorStep, column: string): string;
/** Whether a step differs from its committed version in any column, or is new. */
export declare function isStepDirty(step: StepListEditorStep, committed: StepListEditorStep | undefined, columns: readonly string[]): boolean;
/** Whether a list differs from its committed version: a step added, removed, moved or edited. */
export declare function isStepListDirty(steps: readonly StepListEditorStep[], committed: readonly StepListEditorStep[], columns: readonly string[]): boolean;
//# sourceMappingURL=step-list.d.ts.map