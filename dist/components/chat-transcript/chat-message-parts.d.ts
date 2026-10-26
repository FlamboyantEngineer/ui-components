import type { ChatMessageAuthor, ChatMessageDelivery, ChatMessageProps } from './chat-message.js';
type ChatMessageBodyProps = Pick<ChatMessageProps, 'quote' | 'onQuotePress' | 'error' | 'isEdited' | 'reactions' | 'actions' | 'children'> & {
    isCancelled: boolean;
    delivery: ChatMessageDelivery | undefined;
    onRetry: (() => void) | undefined;
};
export declare const chatMessageHooks: import("../../core/hooks.js").ComponentHooks<"body" | "footer" | "header" | "time" | "error" | "quote" | "retry" | "actions" | "edited" | "reactions" | "content" | "avatar" | "author" | "delivery" | "readers" | "stopped" | "delivery-icon" | "delivery-label">;
/** A message's time as the absolute date and time, for its accessible name. */
export declare function useAbsoluteTime(time: string | undefined, getNow: (() => Date) | undefined): string | undefined;
/** The author's avatar, marked and named with their presence when they have one. */
export declare function ChatMessageAvatar({ author }: {
    author: ChatMessageAuthor;
}): import("react").JSX.Element;
/** The author's name (at the start of a group) and the time, when either is shown. */
export declare function ChatMessageHeader({ authorName, time, getNow, }: Pick<ChatMessageProps, 'time' | 'getNow'> & {
    authorName: string | undefined;
}): import("react").JSX.Element | null;
/**
 * Everything a message that is not deleted shows under its header: the quote, the content, the
 * footer, the error with Retry, the reactions and the actions.
 */
export declare function ChatMessageBody({ quote, onQuotePress, error, onRetry, isEdited, isCancelled, delivery, reactions, actions, children, }: ChatMessageBodyProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=chat-message-parts.d.ts.map