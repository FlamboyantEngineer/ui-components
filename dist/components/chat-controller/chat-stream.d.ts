import type { ChatPlanStep, ChatPlanStepStatus } from '../chat-activity/chat-activity.js';
import type { ChatAttachmentData } from '../chat-attachment/chat-attachment.js';
import type { ChatMessageData } from '../chat-parts/chat-parts.js';
import type { ChatQuestionItem } from '../chat-question/chat-question.js';
import type { ChatSource } from '../chat-sources/chat-sources.js';
import type { CodeBlockData } from '../code-block/code-block.js';
import { type ChatStreamContext } from './chat-stream-parts.js';
export type { ChatStreamContext } from './chat-stream-parts.js';
/** One step of an assistant's reply, as plain data. `send` yields these in order. */
export type ChatStreamEvent = 
/** Appends text to the reply's open text part, or starts a text part. */
{
    type: 'text-delta';
    text: string;
}
/** Appends text to the reasoning part `id`, or starts it. */
 | {
    type: 'reasoning-delta';
    id: string;
    text: string;
}
/** Completes the reasoning part `id`, timed by the controller when `durationMs` is missing. */
 | {
    type: 'reasoning-end';
    id: string;
    durationMs?: number | undefined;
}
/** Starts the tool call `id`, running, or updates its name, label and arguments. */
 | {
    type: 'tool-call';
    id: string;
    name: string;
    label?: string | undefined;
    args?: unknown;
}
/** Ends the tool call `id`: failed with an `error`, else succeeded with its `result`. */
 | {
    type: 'tool-result';
    id: string;
    result?: unknown;
    error?: string | undefined;
    durationMs?: number | undefined;
}
/**
 * Asks the reader to approve the tool call `id`. With `await`, `send` waits for the decision
 * through `waitFor(id)`; without it, the turn ends and the decision starts the next one.
 */
 | {
    type: 'approval-request';
    id: string;
    scopeLabel?: string | undefined;
    await?: boolean;
}
/** Asks the reader the questions of the card `id`, awaited as an approval is. */
 | {
    type: 'question';
    id: string;
    questions: readonly ChatQuestionItem[];
    await?: boolean;
}
/** Adds the plan `id`, or replaces its title and steps. */
 | {
    type: 'plan';
    id: string;
    title?: string | undefined;
    steps: readonly ChatPlanStep[];
}
/** Moves the step `stepId` of the plan `planId` to `status`. */
 | {
    type: 'plan-step';
    planId: string;
    stepId: string;
    status: ChatPlanStepStatus;
}
/** Adds a source to the reply's sources, or replaces the one with its `id`. */
 | {
    type: 'source';
    source: ChatSource;
}
/** Adds a file the reply produced. */
 | {
    type: 'file';
    attachment: ChatAttachmentData;
}
/** Adds a block of code or terminal output, or replaces the one with its `id`. */
 | ({
    type: 'code';
    id?: string | undefined;
} & CodeBlockData)
/** Adds a diff, or replaces the one with its `id`. */
 | {
    type: 'diff';
    id?: string | undefined;
    title?: string | undefined;
    oldText: string;
    newText: string;
}
/** Adds a part the host draws itself, or replaces the one with its `id`. */
 | {
    type: 'custom';
    id?: string | undefined;
    name: string;
    data?: unknown;
}
/** Says what the assistant is doing, such as `Searching recipes…`; an empty text clears it. */
 | {
    type: 'status';
    text: string;
}
/** Ends the reply. */
 | {
    type: 'finish';
}
/** Ends the reply as failed, with the reason to show. */
 | {
    type: 'error';
    message: string;
};
/** The kinds of stream event. */
export type ChatStreamEventType = ChatStreamEvent['type'];
/**
 * Folds one stream event into the assistant's reply and returns the new reply, leaving the given
 * one unchanged. Events about a part the reply does not hold (a result for an unknown tool call, a
 * step of an unknown plan) change nothing.
 */
export declare function reduceChatStream(message: ChatMessageData, event: ChatStreamEvent, context?: ChatStreamContext): ChatMessageData;
//# sourceMappingURL=chat-stream.d.ts.map