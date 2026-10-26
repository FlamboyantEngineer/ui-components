import type { ChatMessageData } from '../chat-parts/chat-parts.js';
import { type ChatEngineContext, type ChatRun } from './chat-controller-state.js';
import { type ChatReaderResponse } from './chat-reply.js';
import { type ChatReplyOutcome } from './chat-stream-parts.js';
/**
 * Ends the run once: settles the reply, rejects the waiters still open and, for a stopped or
 * failed reply, aborts the signal. Then the controller continues the reply or sends the next
 * queued message.
 */
export declare function endRun(engine: ChatEngineContext, run: ChatRun, outcome: ChatReplyOutcome): void;
/** Streams `send`'s reply to `messages` into the conversation's reply `replyId`. */
export declare function startRun(engine: ChatEngineContext, plan: {
    replyId: string;
    messages: readonly ChatMessageData[];
}): void;
/**
 * Records the reader's response on the part `id` while it waits for them. An awaited part hands
 * the response to `waitFor`; any other continues its reply (`continues`) once nothing else waits,
 * or once the running reply ends.
 */
export declare function respond(engine: ChatEngineContext, answer: {
    id: string;
    response: ChatReaderResponse;
    continues: boolean;
}): void;
//# sourceMappingURL=chat-run.d.ts.map