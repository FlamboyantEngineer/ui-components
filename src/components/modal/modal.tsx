import type { ReactNode } from 'react';
import { DialogTrigger } from '../../primitives/index.js';
import type { OpenStateProps, OverlayDismissProps } from '../../core/events.js';
import { createHooks, splitDataAttributes } from '../../core/hooks.js';
import type { BaseProps, Placement, Size, Tone } from '../../core/props.js';
import type { ButtonProps, ButtonVariant } from '../button/button.js';
import { ModalDialog } from './modal-dialog.js';
import type { ModalFocusTarget } from './modal-focus.js';
import {
  AnchoredModal,
  BlockingModal,
  FloatingModal,
  resolveDismissal,
  useModalOpenState,
} from './modal-presentations.js';

/** Emphasis of the dialog: `danger` marks a destructive decision; the others its kind of news. */
export type ModalTone = Tone;

/** Dialog width, which the host stylesheet maps to a length; `full` fills the viewport. */
export type ModalSize = Extract<Size, 'sm' | 'md' | 'lg' | 'xl'> | 'full';

/** `column` lays the body out as a vertical stack so one child can take the remaining height. */
export type ModalBodyLayout = 'block' | 'column';

/**
 * `first` focuses the first focusable element on open, `dialog` the dialog itself, and a ref or a
 * function returning an element focuses that element.
 */
export type ModalInitialFocus = 'first' | 'dialog' | ModalFocusTarget;

/** A footer action: the primary action (rightmost) or the secondary action (between Cancel and it). */
export interface ModalAction
  extends
    Pick<
      ButtonProps,
      'isDisabled' | 'isPending' | 'pendingLabel' | 'focusableWhenDisabled' | 'autoFocus'
    >,
    BaseProps {
  /** The button's label. */
  label: ReactNode;
  /** Runs with `close`; a returned promise keeps the button pending and a rejection shows its error. */
  onPress?: ((close: () => void) => void | Promise<unknown>) | undefined;
  /** Defaults to `primary` (`danger` in a `danger` modal) for the primary action, else `secondary`. */
  variant?: ButtonVariant | undefined;
}

/** The Cancel button, which closes the modal like Escape. */
export interface ModalCancelAction
  extends Pick<ButtonProps, 'focusableWhenDisabled' | 'autoFocus'>, BaseProps {
  /** Defaults to the provider's `cancel` string. */
  label?: ReactNode;
}

export interface ModalRenderProps {
  /** Closes the modal. */
  close: () => void;
}

/** A pressable trigger and the `Modal` it opens. */
export interface ModalTriggerProps extends OpenStateProps {
  /** The trigger (a `Button` or another pressable), then its `Modal`. */
  children: ReactNode;
}

/** `alertdialog` marks a decision that interrupts the reader. */
export type ModalRole = 'dialog' | 'alertdialog';

export interface ModalProps extends OpenStateProps, OverlayDismissProps, BaseProps {
  /** Defaults to `dialog`. */
  role?: ModalRole | undefined;
  /** Names the dialog instead of its title. */
  'aria-label'?: string | undefined;
  /** Describes the dialog when it has no `description`. */
  'aria-describedby'?: string | undefined;
  /** Refuses every way of dismissing: Cancel, the close button, Escape and outside presses. */
  isDismissDisabled?: boolean | undefined;
  /** The heading, which also names the dialog unless `aria-label` is given. */
  title: ReactNode;
  /** A line under the title that describes the dialog. */
  description?: ReactNode;
  /** Compact content at the end of the header row, such as a step indicator. */
  headerActions?: ReactNode;
  /** Shows a close button in the header. */
  showCloseButton?: boolean | undefined;
  /** The body; a function receives `close`. */
  children?: ReactNode | ((renderProps: ModalRenderProps) => ReactNode);
  /** The rightmost footer action, which Control+Enter also runs. */
  primaryAction?: ModalAction | undefined;
  /** A footer action between Cancel and the primary action. */
  secondaryAction?: ModalAction | undefined;
  /** Shown beside a built-in action by default; an object shows or relabels it, `null` hides it. */
  cancelAction?: ModalCancelAction | null | undefined;
  /** The caller's own buttons in place of the built-in ones; Control+Enter then does nothing. */
  actions?: ReactNode;
  /** Content at the start of the footer. */
  footerContent?: ReactNode;
  /** A polite footer message. */
  status?: ReactNode;
  /** An urgent footer message, shown instead of `status` and of an action's failure. */
  error?: ReactNode;
  /** Defaults to `neutral`. */
  tone?: ModalTone | undefined;
  /** Defaults to `md`. */
  size?: ModalSize | undefined;
  /** Defaults to `block`. */
  bodyLayout?: ModalBodyLayout | undefined;
  /** Where focus goes on open: an element given here wins over `autoFocus`. Defaults to `first`. */
  initialFocus?: ModalInitialFocus | undefined;
  /** Where focus goes on close, instead of the element focused when the dialog opened. */
  finalFocus?: ModalFocusTarget | undefined;
  /** Asked when Escape would close the dialog; returning false keeps it open. */
  shouldCloseOnEscape?: (() => boolean) | undefined;
  /** Called once the dialog has closed and its exit animation has ended. */
  onExitComplete?: (() => void) | undefined;
  /** Floats the dialog over the page without blocking it: no focus trap, the page stays usable. */
  isNonModal?: boolean | undefined;
  /** Anchors the dialog to its `ModalTrigger`'s trigger as a popover at this placement. */
  placement?: Placement | undefined;
}

const hooks = createHooks('modal');

/**
 * A blocking dialog over the page: title, body and a footer with Cancel, secondary and primary
 * actions. Focus moves in on open, stays inside while open and returns to where it was on close.
 * Escape closes it, and Control+Enter (or Command+Enter) runs the primary action. It can also float
 * over the page without blocking it (`isNonModal`) or open as a popover against its trigger
 * (`placement`).
 */
export function Modal({
  isOpen,
  defaultOpen,
  onOpenChange,
  isDismissable = false,
  isKeyboardDismissDisabled = false,
  isDismissDisabled = false,
  shouldCloseOnInteractOutside,
  isNonModal = false,
  placement,
  tone = 'neutral',
  size = 'md',
  bodyLayout = 'block',
  initialFocus = 'first',
  className,
  ...rest
}: ModalProps) {
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
  const dialog = (
    <ModalDialog
      {...dialogProps}
      // React Aria's popover takes the dialog role itself unless it holds a `role="dialog"`.
      role={placement ? 'dialog' : dialogProps.role}
      tone={tone}
      initialFocus={initialFocus}
      isDismissDisabled={isDismissDisabled}
      canEscape={!dismissal.isKeyboardDismissDisabled}
      isFloating={isFloating}
    />
  );
  if (placement) {
    return (
      <AnchoredModal {...dismissal} state={ownState} rootProps={rootProps} placement={placement}>
        {dialog}
      </AnchoredModal>
    );
  }
  if (isFloating) {
    return (
      <FloatingModal state={ownState} rootProps={rootProps}>
        {dialog}
      </FloatingModal>
    );
  }
  return (
    <BlockingModal
      {...dismissal}
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      rootProps={rootProps}
    >
      {dialog}
    </BlockingModal>
  );
}

/**
 * Opens the `Modal` among its children when its trigger, such as a `Button`, is pressed, and
 * returns focus to the trigger when it closes.
 */
export function ModalTrigger({ children, ...openState }: ModalTriggerProps) {
  return <DialogTrigger {...openState}>{children}</DialogTrigger>;
}

export { isModalPrimaryShortcut } from './modal-shortcut.js';
export type { ModalFocusTarget } from './modal-focus.js';
