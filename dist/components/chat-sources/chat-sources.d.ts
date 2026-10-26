import type { BaseProps } from '../../core/props.js';
import { type ChatSource } from './chat-source-summary.js';
export type { ChatSource } from './chat-source-summary.js';
export { ChatCitation } from './chat-citation.js';
export type { ChatCitationData, ChatCitationProps } from './chat-citation.js';
export { createCitationOverride } from './markdown-citations.js';
/** The data of a sources list, as a message part carries it. */
export interface ChatSourcesData {
    /** The sources in citation order: the first is cited as `[1]`. */
    sources: readonly ChatSource[];
}
export interface ChatSourcesProps extends BaseProps, ChatSourcesData {
}
/**
 * The sources an answer drew on, as a numbered list labelled by their count: each one's title
 * (linking to it when it has a URL), its site and a snippet. Numbers match `ChatCitation` markers.
 */
export declare function ChatSources({ sources, className, id, ...rest }: ChatSourcesProps): import("react").JSX.Element;
//# sourceMappingURL=chat-sources.d.ts.map