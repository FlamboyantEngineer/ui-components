import type { ChatPart, ChatReasoningPart, ChatToolCallPart } from './chat-part.js';
/** A part that can be a step of a group: reasoning or a tool call. */
export type ChatStepPart = ChatReasoningPart | ChatToolCallPart;
/** A part shown on its own, keyed for rendering. */
export interface ChatPartItem {
    kind: 'part';
    key: string;
    part: ChatPart;
}
/** Consecutive steps shown as one group, keyed (and expanded) by its first step's id. */
export interface ChatStepsItem {
    kind: 'steps';
    key: string;
    steps: ChatStepPart[];
}
export type ChatPartsItem = ChatPartItem | ChatStepsItem;
export declare function isStepPart(part: ChatPart): part is ChatStepPart;
/** A part's React key: its type and id, or its type and position when it has no id. */
export declare function toPartKey(part: ChatPart, index: number): string;
/** The key a group of steps is rendered and expanded under. */
export declare function toStepsKey(first: ChatStepPart): string;
/**
 * The parts to render in order. A run of consecutive steps becomes one group when it holds two or
 * more steps, or one step that further parts follow; a single step that ends the message stays alone.
 */
export declare function groupChatParts(parts: readonly ChatPart[]): ChatPartsItem[];
/** The sum of the steps' durations, or `undefined` when none has one. */
export declare function sumStepDurations(steps: readonly ChatStepPart[]): number | undefined;
/** A step still at work: reasoning that streams, or a tool call that waits to run or runs. */
export declare function isStepActive(step: ChatStepPart): boolean;
/** A tool call that waits for the reader's approval. */
export declare function isAwaitingApproval(step: ChatStepPart): boolean;
/** A tool call that failed. */
export declare function isFailedCall(step: ChatStepPart): boolean;
//# sourceMappingURL=chat-parts-grouping.d.ts.map