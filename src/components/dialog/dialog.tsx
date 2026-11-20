'use client';

import type { ReactNode } from 'react';
import type { KeyboardEventProps, OpenStateProps, OverlayDismissProps } from '../../core/events.js';
import { splitDataAttributes } from '../../core/hooks.js';
import type { BaseProps, Placement, RefProps, Size, Tone } from '../../core/props.js';
import { DialogTrigger as AriaDialogTrigger } from '../../primitives/index.js';
import type { ButtonProps, ButtonVariant } from '../button/button.js';
import type { DialogFocusTarget } from './dialog-focus.js';
import { dialogHooks as hooks } from './dialog-hooks.js';
import {
  DialogPresentation,
  resolveDismissal,
  useDialogOpenState,
} from './dialog-presentations.js';
import { useRetention } from './dialog-retained.js';
import { DialogSurface } from './dialog-surface.js';
import { type DialogActions, useDialogActions } from './use-dialog-actions.js';

/** Dialog width, which the host stylesheet maps to a length; `full` fills the viewport. */
export type DialogSize = Extract<Size, 'sm' | 'md' | 'lg' | 'xl'> | 'full';

/** `column` lays the body out as a vertical stack so one child can take the remaining height. */
export type DialogBodyLayout = 'block' | 'column';

/**
 * `first` focuses the first focusable element on open, `dialog` the dialog itself, and a ref or a
 * function returning an element focuses that element.
 */
export type DialogInitialFocus = 'first' | 'dialog' | DialogFocusTarget;

/** A footer action: the primary action (rightmost) or the secondary action (between Cancel and it). */
export interface DialogAction
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
  /** Defaults to `primary` (`destructive` at danger tone) for the primary action, else `secondary`. */
  variant?: ButtonVariant | undefined;
}

/** The Cancel button, which closes the modal like Escape. */
export interface DialogCancelAction
  extends Pick<ButtonProps, 'focusableWhenDisabled' | 'autoFocus'>, BaseProps {
  /** Defaults to the provider's `cancel` string. */
  label?: ReactNode;
}

export interface DialogRenderProps {
  /** Closes the modal. */
  close: () => void;
  /** Runs the primary action as a press does, such as from Enter in a field; nothing when it cannot run. */
  runPrimaryAction: () => void;
}

/** A pressable trigger and the `Dialog` it opens. */
export interface DialogTriggerProps extends OpenStateProps {
  /** The trigger (a `Button` or another pressable), then its `Dialog`. */
  children: ReactNode;
}

/** `alertdialog` marks a decision that interrupts the reader. */
export type DialogRole = 'dialog' | 'alertdialog';

export interface DialogProps
  extends
    RefProps<HTMLDivElement>,
    OpenStateProps,
    OverlayDismissProps,
    Pick<KeyboardEventProps, 'onKeyDown'>,
    BaseProps {
  /** Defaults to `dialog`. */
  role?: DialogRole | undefined;
  /** Names the dialog instead of its title. */
  'aria-label'?: string | undefined;
  /** Describes the dialog when it has no `description`. */
  'aria-describedby'?: string | undefined;
  /** Outside presses close an ordinary dialog by default, except while a built-in action is pending. */
  isDismissable?: boolean | undefined;
  /** Refuses every way of dismissing: Cancel, the close button, Escape and outside presses. */
  isDismissDisabled?: boolean | undefined;
  /** The built-in heading. Omit it to compose the header and body with the named dialog parts. */
  title?: ReactNode;
  /** A line under the title that describes the dialog. */
  description?: ReactNode;
  /** Compact content at the end of the header row, such as a step indicator. */
  headerActions?: ReactNode;
  /** Shows a close button in the header. */
  showCloseButton?: boolean | undefined;
  /** Body content or named dialog parts. A function receives `close` and `runPrimaryAction`. */
  children?: ReactNode | ((renderProps: DialogRenderProps) => ReactNode);
  /** The rightmost footer action, which Control+Enter also runs. */
  primaryAction?: DialogAction | undefined;
  /** A footer action between Cancel and the primary action. */
  secondaryAction?: DialogAction | undefined;
  /** Shown beside a built-in action by default; an object shows or relabels it, `null` hides it. */
  cancelAction?: DialogCancelAction | null | undefined;
  /** The caller's own buttons in place of the built-in ones; Control+Enter then does nothing. */
  actions?: ReactNode;
  /** Content at the start of the footer. */
  footerContent?: ReactNode;
  /** A polite footer message. */
  status?: ReactNode;
  /** An urgent footer message, shown instead of `status` and of an action's failure. */
  error?: ReactNode;
  /** Emphasis of the dialog: `danger` marks a destructive decision; the others its kind of news. Defaults to `neutral`. */
  tone?: Tone | undefined;
  /** Defaults to `md`. */
  size?: DialogSize | undefined;
  /** Defaults to `block`. */
  bodyLayout?: DialogBodyLayout | undefined;
  /** Where focus goes on open: an element given here wins over `autoFocus`. Defaults to `first`. */
  initialFocus?: DialogInitialFocus | undefined;
  /** Where focus goes on close, instead of the element focused when the dialog opened. */
  finalFocus?: DialogFocusTarget | undefined;
  /** Asked when Escape would close the dialog; returning false keeps it open. */
  shouldCloseOnEscape?: (() => boolean) | undefined;
  /** Called once the dialog has closed and its exit animation has ended. */
  onExitComplete?: (() => void) | undefined;
  /** Floats the dialog over the page without blocking it: no focus trap, the page stays usable. */
  isNonModal?: boolean | undefined;
  /** Anchors the dialog to its `DialogTrigger`'s trigger as a popover at this placement. */
  placement?: Placement | undefined;
  /**
   * Keeps the dialog mounted, hidden and inert, once it has closed, so its body keeps its state,
   * refs and editors for the next opening. An anchored dialog (`placement`) ignores it.
   */
  keepMounted?: boolean | undefined;
}

export type AlertDialogProps = Omit<DialogProps, 'role'>;

export type SheetSide = 'top' | 'right' | 'bottom' | 'left';

export interface SheetProps extends Omit<DialogProps, 'role' | 'placement' | 'isNonModal'> {
  /** The viewport edge that holds the sheet. Defaults to `right`. */
  side?: SheetSide | undefined;
}

function canDismissOutside({
  isDismissable,
  role,
  primaryAction,
  secondaryAction,
  running,
}: Pick<DialogProps, 'isDismissable' | 'role' | 'primaryAction' | 'secondaryAction'> &
  Pick<DialogActions, 'running'>) {
  return (
    (isDismissable ?? role !== 'alertdialog') &&
    running === null &&
    !primaryAction?.isPending &&
    !secondaryAction?.isPending
  );
}

function DialogOverlay({
  isOpen,
  defaultOpen,
  onOpenChange,
  isDismissable,
  isKeyboardDismissDisabled = false,
  isDismissDisabled = false,
  shouldCloseOnInteractOutside,
  isNonModal = false,
  placement,
  tone = 'neutral',
  size = 'md',
  bodyLayout = 'block',
  initialFocus = 'first',
  keepMounted = false,
  className,
  ref,
  side,
  ...rest
}: DialogProps & { side?: SheetSide | undefined }) {
  const ownState = useDialogOpenState({ isOpen, defaultOpen, onOpenChange });
  const actionState = useDialogActions(ownState, rest);
  const isRetained = useRetention(ownState, keepMounted && !placement);
  const [, dialogProps] = splitDataAttributes(rest);
  const isFloating = isNonModal && !placement;
  const rootProps = {
    ...hooks.root({
      className,
      props: rest,
      data: {
        layer: placement ? 'dropdown' : 'modal',
        tone,
        size,
        bodyLayout,
        nonModal: isFloating,
        side,
      },
    }),
    ref,
  };
  const dismissal = resolveDismissal({
    isDismissable: canDismissOutside({ ...rest, isDismissable, running: actionState.running }),
    isKeyboardDismissDisabled,
    isDismissDisabled,
    shouldCloseOnInteractOutside,
  });
  const dialog = (
    <DialogSurface
      {...dialogProps}
      // React Aria's popover takes the dialog role itself unless it holds a `role="dialog"`.
      role={placement ? 'dialog' : dialogProps.role}
      tone={tone}
      initialFocus={initialFocus}
      isDismissDisabled={isDismissDisabled}
      canEscape={!dismissal.isKeyboardDismissDisabled}
      isFloating={isFloating}
      isRetained={isRetained}
      actionState={actionState}
    />
  );
  return (
    <DialogPresentation
      {...dismissal}
      {...{ state: ownState, rootProps, placement, isFloating, isRetained }}
    >
      {dialog}
    </DialogPresentation>
  );
}

/** A dialog that restores focus on close and dismisses on Escape or an outside press by default. */
export function Dialog(props: DialogProps) {
  return <DialogOverlay {...props} />;
}

/** A dialog for an interruption that needs a decision. Outside presses are ignored by default. */
export function AlertDialog(props: AlertDialogProps) {
  return <Dialog role="alertdialog" {...props} />;
}

/** A blocking dialog positioned at a viewport edge. */
export function Sheet({ side = 'right', ...props }: SheetProps) {
  return <DialogOverlay side={side} {...props} />;
}

/**
 * Opens the `Dialog` among its children when its trigger, such as a `Button`, is pressed, and
 * returns focus to the trigger when it closes.
 */
export function DialogTrigger({ children, ...openState }: DialogTriggerProps) {
  return <AriaDialogTrigger {...openState}>{children}</AriaDialogTrigger>;
}

export type { ConfirmOptions } from './dialog-confirm.js';
export { confirm } from './dialog-confirm.js';
export type { DialogFocusTarget } from './dialog-focus.js';
export type { DialogCloseProps, DialogPartProps } from './dialog-parts.js';
export {
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog-parts.js';
export type { AlertOptions, PromptOptions } from './dialog-prompts.js';
export { alert, prompt } from './dialog-prompts.js';
