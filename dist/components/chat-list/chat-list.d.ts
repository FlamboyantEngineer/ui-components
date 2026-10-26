import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type ChatConversation } from './chat-list-row.js';
export interface ChatListProps extends BaseProps, AriaLabellingProps {
    /** The conversations, in the order to list them. */
    conversations: readonly ChatConversation[];
    /** The open conversation's id, controlled (`null` for none). Left out, the list keeps it. */
    selectedId?: string | null | undefined;
    /** Called with the id of the conversation the reader opens. */
    onSelectionChange?: ((id: string) => void) | undefined;
    /**
     * Called with the search text as it changes, for a host that searches itself and passes the
     * matching `conversations`. Without it, the list keeps the conversations whose title or last
     * message contains the text.
     */
    onSearchChange?: ((query: string) => void) | undefined;
    /** Starts a new conversation. Shows the New chat button. */
    onNew?: (() => void) | undefined;
    /** The conversations are loading: placeholder rows stand in for them. */
    isLoading?: boolean | undefined;
    /** Shown while there are no conversations. Defaults to the provider's `noConversations` string. */
    emptyState?: ReactNode;
    /** Controls at the end of each row, such as a menu of the conversation's commands. */
    renderActions?: ((conversation: ChatConversation) => ReactNode) | undefined;
    /** The clock the times are read against. Defaults to the current time. */
    getNow?: (() => Date) | undefined;
}
/**
 * A list of conversations to open: a search field, a New chat button and a React Aria grid list of
 * rows with an avatar, title, time, last message, muted mark, unread count and the host's actions.
 * One conversation is selected at a time; arrow keys move between rows and into a row's controls.
 */
export declare function ChatList({ conversations, selectedId, onSelectionChange, onSearchChange, onNew, isLoading, emptyState, renderActions, getNow, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, className, ...rest }: ChatListProps): import("react").JSX.Element;
export type { ChatConversation, ChatListParticipant } from './chat-list-row.js';
//# sourceMappingURL=chat-list.d.ts.map