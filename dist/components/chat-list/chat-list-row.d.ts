import type { ReactNode } from 'react';
import { type AvatarIdentity } from '../avatar/avatar.js';
/** One person in a conversation. */
export interface ChatListParticipant extends AvatarIdentity {
    /** Stable id, used to keep each person's avatar across renders. */
    id: string;
    /** A presence word the stylesheet draws on the avatar, such as `online` or `away`. */
    presence?: string | undefined;
    /** The presence in words, read after the person's name, such as "Online". */
    presenceLabel?: string | undefined;
}
/** One conversation in a `ChatList`. */
export interface ChatConversation {
    /** Stable id, reported on selection. */
    id: string;
    /** The conversation's name: the other person's, or the group's. */
    title: string;
    /** The last message, shown on one line. */
    lastMessage?: string | undefined;
    /** When the last message arrived: an ISO 8601 date and time, read relative to now. */
    time?: string | undefined;
    /** How many messages the reader has not read; a badge shows the count above zero. */
    unreadCount?: number | undefined;
    /** Who takes part: one shows their avatar and presence, several stack their avatars. */
    participants?: readonly ChatListParticipant[] | undefined;
    /** A picture or initials for the conversation itself, such as a named group's. Wins over the participants. */
    avatar?: AvatarIdentity | undefined;
    /** The reader turned the conversation's notifications off. */
    isMuted?: boolean | undefined;
}
export interface ChatListRowProps {
    conversation: ChatConversation;
    renderActions: ((conversation: ChatConversation) => ReactNode) | undefined;
    getNow: () => Date;
}
export declare const listHooks: import("../../core/hooks.js").ComponentHooks<"header" | "search" | "time" | "title" | "muted" | "empty" | "actions" | "conversation" | "unread" | "list" | "new" | "skeleton" | "avatar" | "preview">;
/**
 * One conversation: its avatar, title, relative time, last message, muted mark, unread count and
 * the host's actions. The row is named by its title, presence, unread count, muted state and time,
 * then the last message.
 */
export declare function ChatListRow({ conversation, renderActions, getNow }: ChatListRowProps): import("react").JSX.Element;
//# sourceMappingURL=chat-list-row.d.ts.map