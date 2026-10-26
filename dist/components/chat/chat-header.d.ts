import type { ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import type { ChatParticipant } from '../chat-parts/chat-parts.js';
export interface ChatHeaderProps extends BaseProps {
    /** The conversation's name, drawn as a heading. */
    title: string;
    /**
     * The other participants: one shows their avatar with their presence; several stack their
     * avatars, which list everyone with their presence when pressed.
     */
    participants?: readonly ChatParticipant[] | undefined;
    /**
     * A line under the title, such as who is typing or what the assistant is doing. It is shown, not
     * announced, since the conversation announces the same news where it happens.
     */
    status?: string | undefined;
    /** Controls at the end, such as the conversation's commands. */
    actions?: ReactNode;
}
/**
 * The top of a conversation: the other participants' avatars with their presence, the title as a
 * heading at the level its section gives, a line saying who is typing or what the assistant is
 * doing, and the host's controls.
 */
export declare function ChatHeader({ title, participants, status, actions, className, id, ...rest }: ChatHeaderProps): import("react").JSX.Element;
//# sourceMappingURL=chat-header.d.ts.map