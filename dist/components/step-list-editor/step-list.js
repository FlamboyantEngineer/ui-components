// The pure edits a step list editor makes to its steps, and its dirty marks.
/** Inserts `step` at `index` (clamped to the list). */
export function insertStep(steps, index, step) {
    return steps.toSpliced(Math.max(0, Math.min(index, steps.length)), 0, step);
}
/** Replaces the step with `step.id`. */
export function updateStep(steps, step) {
    return steps.map((candidate) => (candidate.id === step.id ? step : candidate));
}
export function removeStep(steps, id) {
    return steps.filter((step) => step.id !== id);
}
/** Moves a step before or after another; a move onto itself or an unknown step changes nothing. */
export function moveStep(steps, { key, targetKey, position }) {
    const step = steps.find((candidate) => candidate.id === key);
    if (!step || key === targetKey)
        return steps;
    const rest = removeStep(steps, key);
    const target = rest.findIndex((candidate) => candidate.id === targetKey);
    if (target === -1)
        return steps;
    return insertStep(rest, position === 'before' ? target : target + 1, step);
}
/** The move of a step one place up (-1) or down (1), or null at either end. */
export function resolveStepMove(steps, id, delta) {
    const index = steps.findIndex((step) => step.id === id);
    const target = index === -1 ? undefined : steps[index + delta];
    if (!target)
        return null;
    return { key: id, targetKey: target.id, position: delta === 1 ? 'after' : 'before' };
}
/**
 * The move a drop of the step `key` on the step `targetKey` makes: it takes the target's place,
 * landing after it when dragged down and before it when dragged up. Null on itself or unknown steps.
 */
export function resolveStepDrop(steps, { key, targetKey }) {
    const from = steps.findIndex((step) => step.id === key);
    const to = steps.findIndex((step) => step.id === targetKey);
    if (from < 0 || to < 0 || from === to)
        return null;
    return { key, targetKey, position: from < to ? 'after' : 'before' };
}
/** A step's text in a column. */
export function readStepValue(step, column) {
    return step.values[column] ?? '';
}
/** Whether a step differs from its committed version in any column, or is new. */
export function isStepDirty(step, committed, columns) {
    if (!committed)
        return true;
    return columns.some((column) => readStepValue(step, column) !== readStepValue(committed, column));
}
/** Whether a list differs from its committed version: a step added, removed, moved or edited. */
export function isStepListDirty(steps, committed, columns) {
    if (steps.length !== committed.length)
        return true;
    return steps.some((step, index) => {
        const before = committed[index];
        return before?.id !== step.id || isStepDirty(step, before, columns);
    });
}
//# sourceMappingURL=step-list.js.map