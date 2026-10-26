import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useState } from 'react';
import { VisuallyHidden } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { ActivityAnnouncer } from './activity-announcer.js';
import { countDoneSteps, listChangedSteps, mapStepStatuses, } from './chat-activity.js';
const hooks = createHooks('chat-plan', [
    'header',
    'title',
    'progress',
    'list',
    'step',
    'glyph',
    'spinner',
    'label',
]);
/** The glyph of each settled or waiting status; a step in progress shows a spinner instead. */
const statusGlyphs = {
    pending: 'pending',
    done: 'success',
    failed: 'error',
    skipped: 'skipped',
};
/**
 * The announcement of the steps whose status changed since the last one announced. A step's status
 * at the first render, or a step added as pending, is not a change.
 */
function usePlanAnnouncement(steps) {
    const strings = useUiStrings();
    const [announced, setAnnounced] = useState(() => mapStepStatuses(steps));
    const changes = listChangedSteps(steps, announced);
    return {
        message: changes.length > 0 ? strings.chatPlanChanged(changes) : '',
        onAnnounce: () => setAnnounced(mapStepStatuses(steps)),
    };
}
/** One step: its status glyph or spinner, its label and the status words read after it. */
function ChatPlanItem({ step }) {
    const strings = useUiStrings();
    const { status } = step;
    return (_jsxs("li", { ...hooks.slot('step', { status }), "aria-current": status === 'in-progress' ? 'step' : undefined, children: [status === 'in-progress' ? (_jsx("span", { ...hooks.slot('spinner'), "aria-hidden": "true" })) : (_jsx(Glyph, { name: statusGlyphs[status], className: hooks.slotClass('glyph') })), _jsx("span", { ...hooks.slot('label'), children: step.label }), ' ', _jsx(VisuallyHidden, { elementType: "span", children: strings.chatPlanStepStatus(status) })] }));
}
/**
 * An assistant's plan: an optional title, how many steps are done, and the ordered steps, each with
 * a status glyph and status words, the one in progress marked as the current step. Status changes
 * are announced politely, at most one announcement every two seconds.
 */
export function ChatPlan({ title, steps, className, ...rest }) {
    const strings = useUiStrings();
    const titleId = useId();
    const progressId = useId();
    const announcement = usePlanAnnouncement(steps);
    return (_jsxs("div", { ...rest, ...hooks.root({ className, props: rest }), children: [_jsxs("div", { ...hooks.slot('header'), children: [title ? (_jsx("span", { ...hooks.slot('title'), id: titleId, children: title })) : null, ' ', _jsx("span", { ...hooks.slot('progress'), id: progressId, children: strings.chatPlanProgress(countDoneSteps(steps), steps.length) })] }), _jsx("ol", { ...hooks.slot('list'), "aria-label": title ? undefined : strings.chatPlan, "aria-labelledby": title ? titleId : undefined, "aria-describedby": progressId, children: steps.map((step) => (_jsx(ChatPlanItem, { step: step }, step.id))) }), _jsx(ActivityAnnouncer, { ...announcement })] }));
}
//# sourceMappingURL=chat-plan.js.map