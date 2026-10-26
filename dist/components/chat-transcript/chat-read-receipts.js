import { jsx as _jsx } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { AvatarGroup } from '../avatar-group/avatar-group.js';
import { getDisplayName } from '../avatar/avatar.js';
const hooks = createHooks('chat-read-receipts');
/**
 * The avatars of the people who have read up to a message, under the last message each of them
 * read in a group conversation: a group named `Seen by Ana, Ben and 3 others`, whose avatars form
 * a button that lists everyone in a popover.
 */
export function ChatReadReceipts({ readers, maxVisible = 3, className, ...rest }) {
    const strings = useUiStrings();
    const names = readers.map((reader) => getDisplayName(reader.name, strings.unnamed));
    return (_jsx(AvatarGroup, { ...rest, ...hooks.root({ className, props: rest }), people: readers, maxVisible: maxVisible, size: "xs", action: "list", "aria-label": strings.chatSeenBy(names) }));
}
//# sourceMappingURL=chat-read-receipts.js.map