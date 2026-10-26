import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Button } from '../button/button.js';
const hooks = createHooks('modal', [
    'footer',
    'footer-content',
    'message',
    'actions',
    'cancel',
    'secondary',
    'primary',
]);
/** The one message the footer shows: `error`, else an action's failure, as an alert; else `status`. */
function resolveFooterMessage(error, failure, status) {
    const alert = isEmptyNode(error) ? failure : error;
    const message = isEmptyNode(alert)
        ? { tone: 'neutral', content: status }
        : { tone: 'danger', content: alert };
    return message;
}
/** Cancel shows by default beside a built-in action, alone when given, and never when `null`. */
function isCancelShown({ cancelAction, primaryAction, secondaryAction }) {
    if (cancelAction === null)
        return false;
    return cancelAction !== undefined || primaryAction !== undefined || secondaryAction !== undefined;
}
function CancelButton({ action, isDismissDisabled, onPress, }) {
    const strings = useUiStrings();
    const { label, className, ...buttonProps } = action;
    return (_jsx(Button, { ...buttonProps, className: mergeClassNames(hooks.slotClass('cancel'), className), variant: "secondary", isDisabled: isDismissDisabled, onPress: onPress, children: label ?? strings.cancel }));
}
function FooterActionButton({ slot, action, defaultVariant, actionState, }) {
    const { label, onPress: _onPress, variant, isDisabled, isPending, className, ...buttonProps } = action;
    const isOtherRunning = actionState.running !== null && actionState.running !== slot;
    return (_jsx(Button, { ...buttonProps, className: mergeClassNames(hooks.slotClass(slot), className), variant: variant ?? defaultVariant, isDisabled: Boolean(isDisabled) || isOtherRunning, isPending: actionState.running === slot || Boolean(isPending), onPress: () => actionState.run(slot), children: label }));
}
/** Cancel, the secondary action and the primary action, so the primary action is rightmost. */
function BuiltInActions(props) {
    const { primaryAction, secondaryAction, cancelAction, tone, isDismissDisabled, actionState } = props;
    return (_jsxs(_Fragment, { children: [isCancelShown(props) ? (_jsx(CancelButton, { action: cancelAction ?? {}, isDismissDisabled: isDismissDisabled, onPress: actionState.close })) : null, secondaryAction ? (_jsx(FooterActionButton, { slot: "secondary", action: secondaryAction, defaultVariant: "secondary", actionState: actionState })) : null, primaryAction ? (_jsx(FooterActionButton, { slot: "primary", action: primaryAction, defaultVariant: tone === 'danger' ? 'danger' : 'primary', actionState: actionState })) : null] }));
}
/** The footer: caller content, the status or error message, and the action bar. */
export function ModalFooter({ actions, footerContent, status, error, ref, ...builtIn }) {
    const message = resolveFooterMessage(error, builtIn.actionState.failure, status);
    const hasActionBar = actions !== undefined ||
        isCancelShown(builtIn) ||
        Boolean(builtIn.primaryAction || builtIn.secondaryAction);
    if (!hasActionBar && isEmptyNode(footerContent) && isEmptyNode(message.content))
        return null;
    return (_jsxs("div", { ref: ref, ...hooks.slot('footer'), children: [isEmptyNode(footerContent) ? null : (_jsx("div", { ...hooks.slot('footer-content'), children: footerContent })), isEmptyNode(message.content) ? null : (_jsx("div", { ...hooks.slot('message', { tone: message.tone }), role: message.tone === 'danger' ? 'alert' : 'status', "aria-atomic": "true", children: message.content }, message.tone)), hasActionBar ? (_jsx("div", { ...hooks.slot('actions'), children: actions !== undefined ? actions : _jsx(BuiltInActions, { ...builtIn }) })) : null] }));
}
//# sourceMappingURL=modal-footer.js.map