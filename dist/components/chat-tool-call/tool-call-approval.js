import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// A tool call's approval: the request with its buttons and deny reason form, then the decision.
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Form } from '../form/form.js';
import { TextField } from '../text-field/text-field.js';
import { toolCallHooks as hooks } from './tool-call-hooks.js';
/**
 * Whether focus is inside the approval. Only a move to another element clears it: focus that
 * drops to the page because its element left keeps the resolved buttons, so it can return there.
 */
function useFocusWithin() {
    const [hasFocus, setHasFocus] = useState(false);
    return {
        hasFocus,
        onFocus: () => setHasFocus(true),
        onBlur: (event) => {
            const next = event.relatedTarget;
            if (next instanceof Node && !event.currentTarget.contains(next))
                setHasFocus(false);
        },
    };
}
/** Moves focus to the fallback when the approval leaves the page while it holds focus. */
function useFocusRescue(getFallbackFocus) {
    const containerRef = useRef(null);
    const fallbackRef = useRef(getFallbackFocus);
    useLayoutEffect(() => {
        fallbackRef.current = getFallbackFocus;
    });
    useLayoutEffect(() => {
        const container = containerRef.current;
        return () => {
            if (container?.contains(document.activeElement))
                fallbackRef.current()?.focus();
        };
    }, []);
    return containerRef;
}
/**
 * Approve, Deny and Always allow, each for its callback; `aria-disabled` once resolved. The
 * shortcuts stay published on resolved buttons, as on any disabled command, which keeps each
 * button's tooltip wrapper and so the focused element itself.
 */
function ApprovalActions({ approval, isPending, state, onApprove, onDeny, onAlwaysAllow, }) {
    const strings = useUiStrings();
    const common = {
        size: 'sm',
        className: hooks.slotClass('action'),
        isDisabled: !isPending,
        focusableWhenDisabled: true,
    };
    return (_jsxs("div", { ...hooks.slot('actions'), children: [onApprove ? (_jsx(Button, { ...common, variant: "primary", "data-action": "approve", shortcut: "Ctrl+Enter", onPress: onApprove, children: strings.approve })) : null, onDeny ? (_jsx(Button, { ...common, ref: state.denyRef, "data-action": "deny", shortcut: "Escape", onPress: state.openDenyForm, children: strings.toolCallDeny })) : null, onAlwaysAllow ? (_jsx(Button, { ...common, "data-action": "always", onPress: onAlwaysAllow, children: strings.toolCallAlwaysAllow(approval?.scopeLabel) })) : null] }));
}
/** The optional reason for a denial, with Send and Cancel. */
function DenyForm({ state }) {
    const strings = useUiStrings();
    return (_jsxs(Form, { className: hooks.slotClass('deny-form'), onSubmit: (event) => {
            event.preventDefault();
            state.sendDenial();
        }, children: [_jsx(TextField, { className: hooks.slotClass('reason'), label: strings.toolCallDenyReason, value: state.reason, onChange: state.setReason, autoFocus: true }), _jsx(Button, { type: "submit", size: "sm", variant: "danger", children: strings.send }), _jsx(Button, { size: "sm", onPress: state.closeDenyForm, children: strings.cancel })] }));
}
/**
 * The approval: while pending, the request and its buttons (or the deny reason form); once
 * resolved, the decision in a status. Resolved buttons stay, `aria-disabled`, while focus is on
 * them, and focus moves to the fallback when the approval leaves while holding it.
 */
export function ToolCallApproval({ label, getFallbackFocus, ...props }) {
    const strings = useUiStrings();
    const { approval, isPending, state } = props;
    const promptId = useId();
    const decisionId = useId();
    const focus = useFocusWithin();
    const containerRef = useFocusRescue(getFallbackFocus);
    const decision = approval?.decision;
    const showsActions = isPending || focus.hasFocus;
    return (_jsxs("div", { ...hooks.slot('approval', { decision }), ref: containerRef, role: "group", "aria-labelledby": isPending ? promptId : decisionId, onFocus: focus.onFocus, onBlur: focus.onBlur, children: [isPending ? (_jsx("p", { ...hooks.slot('prompt'), id: promptId, children: strings.toolCallApprovalPrompt(label) })) : null, state.isDenying ? _jsx(DenyForm, { state: state }) : null, showsActions && !state.isDenying ? _jsx(ApprovalActions, { ...props }) : null, _jsx("div", { ...hooks.slot('decision'), id: decisionId, role: "status", children: decision ? strings.toolCallDecision(decision, approval?.reason) : null })] }));
}
//# sourceMappingURL=tool-call-approval.js.map