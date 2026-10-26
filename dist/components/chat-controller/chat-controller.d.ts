import type { ChatAttachmentData } from '../chat-attachment/chat-attachment.js';
import type { ChatMessageData, ChatTextToken } from '../chat-parts/chat-parts.js';
import type { ChatQuestionAnswer } from '../chat-question/chat-question.js';
import type { ChatQueuedMessage, ChatSendFunction, ChatUploadFunction } from './chat-controller-state.js';
import { type ChatMessagesUpdate } from './chat-engine.js';
export type { ChatQueuedMessage, ChatSendContext, ChatSendFunction, ChatUploadContext, ChatUploadFunction, } from './chat-controller-state.js';
export type { ChatMessagesUpdate } from './chat-engine.js';
export { isAwaitingReader } from './chat-reply.js';
export type { ChatApprovalResponse, ChatQuestionResponse, ChatReaderResponse, } from './chat-reply.js';
export { reduceChatStream } from './chat-stream.js';
export type { ChatStreamContext, ChatStreamEvent, ChatStreamEventType } from './chat-stream.js';
export interface ChatControllerOptions {
    /** Streams the assistant's reply to the conversation, which ends with the reader's message. */
    send: ChatSendFunction;
    /** The reader's participant id, the author of the messages they send. */
    currentUserId: string;
    /** The assistant's participant id, the author of its replies. */
    assistantId: string;
    /** The conversation at first. */
    initialMessages?: readonly ChatMessageData[] | undefined;
    /** Uploads a file the reader attaches; without it, the reader cannot attach files. */
    upload?: ChatUploadFunction | undefined;
    /** The tools the reader always allows (controlled). Uncontrolled, the controller keeps them. */
    alwaysAllowed?: readonly string[] | undefined;
    /** Receives the tools the reader always allows when Always allow adds one. */
    onAlwaysAllowedChange?: ((tools: readonly string[]) => void) | undefined;
}
/** What a chat needs from the controller, to spread into it. */
export interface ChatControllerProps {
    messages: readonly ChatMessageData[];
    /** A reply is running. */
    isPending: boolean;
    /** Sends the reader's message, or queues it while a reply runs. */
    onSend: (text: string, tokens?: readonly ChatTextToken[]) => void;
    /** Stops the running reply. */
    onStop: () => void;
    /** Runs the last turn again when `messageId` is the reply that failed. */
    onRetry: (messageId: string) => void;
    /** Lets the tool call `callId` run once. */
    onApprove: (callId: string) => void;
    /** Refuses the tool call `callId`, with the reader's reason. */
    onDeny: (callId: string, reason?: string) => void;
    /** Lets the tool call `callId` run, and its tool run from then on without asking. */
    onAlwaysAllow: (callId: string) => void;
    /** Records the reader's answers to the question card `questionId`. */
    onAnswerQuestion: (questionId: string, answers: ChatQuestionAnswer[]) => void;
    /** Dismisses the question card `questionId`. */
    onDismissQuestion: (questionId: string) => void;
    /** The messages waiting for the running reply to end. */
    queue: readonly ChatQueuedMessage[];
    /** Replaces the queue, as when the reader edits or removes a queued message. */
    onQueueChange: (queue: readonly ChatQueuedMessage[]) => void;
    /** The text of the messages the reader sent, oldest first, for the composer's recall. */
    history: readonly string[];
    /** The files the composer holds for the next message. */
    attachments: readonly ChatAttachmentData[];
    /** Attaches and uploads files; set only with `upload`. */
    onAttach: ((files: File[]) => void) | undefined;
    /** Removes a file from the composer, aborting its upload; set only with `upload`. */
    onRemoveAttachment: ((id: string) => void) | undefined;
    /** Uploads a failed file again; set only with `upload`. */
    onRetryAttachment: ((id: string) => void) | undefined;
}
export interface ChatController {
    messages: readonly ChatMessageData[];
    /** A reply is running. */
    isPending: boolean;
    /** The messages waiting for the running reply to end. */
    queue: readonly ChatQueuedMessage[];
    /** What the assistant is doing while its reply runs, such as `Searching recipes…`. */
    statusText: string | undefined;
    /** Sends the reader's message, or queues it while a reply runs. */
    send: (text: string, tokens?: readonly ChatTextToken[]) => void;
    /** Stops the running reply, keeping what it streamed. */
    stop: () => void;
    /** Runs the last turn again after its reply failed. */
    retry: () => void;
    /** Replaces the conversation. */
    setMessages: (update: ChatMessagesUpdate) => void;
    /** Everything a chat needs, to spread into it. */
    props: ChatControllerProps;
}
/**
 * Turns a host's `send`, which streams library events, into a chat's state and callbacks: the
 * messages with their streaming reply, stop, retry, errors, a queue of follow-ups, approvals,
 * questions, prompt history and uploads. It keeps no backend of its own.
 */
export declare function useChatController(options: ChatControllerOptions): ChatController;
//# sourceMappingURL=chat-controller.d.ts.map