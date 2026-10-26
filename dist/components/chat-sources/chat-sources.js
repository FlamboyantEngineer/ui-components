import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { ChatSourceSummary } from './chat-source-summary.js';
export { ChatCitation } from './chat-citation.js';
export { createCitationOverride } from './markdown-citations.js';
const hooks = createHooks('chat-sources', ['label', 'list', 'item', 'title', 'site', 'snippet']);
/**
 * The sources an answer drew on, as a numbered list labelled by their count: each one's title
 * (linking to it when it has a URL), its site and a snippet. Numbers match `ChatCitation` markers.
 */
export function ChatSources({ sources, className, id, ...rest }) {
    const strings = useUiStrings();
    const labelId = useId();
    return (_jsxs("div", { ...hooks.root({ className, props: rest }), id: id, children: [_jsx("span", { ...hooks.slot('label'), id: labelId, children: strings.chatSourcesLabel(sources.length) }), _jsx("ol", { ...hooks.slot('list'), "aria-labelledby": labelId, children: sources.map((source) => (_jsx("li", { ...hooks.slot('item'), children: _jsx(ChatSourceSummary, { source: source, slotClass: hooks.slotClass }) }, source.id))) })] }));
}
//# sourceMappingURL=chat-sources.js.map