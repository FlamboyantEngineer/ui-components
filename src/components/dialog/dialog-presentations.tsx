'use client';

import { type ReactNode, useContext, useMemo, useRef } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { OpenStateProps, OverlayDismissProps } from '../../core/events.js';
import { dataAttributes, type HookProps } from '../../core/hooks.js';
import type { Placement, RefProps } from '../../core/props.js';
import {
  FocusScope,
  Modal as AriaModal,
  ModalOverlay,
  OverlayTriggerStateContext,
  useModalOverlay,
} from '../../primitives/index.js';
import { FormBoundary } from '../../utils/form-boundary.js';
import { DEFAULT_OVERLAY_GUTTER, POPOVER_OFFSET } from '../../utils/overlay-defaults.js';
import { useEnterExit } from '../../utils/use-enter-exit.js';
import { useLatest } from '../../utils/use-latest.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { PopoverPanel } from '../popover/popover.js';
import { OverlayLayerScope, Portal, useLayerZIndex } from '../portal/portal.js';
import { dialogHooks as hooks } from './dialog-hooks.js';
import { DialogShownContext, retainedStyle } from './dialog-retained.js';
import { useDialogStackIndex } from './dialog-stack.js';

/** The open state a dialog shares with the overlays and trigger around it. */
interface DialogOpenState {
  readonly isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Where a pointer opened it; always null for a dialog. */
  readonly point: { x: number; y: number } | null;
  setPoint: (point: { x: number; y: number }) => void;
}

type DialogOpenOptions = OpenStateProps;

interface DialogPresentationProps {
  state: DialogOpenState;
  /** The root's hook classes and data attributes, and the caller's ref to it. */
  rootProps: HookProps & RefProps<HTMLDivElement>;
  /** The dialog. */
  children: ReactNode;
}

/** How the dialog may be dismissed, already narrowed by `isDismissDisabled`. */
type DialogDismissal = Required<
  Pick<OverlayDismissProps, 'isDismissable' | 'isKeyboardDismissDisabled'>
> &
  Pick<OverlayDismissProps, 'shouldCloseOnInteractOutside'>;

interface BlockingDialogProps extends DialogPresentationProps, DialogDismissal {}

interface DialogPresentationChoiceProps extends DialogPresentationProps, DialogDismissal {
  /** Anchors the dialog to its trigger at this placement. */
  placement: Placement | undefined;
  isFloating: boolean;
  isRetained: boolean;
}

interface FloatingDialogProps extends DialogPresentationProps {
  /** Stays mounted, hidden and inert, while closed. */
  isRetained: boolean;
}

interface AnchoredDialogProps extends DialogPresentationProps, DialogDismissal {
  placement: Placement;
}

/** How the dialog may be dismissed: `isDismissDisabled` refuses outside presses and Escape. */
export function resolveDismissal({
  isDismissDisabled,
  ...dismissal
}: DialogDismissal & { isDismissDisabled: boolean }): DialogDismissal {
  return {
    ...dismissal,
    isDismissable: dismissal.isDismissable && !isDismissDisabled,
    isKeyboardDismissDisabled: dismissal.isKeyboardDismissDisabled || isDismissDisabled,
  };
}

/** An open state from whether it is open and how to change it. */
function toDialogOpenState(isOpen: boolean, change: (isOpen: boolean) => void): DialogOpenState {
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
export function useDialogOpenState({
  isOpen,
  defaultOpen,
  onOpenChange,
}: DialogOpenOptions): DialogOpenState {
  const trigger = useContext(OverlayTriggerStateContext);
  const [own, setOwn] = useControllableState(isOpen, defaultOpen ?? false, onOpenChange);
  const owner = isOpen === undefined && defaultOpen === undefined ? trigger : null;
  const latest = useLatest({ owner, onOpenChange, setOwn });
  const shown = owner ? owner.isOpen : own;
  const hasOwner = owner !== null;
  // One object per open state, so the dialog subtree that reads it renders again only when it moves.
  return useMemo(
    () =>
      toDialogOpenState(shown, (next) => {
        const current = latest.current;
        if (hasOwner && current.owner) {
          current.owner.setOpen(next);
          current.onOpenChange?.(next);
        } else current.setOwn(next);
      }),
    [shown, hasOwner, latest],
  );
}

/**
 * A dialog over a page it blocks (React Aria `ModalOverlay` and `Modal`): the overlay covers the
 * viewport on the `modal` layer, focus stays inside, and the page is hidden and inert. The overlay
 * follows the dialog's open state, so every close goes through it.
 */
function BlockingDialog({ state, rootProps, children, ...overlay }: BlockingDialogProps) {
  const zIndex = useLayerZIndex('modal');
  const stackIndex = useDialogStackIndex(state.isOpen);
  return (
    <ModalOverlay
      isOpen={state.isOpen}
      onOpenChange={state.setOpen}
      {...overlay}
      {...rootProps}
      {...dataAttributes({ stackIndex })}
      style={{ position: 'fixed', inset: 0, zIndex }}
    >
      <AriaModal className={hooks.slotClass('panel')}>{children}</AriaModal>
    </ModalOverlay>
  );
}

/**
 * A dialog floating over a page it does not block: no focus trap, no hidden or inert content, and
 * the overlay lets pointer presses through to the page around the panel. Opened over a blocking
 * overlay, it stays reachable and visible to assistive technology. It enters and exits with
 * the panel's animations.
 */
function FloatingDialog({ state, rootProps, children, isRetained }: FloatingDialogProps) {
  const zIndex = useLayerZIndex('modal');
  const panelRef = useRef<HTMLDivElement>(null);
  const { isMounted, isEntering, isExiting } = useEnterExit(panelRef, state.isOpen);
  if (!isMounted && !isRetained) return null;
  const phase = { entering: isEntering, exiting: isExiting };
  // A top layer that joins React Aria's focus scopes, so a blocking overlay already open neither
  // hides it nor pulls focus back out of it.
  return (
    <Portal layer="modal" topLayer>
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
          <FocusScope>
            <OverlayTriggerStateContext value={state}>
              <DialogShownContext value={isMounted}>{children}</DialogShownContext>
            </OverlayTriggerStateContext>
          </FocusScope>
        </div>
      </div>
    </Portal>
  );
}

/**
 * A dialog anchored to the trigger of its `DialogTrigger` in the popover panel on the `dropdown`
 * layer (React Aria `Popover`), which traps focus, hides the page from assistive technology and
 * returns focus on close.
 */
function AnchoredDialog({
  state,
  rootProps,
  placement,
  isDismissable,
  isKeyboardDismissDisabled,
  shouldCloseOnInteractOutside,
  children,
}: AnchoredDialogProps) {
  return (
    <PopoverPanel
      {...rootProps}
      isOpen={state.isOpen}
      onOpenChange={state.setOpen}
      placement={placement}
      offset={POPOVER_OFFSET}
      containerPadding={DEFAULT_OVERLAY_GUTTER}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      // A popover always closes on an outside press; a dialog only when dismissable.
      shouldCloseOnInteractOutside={(element) =>
        isDismissable && (shouldCloseOnInteractOutside?.(element) ?? true)
      }
    >
      <OverlayTriggerStateContext value={state}>{children}</OverlayTriggerStateContext>
    </PopoverPanel>
  );
}

/**
 * A blocking dialog that stays mounted while closed (React Aria `useModalOverlay` and
 * `FocusScope`): open, it covers the viewport, contains focus, locks scrolling and hides the page,
 * as `BlockingDialog` does; closed, it is hidden and inert, keeps no lock and is no open overlay, so
 * its body keeps its state for the next opening.
 */
function RetainedDialog({ state, rootProps, children, ...dismissal }: BlockingDialogProps) {
  const zIndex = useLayerZIndex('modal');
  const overlayRef = useRef<HTMLDivElement>(null);
  const overlayRefs = useMergedRefs(overlayRef, rootProps.ref);
  const panelRef = useRef<HTMLDivElement>(null);
  const phase = useEnterExit(overlayRef, state.isOpen);
  const { modalProps, underlayProps } = useModalOverlay(dismissal, state, panelRef);
  const stackIndex = useDialogStackIndex(state.isOpen);
  return (
    <Portal layer="modal">
      <div
        {...underlayProps}
        {...rootProps}
        {...dataAttributes({ entering: phase.isEntering, exiting: phase.isExiting, stackIndex })}
        ref={overlayRefs}
        // Inert once its exit has ended, so focus stays in the leaving dialog until it returns.
        inert={!phase.isMounted}
        style={{ position: 'fixed', inset: 0, zIndex, ...retainedStyle(phase.isMounted) }}
      >
        <FocusScope contain={state.isOpen}>
          <div {...modalProps} ref={panelRef} className={hooks.slotClass('panel')}>
            <OverlayTriggerStateContext value={state}>
              <DialogShownContext value={phase.isMounted}>{children}</DialogShownContext>
            </OverlayTriggerStateContext>
          </div>
        </FocusScope>
      </div>
    </Portal>
  );
}

/**
 * The overlay a dialog shows in: anchored to its trigger, floating over the page, or blocking it,
 * staying mounted while closed when retained.
 */
export function DialogPresentation({
  placement,
  isFloating,
  isRetained,
  children,
  ...presentation
}: DialogPresentationChoiceProps) {
  // Overlays opened from the dialog, such as a drawer, stack at least on its layer.
  const content = (
    <OverlayLayerScope layer={placement ? 'dropdown' : 'modal'}>
      <FormBoundary>{children}</FormBoundary>
    </OverlayLayerScope>
  );
  if (placement)
    return (
      <AnchoredDialog {...presentation} placement={placement}>
        {content}
      </AnchoredDialog>
    );
  if (isFloating) {
    const { state, rootProps } = presentation;
    return <FloatingDialog {...{ state, rootProps, isRetained }}>{content}</FloatingDialog>;
  }
  return isRetained ? (
    <RetainedDialog {...presentation}>{content}</RetainedDialog>
  ) : (
    <BlockingDialog {...presentation}>{content}</BlockingDialog>
  );
}
