import { jsx as _jsx } from "react/jsx-runtime";
import { DialogTrigger } from '../../primitives/index.js';
import { createHooks, splitDataAttributes } from '../../core/hooks.js';
import { ModalDialog } from './modal-dialog.js';
import { AnchoredModal, BlockingModal, FloatingModal, resolveDismissal, useModalOpenState, } from './modal-presentations.js';
const hooks = createHooks('modal');
/**
 * A blocking dialog over the page: title, body and a footer with Cancel, secondary and primary
 * actions. Focus moves in on open, stays inside while open and returns to where it was on close.
 * Escape closes it, and Control+Enter (or Command+Enter) runs the primary action. It can also float
 * over the page without blocking it (`isNonModal`) or open as a popover against its trigger
 * (`placement`).
 */
export function Modal({ isOpen, defaultOpen, onOpenChange, isDismissable = false, isKeyboardDismissDisabled = false, isDismissDisabled = false, shouldCloseOnInteractOutside, isNonModal = false, placement, tone = 'neutral', size = 'md', bodyLayout = 'block', initialFocus = 'first', className, ...rest }) {
    const ownState = useModalOpenState({ isOpen, defaultOpen, onOpenChange });
    const [, dialogProps] = splitDataAttributes(rest);
    const isFloating = isNonModal && !placement;
    const rootProps = hooks.root({
        className,
        props: rest,
        data: { layer: placement ? 'dropdown' : 'modal', tone, size, bodyLayout, nonModal: isFloating },
    });
    const dismissal = resolveDismissal({
        isDismissable,
        isKeyboardDismissDisabled,
        isDismissDisabled,
        shouldCloseOnInteractOutside,
    });
    const dialog = (_jsx(ModalDialog, { ...dialogProps, 
        // React Aria's popover takes the dialog role itself unless it holds a `role="dialog"`.
        role: placement ? 'dialog' : dialogProps.role, tone: tone, initialFocus: initialFocus, isDismissDisabled: isDismissDisabled, canEscape: !dismissal.isKeyboardDismissDisabled, isFloating: isFloating }));
    if (placement) {
        return (_jsx(AnchoredModal, { ...dismissal, state: ownState, rootProps: rootProps, placement: placement, children: dialog }));
    }
    if (isFloating) {
        return (_jsx(FloatingModal, { state: ownState, rootProps: rootProps, children: dialog }));
    }
    return (_jsx(BlockingModal, { ...dismissal, state: ownState, rootProps: rootProps, children: dialog }));
}
/**
 * Opens the `Modal` among its children when its trigger, such as a `Button`, is pressed, and
 * returns focus to the trigger when it closes.
 */
export function ModalTrigger({ children, ...openState }) {
    return _jsx(DialogTrigger, { ...openState, children: children });
}
export { isModalPrimaryShortcut } from './modal-shortcut.js';
export { confirm } from './modal-confirm.js';
export { alert, prompt } from './modal-prompts.js';
//# sourceMappingURL=modal.js.map