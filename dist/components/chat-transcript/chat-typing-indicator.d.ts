import type { BaseProps } from '../../core/props.js';
export interface ChatTypingIndicatorProps extends BaseProps {
    /** Who is typing, in the order they started. Nobody typing leaves the indicator empty. */
    names?: readonly string[] | undefined;
}
/**
 * Says who is typing (`Ana is typing…`, `Ana and Ben are typing…`, `Ana and 2 others are
 * typing…`) beside three decorative dots a stylesheet animates. It is a polite status: keep it
 * mounted, empty while nobody types, so changes are announced.
 */
export declare function ChatTypingIndicator({ names, className, ...rest }: ChatTypingIndicatorProps): import("react").JSX.Element;
//# sourceMappingURL=chat-typing-indicator.d.ts.map