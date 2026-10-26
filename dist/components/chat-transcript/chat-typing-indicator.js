import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { getDisplayName } from '../avatar/avatar.js';
const hooks = createHooks('chat-typing-indicator', ['dots', 'dot', 'text']);
const dotKeys = ['first', 'second', 'third'];
/**
 * Says who is typing (`Ana is typing…`, `Ana and Ben are typing…`, `Ana and 2 others are
 * typing…`) beside three decorative dots a stylesheet animates. It is a polite status: keep it
 * mounted, empty while nobody types, so changes are announced.
 */
export function ChatTypingIndicator({ names = [], className, ...rest }) {
    const strings = useUiStrings();
    const displayNames = names.map((name) => getDisplayName(name, strings.unnamed));
    const text = displayNames.length > 0 ? strings.chatTyping(displayNames) : null;
    return (_jsx("div", { ...rest, ...hooks.root({ className, props: rest, data: { empty: text === null } }), role: "status", children: text === null ? null : (_jsxs(_Fragment, { children: [_jsx("span", { ...hooks.slot('dots'), "aria-hidden": "true", children: dotKeys.map((key) => (_jsx("span", { ...hooks.slot('dot') }, key))) }), _jsx("span", { ...hooks.slot('text'), children: text })] })) }));
}
//# sourceMappingURL=chat-typing-indicator.js.map