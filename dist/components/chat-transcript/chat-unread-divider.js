import { jsx as _jsx } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
const hooks = createHooks('chat-unread-divider', ['label']);
/**
 * Marks where the messages the reader has not seen yet begin (`New messages`). It has no role, so
 * it may sit between the articles of a feed.
 */
export function ChatUnreadDivider({ className, ...rest }) {
    const strings = useUiStrings();
    return (_jsx("div", { ...rest, ...hooks.root({ className, props: rest }), children: _jsx("span", { ...hooks.slot('label'), children: strings.chatNewMessages }) }));
}
//# sourceMappingURL=chat-unread-divider.js.map