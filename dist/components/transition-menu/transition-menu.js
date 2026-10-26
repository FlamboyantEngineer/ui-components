import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Badge } from '../badge/badge.js';
import { Button } from '../button/button.js';
import { Menu, MenuPopover, MenuTrigger } from '../menu/menu.js';
import { StatusLight } from '../status-light/status-light.js';
import { TransitionDialog } from './transition-dialog.js';
const hooks = createHooks('transition-menu', ['trigger', 'badge', 'transition', 'comment']);
function findState(states, key) {
    return states.find((state) => state.id === key) ?? { id: key, label: String(key) };
}
/** A transition as a menu item: its name, the target state's light, and a reason or description. */
function toMenuItem(transition, states) {
    const target = findState(states, transition.to);
    const tone = target.tone ?? 'neutral';
    return {
        id: transition.id,
        label: transition.label ?? target.label,
        description: transition.disabledReason ?? transition.description,
        // Unavailable transitions stay reachable by arrow keys, so their reason can be read.
        isDisabled: transition.disabledReason !== undefined,
        focusableWhenDisabled: true,
        icon: _jsx(StatusLight, { tone: tone, size: "sm" }),
        className: hooks.slotClass('transition'),
        'data-target-tone': tone,
    };
}
/** Runs a transition straight away, publishing the pending state while a returned promise runs. */
function usePendingRun(onTransition) {
    const [isPending, setPending] = useState(false);
    const run = async (change) => {
        setPending(true);
        try {
            await onTransition(change);
        }
        catch {
            // The caller reports a failed transition; the state it passes back stays the current one.
        }
        finally {
            setPending(false);
        }
    };
    return { isPending, run };
}
/**
 * A record's current state as a badge that opens a menu of the states it may move to: each allowed
 * transition with its target's tone, a description, or the reason it is unavailable. A transition
 * may ask for confirmation or a required comment in a dialog before it runs.
 */
export function TransitionMenu({ states, value, transitions, onTransition, label, isDisabled = false, className, id, ...rest }) {
    const strings = useUiStrings();
    const current = findState(states, value);
    const { isPending, run } = usePendingRun(onTransition);
    const [dialog, setDialog] = useState(null);
    const badge = (_jsx(Badge, { tone: current.tone ?? 'neutral', className: hooks.slotClass('badge'), children: current.label }));
    const choose = (key) => {
        const transition = transitions.find((entry) => entry.id === key);
        if (!transition || transition.disabledReason !== undefined)
            return;
        if (transition.confirmMessage === undefined && !transition.requiresComment) {
            void run({ transition: transition.id, to: transition.to });
            return;
        }
        const state = findState(states, transition.to).label;
        const target = {
            state,
            action: transition.label ?? strings.transitionTo(state),
            message: transition.confirmMessage,
            requiresComment: transition.requiresComment ?? false,
        };
        setDialog({ transition, target, isOpen: true });
    };
    const data = { pending: isPending, disabled: isDisabled, readonly: transitions.length === 0 };
    return (_jsxs("span", { id: id, ...hooks.root({ className, props: rest, data }), children: [transitions.length === 0 ? (badge) : (_jsxs(MenuTrigger, { children: [_jsx(Button, { variant: "bare", className: hooks.slotClass('trigger'), "aria-label": strings.stateTrigger(label ?? strings.status, current.label), endIcon: "chevron-down", isDisabled: isDisabled, isPending: isPending, children: badge }), _jsx(MenuPopover, { placement: "bottom start", children: _jsx(Menu, { "aria-label": label ?? strings.status, items: transitions.map((transition) => toMenuItem(transition, states)), onAction: choose }) })] })), _jsx(TransitionDialog, { target: dialog?.target ?? null, isOpen: dialog?.isOpen ?? false, onClose: () => setDialog((open) => open && { ...open, isOpen: false }), onConfirm: (comment) => dialog
                    ? onTransition({ transition: dialog.transition.id, to: dialog.transition.to, comment })
                    : undefined, commentClassName: hooks.slotClass('comment') })] }));
}
//# sourceMappingURL=transition-menu.js.map