import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Button as AriaButton } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { getDisplayName } from '../avatar/avatar.js';
const hooks = createHooks('chat-quote', ['author', 'excerpt']);
/**
 * A quoted message: its author and an excerpt, in a `<blockquote>`, or in a button named after
 * both when `onPress` makes it jump to the original. Used in a reply and in a composer's reply
 * banner.
 */
export function ChatQuote({ authorName, excerpt, onPress, className, ...rest }) {
    const strings = useUiStrings();
    const name = getDisplayName(authorName, strings.unnamed);
    const rootProps = { ...rest, ...hooks.root({ className, props: rest }) };
    const parts = (_jsxs(_Fragment, { children: [_jsx("span", { ...hooks.slot('author'), children: name }), ' ', _jsx("span", { ...hooks.slot('excerpt'), children: excerpt })] }));
    if (!onPress)
        return _jsx("blockquote", { ...rootProps, children: parts });
    return (_jsx(AriaButton, { ...rootProps, "aria-label": strings.chatQuoteLabel(name, excerpt), onPress: onPress, children: parts }));
}
//# sourceMappingURL=chat-quote.js.map