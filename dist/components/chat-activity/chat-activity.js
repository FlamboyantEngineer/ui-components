// The data an assistant's activity parts take, and the values they derive from it.
// Other components import the family through this main module (docs/CODING-GUIDELINES.md, S4).
export { ChatPlan } from './chat-plan.js';
export { ChatReasoning } from './chat-reasoning.js';
export { ChatStatusLine } from './chat-status-line.js';
export { ChatSteps } from './chat-steps.js';
/** A duration in milliseconds as whole seconds, rounded; none without a duration. */
export function toWholeSeconds(durationMs) {
    return durationMs === undefined ? undefined : Math.max(0, Math.round(durationMs / 1000));
}
/** How many of a plan's steps are done. */
export function countDoneSteps(steps) {
    return steps.filter((step) => step.status === 'done').length;
}
/**
 * The steps whose status differs from the one `previous` holds for their `id`. A step `previous`
 * does not hold counts as `pending` before, so a step added as pending is not a change.
 */
export function listChangedSteps(steps, previous) {
    return steps.filter((step) => (previous.get(step.id) ?? 'pending') !== step.status);
}
/** Each step's status by its `id`. */
export function mapStepStatuses(steps) {
    return new Map(steps.map((step) => [step.id, step.status]));
}
//# sourceMappingURL=chat-activity.js.map