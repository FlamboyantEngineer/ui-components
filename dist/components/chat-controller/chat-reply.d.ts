import type { ChatMessageData, ChatPart } from '../chat-parts/chat-parts.js';
import type { ChatQuestionAnswer } from '../chat-question/chat-question.js';
import type { ChatToolCallDecision } from '../chat-tool-call/chat-tool-call.js';
import type { ChatQueuedMessage } from './chat-controller-state.js';
/** The reader's decision on an approval request, as `waitFor` resolves it. */
export interface ChatApprovalResponse {
    type: 'approval';
    decision: ChatToolCallDecision;
    /** The reader's reason for a denial. */
    reason?: string | undefined;
    /** Approved without asking, because the reader always allows the tool. */
    isAutoApproved?: boolean | undefined;
}
/** The reader's answers to a question card, or its dismissal, as `waitFor` resolves it. */
export interface ChatQuestionResponse {
    type: 'question';
    status: 'answered' | 'dismissed';
    /** One answer per question when answered; empty when dismissed. */
    answers: ChatQuestionAnswer[];
}
/** What the reader answered to a part that waited for them. */
export type ChatReaderResponse = ChatApprovalResponse | ChatQuestionResponse;
/**
 * Whether the part waits for the reader: an undecided approval request or a pending question. A
 * running reply that holds one is not busy for assistive technology, so its card stays readable.
 */
export declare function isAwaitingReader(part: ChatPart): boolean;
/** The index of the last message holding the part `id` that waits for the reader, or -1. */
export declare function findAwaitingMessage(messages: readonly ChatMessageData[], id: string): number;
/** The response that dismisses a part waiting for the reader: a denial, or a dismissed card. */
export declare function toDismissal(part: ChatPart): ChatReaderResponse;
/**
 * The message with the reader's response recorded on its part `id` while that part waits for
 * them: an approved or always-allowed call runs, a denied one is denied, a question is answered
 * or dismissed.
 */
export declare function recordResponse(message: ChatMessageData, id: string, response: ChatReaderResponse): ChatMessageData;
/** The reader's message: the files it carries, then its text with the mentions and commands. */
export declare function createOutgoingMessage(outgoing: ChatQueuedMessage, author: {
    authorId: string;
    createdAt: string;
}): ChatMessageData;
/** The text of every message the reader wrote, oldest first, for the composer's recall. */
export declare function listPrompts(messages: readonly ChatMessageData[], currentUserId: string): readonly string[];
//# sourceMappingURL=chat-reply.d.ts.map