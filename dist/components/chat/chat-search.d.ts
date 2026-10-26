import { type RefObject } from 'react';
import type { ChatMessageData } from '../chat-parts/chat-parts.js';
/** The search within a conversation: its query, the matching messages and the current one. */
export interface ChatSearchModel {
    isOpen: boolean;
    query: string;
    /** The ids of the matching messages, oldest first. */
    matches: readonly string[];
    /** The current match, zero-based; -1 without matches. */
    currentIndex: number;
    /** The current match's message, for the transcript to highlight. */
    highlightedId: string | undefined;
    toggle: () => void;
    close: () => void;
    setQuery: (query: string) => void;
    step: (by: 1 | -1) => void;
    barId: string;
    inputRef: RefObject<HTMLInputElement | null>;
    toggleRef: RefObject<HTMLButtonElement | null>;
}
/**
 * Searches the conversation's data rather than its mounted messages, so a virtualized history is
 * searched whole; the newest match is current first, and the steps wrap around.
 */
export declare function useChatSearch(messages: readonly ChatMessageData[]): ChatSearchModel;
/** The button in the header that opens and closes the search. */
export declare function ChatSearchToggle({ search }: {
    search: ChatSearchModel;
}): import("react").JSX.Element;
/** The find row under the header: the query, the match count, the steps and Close. */
export declare function ChatSearchBar({ search }: {
    search: ChatSearchModel;
}): import("react").JSX.Element | null;
//# sourceMappingURL=chat-search.d.ts.map