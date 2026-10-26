import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useRef } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { Modal } from './modal.js';
const hooks = createHooks('modal', ['confirmation-icon', 'message']);
const toneGlyphs = {
    info: 'info',
    success: 'success',
    warning: 'warning',
};
/** The title, led by the tone's glyph or the caller's icon. */
function ConfirmTitle({ title, icon }) {
    if (isEmptyNode(icon))
        return title;
    return (_jsxs(_Fragment, { children: [_jsx(Icon, { ...toIconProps(icon), className: hooks.slotClass('confirmation-icon') }), " ", title] }));
}
/** Runs an action, then closes without reporting a cancel. */
function useClosingAction() {
    const isClosingByAction = useRef(false);
    const toAction = (run) => async (close) => {
        await run?.();
        isClosingByAction.current = true;
        try {
            close();
        }
        finally {
            isClosingByAction.current = false;
        }
    };
    return { isClosingByAction, toAction };
}
/**
 * A yes-or-no decision in a modal alert dialog: a question, what confirming does, Cancel and a
 * confirm action, optionally a third action. Focus starts on Cancel, the safe choice.
 */
export function ModalConfirmation({ message, children, tone = 'neutral', icon = toneGlyphs[tone], title, confirmLabel, cancelLabel, secondaryActionLabel, pendingLabel, onConfirm, onSecondaryAction, onCancel, onOpenChange, autoFocusConfirm = false, className, ...rest }) {
    const strings = useUiStrings();
    const messageId = useId();
    const { isClosingByAction, toAction } = useClosingAction();
    const hasCancel = cancelLabel !== null;
    return (_jsx(Modal, { ...rest, role: "alertdialog", tone: tone, title: _jsx(ConfirmTitle, { title: title, icon: icon }), className: className, "aria-describedby": isEmptyNode(message) ? undefined : messageId, onOpenChange: (isOpen) => {
            if (!isOpen && !isClosingByAction.current)
                onCancel?.();
            onOpenChange?.(isOpen);
        }, cancelAction: hasCancel ? { label: cancelLabel, autoFocus: !autoFocusConfirm } : null, secondaryAction: isEmptyNode(secondaryActionLabel)
            ? undefined
            : { label: secondaryActionLabel, onPress: toAction(onSecondaryAction) }, primaryAction: {
            label: confirmLabel ?? strings.confirm,
            pendingLabel,
            autoFocus: autoFocusConfirm || !hasCancel,
            onPress: toAction(onConfirm),
        }, children: isEmptyNode(message) && isEmptyNode(children) ? null : (_jsxs(_Fragment, { children: [isEmptyNode(message) ? null : (_jsx("p", { ...hooks.slot('message'), id: messageId, children: message })), children] })) }));
}
/**
 * Opens a `ModalConfirmation` through `controller` and resolves `true` when the reader confirms (after
 * `onConfirm` succeeds), `false` when they cancel, take the third action or dismiss it otherwise.
 */
export function confirm(controller, options) {
    const handle = controller.open({
        render: ({ isOpen, onOpenChange, close }) => (_jsx(ModalConfirmation, { ...options, isOpen: isOpen, onOpenChange: onOpenChange, onConfirm: async () => {
                await options.onConfirm?.();
                close(true);
            } })),
    });
    return handle.result.then((value) => value === true);
}
//# sourceMappingURL=modal-confirm.js.map