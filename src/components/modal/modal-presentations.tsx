import { useContext, useRef, type ContextType, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  Modal as AriaModal,
  ModalOverlay,
  OverlayTriggerStateContext,
  type ModalOverlayProps,
  type Placement,
} from 'react-aria-components';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks, dataAttributes, type HookProps } from '../../core/hooks.js';
import { useEnterExit } from '../../utils/use-enter-exit.js';
import { PopoverPanel } from '../popover/popover.js';
import { useLayerZIndex } from '../portal/portal.js';

/** The open state React Aria overlays share through `OverlayTriggerStateContext`. */
export type ModalOpenState = NonNullable<ContextType<typeof OverlayTriggerStateContext>>;

export type ModalOpenOptions = Pick<ModalOverlayProps, 'isOpen' | 'defaultOpen' | 'onOpenChange'>;

export interface ModalPresentationProps {
  state: ModalOpenState;
  /** The root's hook classes and data attributes. */
  rootProps: HookProps;
  /** The dialog. */
  children: ReactNode;
}

/** How the dialog may be dismissed, already narrowed by `isDismissDisabled`. */
export type ModalDismissal = Required<
  Pick<ModalOverlayProps, 'isDismissable' | 'isKeyboardDismissDisabled'>
> &
  Pick<ModalOverlayProps, 'shouldCloseOnInteractOutside'>;

export interface BlockingModalProps
  extends Omit<ModalPresentationProps, 'state'>, ModalDismissal, ModalOpenOptions {}

export interface AnchoredModalProps extends ModalPresentationProps, ModalDismissal {
  placement: Placement;
}

const hooks = createHooks('modal', ['panel']);

/** How the dialog may be dismissed: `isDismissDisabled` refuses outside presses and Escape. */
export function resolveDismissal({
  isDismissDisabled,
  ...dismissal
}: ModalDismissal & { isDismissDisabled: boolean }): ModalDismissal {
  return {
    ...dismissal,
    isDismissable: dismissal.isDismissable && !isDismissDisabled,
    isKeyboardDismissDisabled: dismissal.isKeyboardDismissDisabled || isDismissDisabled,
  };
}

/**
 * The open state of a dialog React Aria's modal overlay does not hold: its own, controlled or from
 * `defaultOpen`, or else the state of the enclosing `DialogTrigger`.
 */
export function useModalOpenState({
  isOpen,
  defaultOpen,
  onOpenChange,
}: ModalOpenOptions): ModalOpenState {
  const trigger = useContext(OverlayTriggerStateContext);
  const [own, setOwn] = useControllableState(isOpen, defaultOpen ?? false, onOpenChange);
  if (trigger && isOpen === undefined && defaultOpen === undefined) return trigger;
  const setOpen = (next: boolean) => {
    if (next !== own) setOwn(next);
  };
  return {
    isOpen: own,
    setOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!own),
    // A dialog opens against its trigger or the viewport, never at a pointer position.
    point: null,
    setPoint: () => {},
  };
}

/**
 * A dialog over a page it blocks (React Aria `ModalOverlay` and `Modal`): the overlay covers the
 * viewport on the `modal` layer, focus stays inside, and the page is hidden and inert.
 */
export function BlockingModal({
  isOpen,
  defaultOpen,
  rootProps,
  children,
  ...overlay
}: BlockingModalProps) {
  const zIndex = useLayerZIndex('modal');
  return (
    <ModalOverlay
      // Inside a DialogTrigger an explicit `undefined` would override the trigger's open state.
      {...(isOpen !== undefined ? { isOpen } : {})}
      {...(defaultOpen !== undefined ? { defaultOpen } : {})}
      {...overlay}
      {...rootProps}
      style={{ position: 'fixed', inset: 0, zIndex }}
    >
      <AriaModal className={hooks.slotClass('panel')}>{children}</AriaModal>
    </ModalOverlay>
  );
}

/**
 * A dialog floating over a page it does not block: no focus trap, no hidden or inert content, and
 * the overlay lets pointer presses through to the page around the panel. It enters and exits with
 * the panel's animations.
 */
export function FloatingModal({ state, rootProps, children }: ModalPresentationProps) {
  const zIndex = useLayerZIndex('modal');
  const panelRef = useRef<HTMLDivElement>(null);
  const { isMounted, isEntering, isExiting } = useEnterExit(panelRef, state.isOpen);
  if (!isMounted || typeof document === 'undefined') return null;
  const phase = { entering: isEntering, exiting: isExiting };
  return createPortal(
    <div
      {...rootProps}
      {...dataAttributes(phase)}
      style={{ position: 'fixed', inset: 0, zIndex, pointerEvents: 'none' }}
    >
      <div ref={panelRef} {...hooks.slot('panel', phase)} style={{ pointerEvents: 'auto' }}>
        <OverlayTriggerStateContext.Provider value={state}>
          {children}
        </OverlayTriggerStateContext.Provider>
      </div>
    </div>,
    document.body,
  );
}

/**
 * A dialog anchored to the trigger of its `DialogTrigger` in the popover panel on the `dropdown`
 * layer (React Aria `Popover`), which traps focus, hides the page from assistive technology and
 * returns focus on close.
 */
export function AnchoredModal({
  state,
  rootProps,
  placement,
  isDismissable,
  isKeyboardDismissDisabled,
  shouldCloseOnInteractOutside,
  children,
}: AnchoredModalProps) {
  return (
    <PopoverPanel
      {...rootProps}
      isOpen={state.isOpen}
      onOpenChange={state.setOpen}
      placement={placement}
      offset={8}
      containerPadding={8}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      // A popover always closes on an outside press; a dialog only when dismissable.
      shouldCloseOnInteractOutside={(element) =>
        isDismissable && (shouldCloseOnInteractOutside?.(element) ?? true)
      }
    >
      <OverlayTriggerStateContext.Provider value={state}>
        {children}
      </OverlayTriggerStateContext.Provider>
    </PopoverPanel>
  );
}
