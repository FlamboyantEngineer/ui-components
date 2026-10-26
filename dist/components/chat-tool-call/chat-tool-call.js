import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { Disclosure, DisclosurePanel, DisclosureTitle } from '../disclosure/disclosure.js';
import { formatToolName } from './format-tool-call.js';
import { ToolCallApproval } from './tool-call-approval.js';
import { toolCallHooks as hooks } from './tool-call-hooks.js';
import { ToolCallBody, ToolCallError, ToolCallTitle, } from './tool-call-parts.js';
import { useToolCallApproval } from './use-tool-call-approval.js';
/**
 * The card's expanded state. Uncontrolled, it follows the status (open while an approval is
 * requested or the call failed) until the reader toggles it or `defaultExpanded` sets it.
 */
function useToolCallExpansion({ status, isExpanded, defaultExpanded, onExpandedChange, }) {
    const [toggled, setToggled] = useState();
    const followed = status === 'approval-requested' || status === 'failed';
    const shown = isExpanded ?? toggled ?? defaultExpanded ?? followed;
    const setExpanded = (next) => {
        if (isExpanded === undefined)
            setToggled(next);
        onExpandedChange?.(next);
    };
    return [shown, setExpanded];
}
/** The card's trigger, where focus goes when the approval leaves while holding it. */
function findTrigger(root) {
    return root?.querySelector(`.${hooks.slotClass('heading')} button`) ?? null;
}
/**
 * One call of a tool by an assistant, as a collapsible card: a trigger with the status, the label
 * and the duration, a body with the arguments and result as JSON (or a custom body), the error of
 * a failed call, and, when the call asks for approval, Approve, Deny with a reason and Always
 * allow, with keyboard shortcuts, then the decision.
 */
export function ChatToolCall({ id, name, label, status, args, result, error, durationMs, approval, onApprove, onDeny, onAlwaysAllow, isExpanded, defaultExpanded, onExpandedChange, children, className, ...rest }) {
    const rootRef = useRef(null);
    const [expanded, setExpanded] = useToolCallExpansion({
        status,
        isExpanded,
        defaultExpanded,
        onExpandedChange,
    });
    const isPending = status === 'approval-requested' && approval?.decision === undefined;
    const approvalState = useToolCallApproval({ isPending, onApprove, onDeny });
    const title = label ?? formatToolName(name);
    return (_jsxs("div", { ...hooks.root({
            className,
            props: rest,
            data: { status, autoApproved: approval?.isAutoApproved },
        }), id: id, ref: rootRef, "aria-busy": status === 'running' || undefined, onKeyDownCapture: approvalState.onKeyDownCapture, children: [_jsxs(Disclosure, { className: hooks.slotClass('disclosure'), isExpanded: expanded, onExpandedChange: setExpanded, children: [_jsx(DisclosureTitle, { className: hooks.slotClass('heading'), children: _jsx(ToolCallTitle, { label: title, status: status, durationMs: durationMs, isAutoApproved: approval?.isAutoApproved ?? false }) }), _jsx(DisclosurePanel, { className: hooks.slotClass('body'), children: _jsx(ToolCallBody, { args: args, result: result, children: children }) })] }), status === 'failed' && error ? _jsx(ToolCallError, { message: error }) : null, isPending || approval?.decision !== undefined ? (_jsx(ToolCallApproval, { label: title, approval: approval, isPending: isPending, state: approvalState, onApprove: onApprove, onDeny: onDeny, onAlwaysAllow: onAlwaysAllow, getFallbackFocus: () => findTrigger(rootRef.current) })) : null] }));
}
//# sourceMappingURL=chat-tool-call.js.map