'use client';

import { useContext, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  FocusScope,
  Modal as AriaModal,
  ModalOverlay,
  OverlayTriggerStateContext,
  useModalOverlay,
} from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { OpenStateProps, OverlayDismissProps } from '../../core/events.js';
import { createHooks, dataAttributes, type HookProps } from '../../core/hooks.js';
import type { Placement } from '../../core/props.js';
import { useEnterExit } from '../../utils/use-enter-exit.js';
import { PopoverPanel } from '../popover/popover.js';
import { useLayerZIndex } from '../portal/portal.js';
import { ModalShownContext, retainedStyle } from './modal-retained.js';

/** The open state a dialog shares with the overlays and trigger around it. */
interface ModalOpenState {
  readonly isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Where a pointer opened it; always null for a dialog. */
  readonly point: { x: number; y: number } | null;
  setPoint: (point: { x: number; y: number }) => void;
}

type ModalOpenOptions = OpenStateProps;

interface ModalPresentationProps {
  state: ModalOpenState;
  /** The root's hook classes and data attributes. */
  rootProps: HookProps;
  /** The dialog. */
  children: ReactNode;
}

/** How the dialog may be dismissed, already narrowed by `isDismissDisabled`. */
type ModalDismissal = Required<
  Pick<OverlayDismissProps, 'isDismissable' | 'isKeyboardDismissDisabled'>
> &
  Pick<OverlayDismissProps, 'shouldCloseOnInteractOutside'>;

interface BlockingModalProps extends ModalPresentationProps, ModalDismissal {}

interface ModalPresentationChoiceProps extends ModalPresentationProps, ModalDismissal {
  /** Anchors the dialog to its trigger at this placement. */
  placement: Placement | undefined;
  isFloating: boolean;
  isRetained: boolean;
}

interface FloatingModalProps extends ModalPresentationProps {
  /** Stays mounted, hidden and inert, while closed. */
  isRetained: boolean;
}

interface AnchoredModalProps extends ModalPresentationProps, ModalDismissal {
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

/** An open state from whether it is open and how to change it. */
function toModalOpenState(isOpen: boolean, change: (isOpen: boolean) => void): ModalOpenState {
  const setOpen = (next: boolean) => {
    if (next !== isOpen) change(next);
  };
  return {
    isOpen,
    setOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!isOpen),
    // A dialog opens against its trigger or the viewport, never at a pointer position.
    point: null,
    setPoint: () => {},
  };
}

/**
 * The open state of a dialog: its own, controlled or from `defaultOpen`, or else the state of the
 * enclosing `DialogTrigger`. A change the dialog makes to a trigger's state (Cancel, Escape, an
 * outside press, an action) also reaches the dialog's own `onOpenChange`.
 */
export function useModalOpenState({
  isOpen,
  defaultOpen,
  onOpenChange,
}: ModalOpenOptions): ModalOpenState {
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
function BlockingModal({ state, rootProps, children, ...overlay }: BlockingModalProps) {
  const zIndex = useLayerZIndex('modal');
  return (
    <ModalOverlay
      isOpen={state.isOpen}
      onOpenChange={state.setOpen}
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
function FloatingModal({ state, rootProps, children, isRetained }: FloatingModalProps) {
  const zIndex = useLayerZIndex('modal');
  const panelRef = useRef<HTMLDivElement>(null);
  const { isMounted, isEntering, isExiting } = useEnterExit(panelRef, state.isOpen);
  if ((!isMounted && !isRetained) || typeof document === 'undefined') return null;
  const phase = { entering: isEntering, exiting: isExiting };
  return createPortal(
    <div
      {...rootProps}
      {...dataAttributes(phase)}
      inert={!state.isOpen && isRetained}
      style={{ position: 'fixed', inset: 0, zIndex, pointerEvents: 'none' }}
    >
      <div
        ref={panelRef}
        {...hooks.slot('panel', phase)}
        style={{ pointerEvents: 'auto', ...retainedStyle(isMounted) }}
      >
        <OverlayTriggerStateContext.Provider value={state}>
          <ModalShownContext.Provider value={isMounted}>{children}</ModalShownContext.Provider>
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
function AnchoredModal({
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

/**
 * A blocking dialog that stays mounted while closed (React Aria `useModalOverlay` and
 * `FocusScope`): open, it covers the viewport, contains focus, locks scrolling and hides the page,
 * as `BlockingModal` does; closed, it is hidden and inert, keeps no lock and is no open overlay, so
 * its body keeps its state for the next opening.
 */
function RetainedModal({ state, rootProps, children, ...dismissal }: BlockingModalProps) {
  const zIndex = useLayerZIndex('modal');
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const phase = useEnterExit(overlayRef, state.isOpen);
  const { modalProps, underlayProps } = useModalOverlay(dismissal, state, panelRef);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      {...underlayProps}
      {...rootProps}
      {...dataAttributes({ entering: phase.isEntering, exiting: phase.isExiting })}
      ref={overlayRef}
      inert={!state.isOpen}
      style={{ position: 'fixed', inset: 0, zIndex, ...retainedStyle(phase.isMounted) }}
    >
      <FocusScope contain={state.isOpen}>
        <div {...modalProps} ref={panelRef} className={hooks.slotClass('panel')}>
          <OverlayTriggerStateContext.Provider value={state}>
            <ModalShownContext.Provider value={phase.isMounted}>
              {children}
            </ModalShownContext.Provider>
          </OverlayTriggerStateContext.Provider>
        </div>
      </FocusScope>
    </div>,
    document.body,
  );
}

/**
 * The overlay a dialog shows in: anchored to its trigger, floating over the page, or blocking it,
 * staying mounted while closed when retained.
 */
export function ModalPresentation({
  placement,
  isFloating,
  isRetained,
  ...presentation
}: ModalPresentationChoiceProps) {
  if (placement) return <AnchoredModal {...presentation} placement={placement} />;
  if (isFloating) {
    const { state, rootProps, children } = presentation;
    return <FloatingModal {...{ state, rootProps, children, isRetained }} />;
  }
  return isRetained ? <RetainedModal {...presentation} /> : <BlockingModal {...presentation} />;
}
