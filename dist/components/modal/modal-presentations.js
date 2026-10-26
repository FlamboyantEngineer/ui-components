import { jsx as _jsx } from "react/jsx-runtime";
import { useContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Modal as AriaModal, ModalOverlay, OverlayTriggerStateContext, } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks, dataAttributes } from '../../core/hooks.js';
import { useEnterExit } from '../../utils/use-enter-exit.js';
import { PopoverPanel } from '../popover/popover.js';
import { useLayerZIndex } from '../portal/portal.js';
const hooks = createHooks('modal', ['panel']);
/** How the dialog may be dismissed: `isDismissDisabled` refuses outside presses and Escape. */
export function resolveDismissal({ isDismissDisabled, ...dismissal }) {
    return {
        ...dismissal,
        isDismissable: dismissal.isDismissable && !isDismissDisabled,
        isKeyboardDismissDisabled: dismissal.isKeyboardDismissDisabled || isDismissDisabled,
    };
}
/** An open state from whether it is open and how to change it. */
function toModalOpenState(isOpen, change) {
    const setOpen = (next) => {
        if (next !== isOpen)
            change(next);
    };
    return {
        isOpen,
        setOpen,
        open: () => setOpen(true),
        close: () => setOpen(false),
        toggle: () => setOpen(!isOpen),
        // A dialog opens against its trigger or the viewport, never at a pointer position.
        point: null,
        setPoint: () => { },
    };
}
/**
 * The open state of a dialog: its own, controlled or from `defaultOpen`, or else the state of the
 * enclosing `DialogTrigger`. A change the dialog makes to a trigger's state (Cancel, Escape, an
 * outside press, an action) also reaches the dialog's own `onOpenChange`.
 */
export function useModalOpenState({ isOpen, defaultOpen, onOpenChange, }) {
    const trigger = useContext(OverlayTriggerStateContext);
    const [own, setOwn] = useControllableState(isOpen, defaultOpen ?? false, onOpenChange);
    if (trigger && isOpen === undefined && defaultOpen === undefined) {
        return toModalOpenState(trigger.isOpen, (next) => {
            trigger.setOpen(next);
            onOpenChange?.(next);
        });
    }
    return toModalOpenState(own, setOwn);
}
/**
 * A dialog over a page it blocks (React Aria `ModalOverlay` and `Modal`): the overlay covers the
 * viewport on the `modal` layer, focus stays inside, and the page is hidden and inert. The overlay
 * follows the dialog's open state, so every close goes through it.
 */
export function BlockingModal({ state, rootProps, children, ...overlay }) {
    const zIndex = useLayerZIndex('modal');
    return (_jsx(ModalOverlay, { isOpen: state.isOpen, onOpenChange: state.setOpen, ...overlay, ...rootProps, style: { position: 'fixed', inset: 0, zIndex }, children: _jsx(AriaModal, { className: hooks.slotClass('panel'), children: children }) }));
}
/**
 * A dialog floating over a page it does not block: no focus trap, no hidden or inert content, and
 * the overlay lets pointer presses through to the page around the panel. It enters and exits with
 * the panel's animations.
 */
export function FloatingModal({ state, rootProps, children }) {
    const zIndex = useLayerZIndex('modal');
    const panelRef = useRef(null);
    const { isMounted, isEntering, isExiting } = useEnterExit(panelRef, state.isOpen);
    if (!isMounted || typeof document === 'undefined')
        return null;
    const phase = { entering: isEntering, exiting: isExiting };
    return createPortal(_jsx("div", { ...rootProps, ...dataAttributes(phase), style: { position: 'fixed', inset: 0, zIndex, pointerEvents: 'none' }, children: _jsx("div", { ref: panelRef, ...hooks.slot('panel', phase), style: { pointerEvents: 'auto' }, children: _jsx(OverlayTriggerStateContext.Provider, { value: state, children: children }) }) }), document.body);
}
/**
 * A dialog anchored to the trigger of its `DialogTrigger` in the popover panel on the `dropdown`
 * layer (React Aria `Popover`), which traps focus, hides the page from assistive technology and
 * returns focus on close.
 */
export function AnchoredModal({ state, rootProps, placement, isDismissable, isKeyboardDismissDisabled, shouldCloseOnInteractOutside, children, }) {
    return (_jsx(PopoverPanel, { ...rootProps, isOpen: state.isOpen, onOpenChange: state.setOpen, placement: placement, offset: 8, containerPadding: 8, isKeyboardDismissDisabled: isKeyboardDismissDisabled, 
        // A popover always closes on an outside press; a dialog only when dismissable.
        shouldCloseOnInteractOutside: (element) => isDismissable && (shouldCloseOnInteractOutside?.(element) ?? true), children: _jsx(OverlayTriggerStateContext.Provider, { value: state, children: children }) }));
}
//# sourceMappingURL=modal-presentations.js.map