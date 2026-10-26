import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext, useId, useLayoutEffect, useRef, useState, } from 'react';
import { Dialog, OverlayTriggerStateContext } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { InitialFocus, useFocusReturn } from './modal-focus.js';
import { ModalFooter } from './modal-footer.js';
import { ModalHeader } from './modal-header.js';
import { claimPrimaryShortcut } from './modal-shortcut.js';
import { useModalActions } from './use-modal-actions.js';
const hooks = createHooks('modal', ['dialog', 'body']);
function ModalBody({ children, renderProps, ref, }) {
    if (children === undefined || children === null)
        return null;
    return (_jsx("div", { ref: ref, ...hooks.slot('body'), children: typeof children === 'function' ? children(renderProps) : children }));
}
/**
 * Escape that would close the dialog: the caller may refuse it; a floating dialog closes itself,
 * and a blocking one leaves it to React Aria's overlay above. A refused Escape stops here.
 */
function handleEscape(event, options) {
    if (!options.canEscape || event.nativeEvent.isComposing)
        return;
    const isRefused = options.shouldCloseOnEscape?.() === false;
    if (!isRefused && !options.isFloating)
        return;
    event.stopPropagation();
    event.preventDefault();
    if (!isRefused)
        options.close();
}
/** Runs the primary action on Control+Enter when it can run. */
function handlePrimaryShortcut(event, { actionState, hasCustomActions }) {
    if (!claimPrimaryShortcut(event) || hasCustomActions)
        return;
    if (!actionState.canRun('primary'))
        return;
    event.preventDefault();
    actionState.run('primary');
}
/** What function children receive: `close`, and the primary action unless `actions` replace it. */
function toRenderProps(actionState, hasCustomActions) {
    return {
        close: actionState.close,
        runPrimaryAction: () => {
            if (!hasCustomActions)
                actionState.run('primary');
        },
    };
}
/** Calls `onExitComplete` when the dialog leaves the page after closing, not when torn down open. */
function useExitComplete(onExitComplete) {
    const isOpen = useContext(OverlayTriggerStateContext)?.isOpen ?? true;
    const latest = useRef({ isOpen, onExitComplete });
    useLayoutEffect(() => {
        latest.current = { isOpen, onExitComplete };
    });
    useLayoutEffect(() => () => {
        if (!latest.current.isOpen)
            latest.current.onExitComplete?.();
    }, []);
}
/** The dialog element: header, body and footer, with its focus, Escape and shortcut handling. */
export function ModalDialog({ title, description, headerActions, showCloseButton, children, initialFocus, finalFocus, isDismissDisabled, canEscape, isFloating, shouldCloseOnEscape, onExitComplete, role, id, 'aria-label': ariaLabel, 'aria-describedby': ariaDescribedby, onKeyDown: onCallerKeyDown, ...footer }) {
    const descriptionId = useId();
    const dialogRef = useRef(null);
    const bodyRef = useRef(null);
    const footerRef = useRef(null);
    // A floating dialog returns focus itself, to the element focused when it opened.
    const [opener] = useState(() => (isFloating ? document.activeElement : null));
    const actionState = useModalActions(footer);
    useFocusReturn({ containerRef: dialogRef, finalFocus, fallback: opener });
    useExitComplete(onExitComplete);
    const hasCustomActions = footer.actions !== undefined;
    const onKeyDown = (event) => {
        if (event.key === 'Escape') {
            handleEscape(event, { canEscape, isFloating, shouldCloseOnEscape, close: actionState.close });
            return;
        }
        handlePrimaryShortcut(event, { actionState, hasCustomActions });
        if (!event.defaultPrevented)
            onCallerKeyDown?.(event);
    };
    return (_jsxs(Dialog, { ref: dialogRef, id: id, role: role, className: hooks.slotClass('dialog'), "aria-label": ariaLabel, "aria-describedby": isEmptyNode(description) ? ariaDescribedby : descriptionId, 
        // React Aria's Dialog forwards no keyboard handlers, so the listener goes on its element.
        render: (props) => _jsx("section", { ...props, onKeyDown: onKeyDown }), children: [_jsx(ModalHeader, { title: title, description: description, descriptionId: descriptionId, headerActions: headerActions, showCloseButton: showCloseButton, isDismissDisabled: isDismissDisabled, onClose: actionState.close }), _jsx(ModalBody, { ref: bodyRef, renderProps: toRenderProps(actionState, hasCustomActions), children: children }), _jsx(ModalFooter, { ...footer, ref: footerRef, actionState: actionState, isDismissDisabled: isDismissDisabled }), initialFocus === 'dialog' ? null : (_jsx(InitialFocus, { dialogRef: dialogRef, bodyRef: bodyRef, footerRef: footerRef, target: initialFocus === 'first' ? undefined : initialFocus }))] }));
}
//# sourceMappingURL=modal-dialog.js.map