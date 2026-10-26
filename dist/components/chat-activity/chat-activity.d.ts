export { ChatPlan } from './chat-plan.js';
export type { ChatPlanProps } from './chat-plan.js';
export { ChatReasoning } from './chat-reasoning.js';
export type { ChatReasoningProps } from './chat-reasoning.js';
export { ChatStatusLine } from './chat-status-line.js';
export type { ChatStatusLineActivity, ChatStatusLineProps } from './chat-status-line.js';
export { ChatSteps } from './chat-steps.js';
export type { ChatStepsProps } from './chat-steps.js';
/** Reasoning `streaming` in, or `complete`. */
export type ChatReasoningStatus = 'streaming' | 'complete';
/** How reasoning text renders: as Markdown (the default) or as plain text. */
export type ChatReasoningFormat = 'markdown' | 'plain';
/** The data of a reasoning part. */
export interface ChatReasoningData {
    /** The reasoning so far. */
    text: string;
    status: ChatReasoningStatus;
    /** What the reasoning is about now, such as its latest heading; labels it while it streams. */
    title?: string | undefined;
    /** How long the reasoning took, in milliseconds, once it is complete. */
    durationMs?: number | undefined;
}
/** Where a plan step stands. */
export type ChatPlanStepStatus = 'pending' | 'in-progress' | 'done' | 'failed' | 'skipped';
/** One step of a plan. */
export interface ChatPlanStep {
    /** Identifies the step across updates. */
    id: string;
    label: string;
    status: ChatPlanStepStatus;
}
/** The data of a plan part. */
export interface ChatPlanData {
    /** A title above the steps. */
    title?: string | undefined;
    /** The steps, in order. */
    steps: readonly ChatPlanStep[];
}
/** A duration in milliseconds as whole seconds, rounded; none without a duration. */
export declare function toWholeSeconds(durationMs: number | undefined): number | undefined;
/** How many of a plan's steps are done. */
export declare function countDoneSteps(steps: readonly ChatPlanStep[]): number;
/**
 * The steps whose status differs from the one `previous` holds for their `id`. A step `previous`
 * does not hold counts as `pending` before, so a step added as pending is not a change.
 */
export declare function listChangedSteps(steps: readonly ChatPlanStep[], previous: ReadonlyMap<string, ChatPlanStepStatus>): ChatPlanStep[];
/** Each step's status by its `id`. */
export declare function mapStepStatuses(steps: readonly ChatPlanStep[]): ReadonlyMap<string, ChatPlanStepStatus>;
//# sourceMappingURL=chat-activity.d.ts.map