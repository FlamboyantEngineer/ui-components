import type { BaseProps } from '../../core/props.js';
import { type AvatarGroupPerson } from '../avatar-group/avatar-group.js';
/** Someone who has read up to a message. */
export type ChatReader = AvatarGroupPerson;
export interface ChatReadReceiptsProps extends BaseProps {
    /** Who has read up to this message, in the order they read it. */
    readers: readonly ChatReader[];
    /** Show at most this many avatars; the rest join the `+N` count. Defaults to 3. */
    maxVisible?: number | undefined;
}
/**
 * The avatars of the people who have read up to a message, under the last message each of them
 * read in a group conversation: a group named `Seen by Ana, Ben and 3 others`, whose avatars form
 * a button that lists everyone in a popover.
 */
export declare function ChatReadReceipts({ readers, maxVisible, className, ...rest }: ChatReadReceiptsProps): import("react").JSX.Element;
//# sourceMappingURL=chat-read-receipts.d.ts.map