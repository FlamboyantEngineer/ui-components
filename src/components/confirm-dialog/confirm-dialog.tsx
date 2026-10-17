import { useId, useRef, type ReactNode } from 'react';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import type { ModalController } from '../modal-controller/modal-controller.js';
import { Modal, type ModalSize, type ModalVariant } from '../modal/modal.js';

export interface ConfirmDialogProps {
  isOpen?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Called with `false` when the dialog closes, after `onConfirm` or `onCancel`. */
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
  /** The question, as the heading. */
  title: ReactNode;
  /** What happens if the reader confirms. It describes the dialog. */
  message?: ReactNode;
  /** More content under the message. */
  children?: ReactNode;
  /** Defaults to the provider's `confirm` string. */
  confirmLabel?: ReactNode;
  /** Defaults to the provider's `cancel` string. */
  cancelLabel?: ReactNode;
  /** Names the busy indicator while `onConfirm` runs. */
  pendingLabel?: string | undefined;
  /** `danger` for a destructive or irreversible action; its confirm button uses the danger variant. */
  variant?: ModalVariant | undefined;
  size?: ModalSize | undefined;
  /** Runs on confirm. A returned promise keeps the dialog open and pending until it settles; a rejection keeps it open with the error shown. */
  onConfirm?: (() => void | Promise<unknown>) | undefined;
  /** Runs when the dialog closes without confirming: Cancel, Escape or an outside press. */
  onCancel?: (() => void) | undefined;
  /** Close on a press outside the dialog. Defaults to false. */
  isDismissable?: boolean | undefined;
  /** Focus the confirm button on open instead of Cancel. */
  autoFocusConfirm?: boolean | undefined;
  className?: string | undefined;
  /** Put on the dialog element. */
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('confirm-dialog', ['message']);

/**
 * A yes-or-no decision in a modal alert dialog: a question, what confirming does, Cancel and a
 * confirm action. Focus starts on Cancel, the safe choice.
 */
export function ConfirmDialog({
  title,
  message,
  children,
  confirmLabel,
  cancelLabel,
  pendingLabel,
  variant = 'default',
  size = 'md',
  onConfirm,
  onCancel,
  onOpenChange,
  autoFocusConfirm = false,
  className,
  ...rest
}: ConfirmDialogProps) {
  const strings = useUiStrings();
  const messageId = useId();
  const confirming = useRef(false);

  return (
    <Modal
      {...rest}
      role="alertdialog"
      title={title}
      variant={variant}
      size={size}
      className={mergeClassNames(hooks.className, className)}
      aria-describedby={message !== undefined ? messageId : undefined}
      onOpenChange={(isOpen) => {
        if (!isOpen && !confirming.current) onCancel?.();
        onOpenChange?.(isOpen);
      }}
      cancelAction={{ label: cancelLabel, autoFocus: !autoFocusConfirm }}
      primaryAction={{
        label: confirmLabel ?? strings.confirm,
        pendingLabel,
        autoFocus: autoFocusConfirm,
        onPress: async (close) => {
          await onConfirm?.();
          confirming.current = true;
          try {
            close();
          } finally {
            confirming.current = false;
          }
        },
      }}
    >
      {message !== undefined || children !== undefined ? (
        <>
          {message !== undefined ? (
            <p {...hooks.slot('message')} id={messageId}>
              {message}
            </p>
          ) : null}
          {children}
        </>
      ) : null}
    </Modal>
  );
}

/** `ConfirmDialog`'s props, less those the controller owns. */
export type ConfirmOptions = Omit<
  ConfirmDialogProps,
  'isOpen' | 'defaultOpen' | 'onOpenChange' | 'onCancel'
>;

/**
 * Opens a `ConfirmDialog` through `controller` and resolves `true` when the reader confirms (after
 * `onConfirm` succeeds), `false` when they cancel, press Escape or dismiss it otherwise.
 */
export function confirm(controller: ModalController, options: ConfirmOptions): Promise<boolean> {
  const handle = controller.open<boolean>({
    render: ({ isOpen, onOpenChange, close }) => (
      <ConfirmDialog
        {...options}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onConfirm={async () => {
          await options.onConfirm?.();
          close(true);
        }}
      />
    ),
  });
  return handle.result.then((value) => value === true);
}
