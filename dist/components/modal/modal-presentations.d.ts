import { type ReactNode } from 'react';
import type { OpenStateProps, OverlayDismissProps } from '../../core/events.js';
import { type HookProps } from '../../core/hooks.js';
import type { Placement } from '../../core/props.js';
/** The open state a dialog shares with the overlays and trigger around it. */
export interface ModalOpenState {
    readonly isOpen: boolean;
    setOpen: (isOpen: boolean) => void;
    open: () => void;
    close: () => void;
    toggle: () => void;
    /** Where a pointer opened it; always null for a dialog. */
    readonly point: {
        x: number;
        y: number;
    } | null;
    setPoint: (point: {
        x: number;
        y: number;
    }) => void;
}
export type ModalOpenOptions = OpenStateProps;
export interface ModalPresentationProps {
    state: ModalOpenState;
    /** The root's hook classes and data attributes. */
    rootProps: HookProps;
    /** The dialog. */
    children: ReactNode;
}
/** How the dialog may be dismissed, already narrowed by `isDismissDisabled`. */
export type ModalDismissal = Required<Pick<OverlayDismissProps, 'isDismissable' | 'isKeyboardDismissDisabled'>> & Pick<OverlayDismissProps, 'shouldCloseOnInteractOutside'>;
export interface BlockingModalProps extends ModalPresentationProps, ModalDismissal {
}
export interface AnchoredModalProps extends ModalPresentationProps, ModalDismissal {
    placement: Placement;
}
/** How the dialog may be dismissed: `isDismissDisabled` refuses outside presses and Escape. */
export declare function resolveDismissal({ isDismissDisabled, ...dismissal }: ModalDismissal & {
    isDismissDisabled: boolean;
}): ModalDismissal;
/**
 * The open state of a dialog: its own, controlled or from `defaultOpen`, or else the state of the
 * enclosing `DialogTrigger`. A change the dialog makes to a trigger's state (Cancel, Escape, an
 * outside press, an action) also reaches the dialog's own `onOpenChange`.
 */
export declare function useModalOpenState({ isOpen, defaultOpen, onOpenChange, }: ModalOpenOptions): ModalOpenState;
/**
 * A dialog over a page it blocks (React Aria `ModalOverlay` and `Modal`): the overlay covers the
 * viewport on the `modal` layer, focus stays inside, and the page is hidden and inert. The overlay
 * follows the dialog's open state, so every close goes through it.
 */
export declare function BlockingModal({ state, rootProps, children, ...overlay }: BlockingModalProps): import("react").JSX.Element;
/**
 * A dialog floating over a page it does not block: no focus trap, no hidden or inert content, and
 * the overlay lets pointer presses through to the page around the panel. It enters and exits with
 * the panel's animations.
 */
export declare function FloatingModal({ state, rootProps, children }: ModalPresentationProps): import("react").ReactPortal | null;
/**
 * A dialog anchored to the trigger of its `DialogTrigger` in the popover panel on the `dropdown`
 * layer (React Aria `Popover`), which traps focus, hides the page from assistive technology and
 * returns focus on close.
 */
export declare function AnchoredModal({ state, rootProps, placement, isDismissable, isKeyboardDismissDisabled, shouldCloseOnInteractOutside, children, }: AnchoredModalProps): import("react").JSX.Element;
//# sourceMappingURL=modal-presentations.d.ts.map