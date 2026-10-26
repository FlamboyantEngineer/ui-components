import type { BaseProps } from '../../core/props.js';
import { type ActivityExpansionProps } from './activity-disclosure.js';
import { type ChatReasoningData, type ChatReasoningFormat } from './chat-activity.js';
export interface ChatReasoningProps extends Omit<BaseProps, 'id'>, ChatReasoningData, ActivityExpansionProps {
    /** How the text renders. Defaults to `markdown`. */
    format?: ChatReasoningFormat | undefined;
}
/**
 * An assistant's reasoning as a disclosure. While it streams it is open (unless it does not expand
 * automatically), labelled by its `title` or "Thinking…" and busy, with the text coming in; once
 * complete it collapses, labelled with how long it took. The reader's own choice wins over both.
 */
export declare function ChatReasoning({ text, title, status, durationMs, format, className, ...rest }: ChatReasoningProps): import("react").JSX.Element;
//# sourceMappingURL=chat-reasoning.d.ts.map