import type { ChatMessageOrigin, ChatMessageVariant } from '../chat-transcript/chat-transcript.js';
/** How a chat draws its messages: with or without avatars, author names, times and backgrounds. */
export interface ChatMessageDisplayOptions {
    /** Shows each author's avatar at the start of their messages. Defaults to `true`. */
    showAvatars?: boolean | undefined;
    /** Shows each author's name at the start of their messages. Defaults to `true`. */
    showAuthorNames?: boolean | undefined;
    /** Shows each message's time. Defaults to `true`. */
    showTimes?: boolean | undefined;
    /** Draws the reader's own messages in a `bubble` (the default) or `plain`. */
    sentVariant?: ChatMessageVariant | undefined;
    /** Draws everyone else's messages, an assistant's too, in a `bubble` (the default) or `plain`. */
    receivedVariant?: ChatMessageVariant | undefined;
}
/** The display options, kept while they stay the same, so unchanged messages do not render again. */
export declare function useMessageDisplay({ showAvatars, showAuthorNames, showTimes, sentVariant, receivedVariant, }: ChatMessageDisplayOptions): ChatMessageDisplayOptions;
/** The variant of a message from `origin`; a notice keeps the default. */
export declare function toMessageVariant(origin: ChatMessageOrigin, display: ChatMessageDisplayOptions): ChatMessageVariant | undefined;
//# sourceMappingURL=chat-message-display.d.ts.map