import type { BaseProps } from '../../core/props.js';
import { type ChatSource } from './chat-source-summary.js';
/** The data of a citation, as a message part carries it. */
export interface ChatCitationData {
    /** The cited source. */
    source: ChatSource;
    /** The marker's number, counted from 1: the source's place in the answer's sources. */
    index: number;
}
export interface ChatCitationProps extends BaseProps, ChatCitationData {
}
/**
 * An inline numbered marker (`[1]`) for a source. It links to the source and previews it in a
 * `HoverCard` on hover, keyboard focus and long press; a source without a URL opens its card on
 * press instead.
 */
export declare function ChatCitation({ source, index, className, id, ...rest }: ChatCitationProps): import("react").JSX.Element;
//# sourceMappingURL=chat-citation.d.ts.map