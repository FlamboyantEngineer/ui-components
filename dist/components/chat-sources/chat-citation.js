import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { HoverCard, HoverCardTrigger } from '../hover-card/hover-card.js';
import { Link } from '../link/link.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { ChatSourceSummary, isExternalUrl } from './chat-source-summary.js';
const hooks = createHooks('chat-citation', ['marker', 'card', 'title', 'site', 'snippet']);
/**
 * An inline numbered marker (`[1]`) for a source. It links to the source and previews it in a
 * `HoverCard` on hover, keyboard focus and long press; a source without a URL opens its card on
 * press instead.
 */
export function ChatCitation({ source, index, className, id, ...rest }) {
    const strings = useUiStrings();
    const [isOpen, setOpen] = useState(false);
    const rootProps = { ...hooks.root({ className, props: rest }), id };
    const content = (_jsxs(_Fragment, { children: [_jsx("span", { ...hooks.slot('marker'), "aria-hidden": "true", children: `[${index}]` }), _jsx(VisuallyHidden, { elementType: "span", children: strings.chatCitationLabel(index, source.title) })] }));
    return (_jsxs(HoverCardTrigger, { isOpen: isOpen, onOpenChange: setOpen, children: [source.url ? (_jsx(Link, { ...rootProps, href: source.url, isExternal: isExternalUrl(source.url), underline: "hover", children: content })) : (_jsx(Button, { ...rootProps, variant: "bare", content: "parts", onPress: () => setOpen(true), children: content })), _jsx(HoverCard, { className: hooks.slotClass('card'), "aria-label": source.title, children: _jsx(ChatSourceSummary, { source: source, slotClass: hooks.slotClass }) })] }));
}
//# sourceMappingURL=chat-citation.js.map