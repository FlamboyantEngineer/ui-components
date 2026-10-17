import { useId, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import {
  Dialog,
  Modal as AriaModal,
  ModalOverlay,
  type DialogProps,
  type ModalOverlayProps,
} from 'react-aria-components';
import { createHooks, splitDataAttributes } from '../../core/hooks.js';
import type { BaseProps, Size, Tone } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import type { ButtonProps, ButtonVariant } from '../button/button.js';
import { useLayerZIndex } from '../portal/portal.js';
import { ModalFooter } from './modal-footer.js';
import { InitialFocus } from './modal-focus.js';
import { ModalHeader } from './modal-header.js';
import { claimPrimaryShortcut } from './modal-shortcut.js';
import { useModalActions } from './use-modal-actions.js';

/** Emphasis of the decision: `danger` marks a destructive one. */
export type ModalTone = Extract<Tone, 'neutral' | 'danger'>;

/** Dialog width, which the host stylesheet maps to a length; `full` fills the viewport. */
export type ModalSize = Extract<Size, 'sm' | 'md' | 'lg' | 'xl'> | 'full';

/** `column` lays the body out as a vertical stack so one child can take the remaining height. */
export type ModalBodyLayout = 'block' | 'column';

/** `first` focuses the first focusable element on open; `dialog` focuses the dialog itself. */
export type ModalInitialFocus = 'first' | 'dialog';

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

export interface ModalProps
  extends
    Pick<
      ModalOverlayProps,
      'isOpen' | 'defaultOpen' | 'onOpenChange' | 'isDismissable' | 'isKeyboardDismissDisabled'
    >,
    Pick<DialogProps, 'role' | 'aria-label' | 'aria-describedby'>,
    BaseProps {
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
  /** Where focus goes on open when no element has `autoFocus`. Defaults to `first`. */
  initialFocus?: ModalInitialFocus | undefined;
}

type ModalDialogProps = Omit<
  ModalProps,
  | 'isOpen'
  | 'defaultOpen'
  | 'onOpenChange'
  | 'isDismissable'
  | 'isKeyboardDismissDisabled'
  | 'size'
  | 'bodyLayout'
  | 'className'
> &
  Required<Pick<ModalProps, 'tone' | 'initialFocus' | 'isDismissDisabled'>>;

const hooks = createHooks('modal', ['panel', 'dialog', 'body']);

function ModalBody({
  children,
  close,
  ref,
}: Pick<ModalProps, 'children'> & { close: () => void; ref: RefObject<HTMLDivElement | null> }) {
  if (children === undefined || children === null) return null;
  return (
    <div ref={ref} {...hooks.slot('body')}>
      {typeof children === 'function' ? children({ close }) : children}
    </div>
  );
}

function ModalDialog({
  title,
  description,
  headerActions,
  showCloseButton,
  children,
  initialFocus,
  isDismissDisabled,
  role,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  ...footer
}: ModalDialogProps) {
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const actionState = useModalActions(footer);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!claimPrimaryShortcut(event) || footer.actions !== undefined) return;
    if (!actionState.canRun('primary')) return;
    event.preventDefault();
    actionState.run('primary');
  };
  return (
    <Dialog
      ref={dialogRef}
      id={id}
      role={role}
      className={hooks.slotClass('dialog')}
      aria-label={ariaLabel}
      aria-describedby={isEmptyNode(description) ? ariaDescribedby : descriptionId}
      // React Aria's Dialog forwards no keyboard handlers, so the listener goes on its element.
      render={(props) => <section {...props} onKeyDown={onKeyDown} />}
    >
      <ModalHeader
        title={title}
        description={description}
        descriptionId={descriptionId}
        headerActions={headerActions}
        showCloseButton={showCloseButton}
        isDismissDisabled={isDismissDisabled}
        onClose={actionState.close}
      />
      <ModalBody ref={bodyRef} close={actionState.close}>
        {children}
      </ModalBody>
      <ModalFooter
        {...footer}
        ref={footerRef}
        actionState={actionState}
        isDismissDisabled={isDismissDisabled}
      />
      {initialFocus === 'first' ? (
        <InitialFocus dialogRef={dialogRef} bodyRef={bodyRef} footerRef={footerRef} />
      ) : null}
    </Dialog>
  );
}

/**
 * A blocking dialog over the page: title, body and a footer with Cancel, secondary and primary
 * actions. Focus moves in on open, stays inside while open and returns to where it was on close.
 * Escape closes it, and Control+Enter (or Command+Enter) runs the primary action.
 */
export function Modal({
  isOpen,
  defaultOpen,
  onOpenChange,
  isDismissable = false,
  isKeyboardDismissDisabled = false,
  isDismissDisabled = false,
  tone = 'neutral',
  size = 'md',
  bodyLayout = 'block',
  initialFocus = 'first',
  className,
  ...rest
}: ModalProps) {
  const zIndex = useLayerZIndex('modal');
  const [, dialogProps] = splitDataAttributes(rest);
  return (
    <ModalOverlay
      // Inside a DialogTrigger an explicit `undefined` would override the trigger's open state.
      {...(isOpen !== undefined ? { isOpen } : {})}
      {...(defaultOpen !== undefined ? { defaultOpen } : {})}
      onOpenChange={onOpenChange}
      isDismissable={isDismissable && !isDismissDisabled}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled || isDismissDisabled}
      {...hooks.root({ className, props: rest, data: { layer: 'modal', tone, size, bodyLayout } })}
      style={{ position: 'fixed', inset: 0, zIndex }}
    >
      <AriaModal className={hooks.slotClass('panel')}>
        <ModalDialog
          {...dialogProps}
          tone={tone}
          initialFocus={initialFocus}
          isDismissDisabled={isDismissDisabled}
        />
      </AriaModal>
    </ModalOverlay>
  );
}

export { isModalPrimaryShortcut } from './modal-shortcut.js';
