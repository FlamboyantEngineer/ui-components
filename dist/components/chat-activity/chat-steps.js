import { jsx as _jsx } from "react/jsx-runtime";
import { Children } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { ActivityDisclosure } from './activity-disclosure.js';
import { toWholeSeconds } from './chat-activity.js';
const hooks = createHooks('chat-steps', ['trigger', 'indicator', 'label', 'spinner', 'panel']);
/**
 * The consecutive reasoning and tool calls of one reply folded into one disclosure. While the run
 * goes on it is open (unless it does not expand automatically), labelled by its `title` or "Working…"
 * with the number of steps; once the run ends it collapses,
 * labelled with how long it took. The reader's own choice wins over both.
 */
export function ChatSteps({ isRunning = false, title, durationMs, stepCount, children, className, ...rest }) {
    const strings = useUiStrings();
    const count = stepCount ?? Children.toArray(children).length;
    const label = isRunning
        ? title || strings.chatStepsRunning(count)
        : strings.chatStepsComplete(count, toWholeSeconds(durationMs));
    return (_jsx(ActivityDisclosure, { ...rest, className: className, hooks: hooks, isActive: isRunning, label: label, data: { running: isRunning }, children: children }));
}
//# sourceMappingURL=chat-steps.js.map