import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// The parts of a tool call's card: the title in its trigger and the body its panel shows.
import { useId, useMemo } from 'react';
import { VisuallyHidden } from '../../primitives/index.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Badge } from '../badge/badge.js';
import { CopyButton } from '../copy-button/copy-button.js';
import { ScrollRegion } from '../scroll-region/scroll-region.js';
import { formatToolValue } from './format-tool-call.js';
import { toolCallHooks as hooks } from './tool-call-hooks.js';
const statusGlyphs = {
    pending: 'clock',
    running: 'refresh',
    'approval-requested': 'hand-raised',
    succeeded: 'success',
    failed: 'error',
    denied: 'no-symbol',
    cancelled: 'x-circle',
};
/** How long the call ran: the short form shown, the long one read by assistive technology. */
function ToolCallDuration({ milliseconds }) {
    const strings = useUiStrings();
    return (_jsxs("span", { ...hooks.slot('duration'), children: [_jsx("span", { "aria-hidden": "true", children: strings.toolCallDuration(milliseconds, 'short') }), _jsx(VisuallyHidden, { elementType: "span", children: strings.toolCallDuration(milliseconds, 'long') })] }));
}
/**
 * The trigger's content: the status glyph, the label, the status, the duration and the badge,
 * spaced so the trigger's name reads them as words.
 */
export function ToolCallTitle({ label, status, durationMs, isAutoApproved }) {
    const strings = useUiStrings();
    return (_jsxs(_Fragment, { children: [_jsx(Glyph, { name: statusGlyphs[status], className: hooks.slotClass('status-glyph') }), _jsx("span", { ...hooks.slot('label'), children: label }), ' ', _jsx("span", { ...hooks.slot('status'), children: strings.toolCallStatus(status) }), durationMs === undefined ? null : (_jsxs(_Fragment, { children: [' ', _jsx(ToolCallDuration, { milliseconds: durationMs })] })), isAutoApproved ? (_jsxs(_Fragment, { children: [' ', _jsx(Badge, { size: "sm", className: hooks.slotClass('badge'), children: strings.toolCallAutoApproved })] })) : null] }));
}
/** A failed call's error, announced as an alert. */
export function ToolCallError({ message }) {
    return (_jsxs("div", { ...hooks.slot('error'), role: "alert", children: [_jsx(Glyph, { name: "error" }), message] }));
}
/** Arguments or a result: a title, a copy button and the formatted JSON in a scrolling view. */
function ToolCallPart({ part, value }) {
    const strings = useUiStrings();
    const titleId = useId();
    const text = useMemo(() => formatToolValue(value), [value]);
    const title = part === 'arguments' ? strings.toolCallArguments : strings.toolCallResult;
    return (_jsxs("div", { ...hooks.slot('part', { part }), children: [_jsxs("div", { ...hooks.slot('part-header'), children: [_jsx("span", { ...hooks.slot('part-title'), id: titleId, children: title }), _jsx(CopyButton, { className: hooks.slotClass('copy'), value: text, label: strings.copyToolCallPart(title), size: "sm", variant: "ghost" })] }), _jsx(ScrollRegion, { className: hooks.slotClass('json'), axis: "both", role: "group", tabIndex: 0, "aria-labelledby": titleId, children: _jsx("pre", { children: _jsx("code", { children: text }) }) })] }));
}
/** The panel's content: the custom body, else the arguments and result, else a note. */
export function ToolCallBody({ args, result, children }) {
    const strings = useUiStrings();
    if (!isEmptyNode(children))
        return children;
    if (args === undefined && result === undefined) {
        return _jsx("p", { ...hooks.slot('empty'), children: strings.toolCallNoDetails });
    }
    return (_jsxs(_Fragment, { children: [args === undefined ? null : _jsx(ToolCallPart, { part: "arguments", value: args }), result === undefined ? null : _jsx(ToolCallPart, { part: "result", value: result })] }));
}
//# sourceMappingURL=tool-call-parts.js.map