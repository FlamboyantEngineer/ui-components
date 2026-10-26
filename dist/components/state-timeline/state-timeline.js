import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { VisuallyHidden } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Attribution } from '../attribution/attribution.js';
import { Badge } from '../badge/badge.js';
const hooks = createHooks('state-timeline', [
    'entry',
    'marker',
    'body',
    'header',
    'state',
    'current',
    'attribution',
    'comment',
]);
/** The rows in reading order: the changes, then the states to come, reversed for `descending`. */
function toRows(entries, upcoming, direction) {
    const rows = [
        ...entries.map((entry, index) => ({
            entry,
            status: (index === entries.length - 1 ? 'current' : 'past'),
        })),
        ...upcoming.map((entry) => ({ entry, status: 'upcoming' })),
    ];
    return direction === 'descending' ? rows.reverse() : rows;
}
function Entry({ entry, status, showAvatar, fallbackAfterDays, getNow }) {
    const strings = useUiStrings();
    const isCurrent = status === 'current';
    const hasAttribution = status !== 'upcoming' && (entry.time || entry.person);
    return (_jsxs("li", { ...hooks.slot('entry', { status }), "aria-current": isCurrent ? 'step' : undefined, children: [_jsx("span", { ...hooks.slot('marker'), "aria-hidden": "true" }), _jsxs("div", { ...hooks.slot('body'), children: [_jsxs("div", { ...hooks.slot('header'), children: [_jsx(Badge, { variant: "status", tone: entry.tone ?? 'neutral', announce: false, className: hooks.slotClass('state'), children: entry.label }), isCurrent ? (_jsxs(_Fragment, { children: [' ', _jsx("span", { ...hooks.slot('current'), children: strings.currentState })] })) : null, status === 'upcoming' ? (_jsxs(_Fragment, { children: [' ', _jsx(VisuallyHidden, { elementType: "span", children: strings.upcomingState })] })) : null, hasAttribution ? (_jsx(Attribution, { time: entry.time, person: entry.person, showAvatar: showAvatar, fallbackAfterDays: fallbackAfterDays, getNow: getNow, className: hooks.slotClass('attribution') })) : null] }), isEmptyNode(entry.comment) ? null : _jsx("div", { ...hooks.slot('comment'), children: entry.comment })] })] }));
}
/**
 * A vertical history of the states something went through: each change's state badge, who made it
 * and when, and an optional comment, with the current state marked and the states still to come.
 */
export function StateTimeline({ entries, upcoming = [], direction = 'ascending', showAvatar, fallbackAfterDays, getNow, className, ...rest }) {
    const strings = useUiStrings();
    const named = rest['aria-label'] !== undefined || rest['aria-labelledby'] !== undefined;
    return (_jsx("ol", { "aria-label": named ? undefined : strings.stateHistory, ...rest, ...hooks.root({ className, props: rest, data: { direction } }), children: toRows(entries, upcoming, direction).map(({ entry, status }) => (_jsx(Entry, { entry: entry, status: status, showAvatar: showAvatar, fallbackAfterDays: fallbackAfterDays, getNow: getNow }, `${status === 'upcoming' ? 'upcoming' : 'entry'}:${toKeyIdentity(entry.id)}`))) }));
}
//# sourceMappingURL=state-timeline.js.map