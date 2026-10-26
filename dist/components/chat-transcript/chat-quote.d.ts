import type { PressEvent } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
/** The message a reply quotes. */
export interface ChatQuoteData {
    /** Who wrote the quoted message. */
    authorName: string;
    /** The start of the quoted message, as plain text. */
    excerpt: string;
    /** The quoted message's id, so pressing the quote can jump to it. */
    messageId?: string | undefined;
}
export interface ChatQuoteProps extends Omit<ChatQuoteData, 'messageId'>, BaseProps {
    /** Makes the quote a button, such as one that jumps to the quoted message. */
    onPress?: ((event: PressEvent) => void) | undefined;
}
/**
 * A quoted message: its author and an excerpt, in a `<blockquote>`, or in a button named after
 * both when `onPress` makes it jump to the original. Used in a reply and in a composer's reply
 * banner.
 */
export declare function ChatQuote({ authorName, excerpt, onPress, className, ...rest }: ChatQuoteProps): import("react").JSX.Element;
//# sourceMappingURL=chat-quote.d.ts.map