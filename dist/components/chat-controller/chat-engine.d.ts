import type { ChatMessageData, ChatTextToken } from '../chat-parts/chat-parts.js';
import type { ChatQuestionAnswer } from '../chat-question/chat-question.js';
import { type ChatEngineConfig, type ChatQueuedMessage } from './chat-controller-state.js';
/** A new conversation, or a function of the current one. */
export type ChatMessagesUpdate = readonly ChatMessageData[] | ((messages: readonly ChatMessageData[]) => readonly ChatMessageData[]);
/** Creates the controller over `initialMessages`, reading the host's options through `getConfig`. */
export declare function createChatEngine(getConfig: () => ChatEngineConfig, initialMessages: readonly ChatMessageData[]): {
    store: import("../../utils/value-store.js").ValueStore<import("./chat-controller-state.js").ChatControllerState>;
    send: (text: string, tokens?: readonly ChatTextToken[]) => void;
    stop: () => void;
    retry: () => void;
    setMessages: (update: ChatMessagesUpdate) => void;
    setQueue: (queue: readonly ChatQueuedMessage[]) => void;
    approve: (id: string) => void;
    deny: (id: string, reason?: string) => void;
    alwaysAllow: (id: string) => void;
    answerQuestion: (id: string, answers: ChatQuestionAnswer[]) => void;
    dismissQuestion: (id: string) => void;
    attach: (files: File[]) => void;
    removeAttachment: (id: string) => void;
    retryAttachment: (id: string) => void;
    /** Stops the running reply and the uploads, as when the hook's component unmounts. */
    dispose: () => void;
};
/** The controller `createChatEngine` returns. */
export type ChatEngine = ReturnType<typeof createChatEngine>;
//# sourceMappingURL=chat-engine.d.ts.map