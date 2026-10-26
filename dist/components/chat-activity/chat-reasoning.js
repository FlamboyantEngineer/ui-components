import { jsx as _jsx } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Markdown } from '../markdown/markdown.js';
import { ActivityDisclosure } from './activity-disclosure.js';
import { toWholeSeconds, } from './chat-activity.js';
const hooks = createHooks('chat-reasoning', [
    'trigger',
    'indicator',
    'label',
    'spinner',
    'panel',
    'text',
]);
/**
 * An assistant's reasoning as a disclosure. While it streams it is open (unless it does not expand
 * automatically), labelled by its `title` or "Thinking…" and busy, with the text coming in; once
 * complete it collapses, labelled with how long it took. The reader's own choice wins over both.
 */
export function ChatReasoning({ text, title, status, durationMs, format = 'markdown', className, ...rest }) {
    const strings = useUiStrings();
    const isStreaming = status === 'streaming';
    const label = isStreaming
        ? title || strings.chatReasoningStreaming
        : strings.chatReasoningComplete(toWholeSeconds(durationMs));
    return (_jsx(ActivityDisclosure, { ...rest, className: className, hooks: hooks, isActive: isStreaming, isPanelBusy: isStreaming, label: label, data: { status, format }, children: format === 'markdown' ? (_jsx(Markdown, { source: text, isStreaming: isStreaming, className: hooks.slotClass('text') })) : (_jsx("div", { ...hooks.slot('text'), children: text })) }));
}
//# sourceMappingURL=chat-reasoning.js.map