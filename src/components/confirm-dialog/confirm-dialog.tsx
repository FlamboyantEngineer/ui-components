import { useId, useRef, type ReactNode } from 'react';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import type { ModalController } from '../modal-controller/modal-controller.js';
import { Modal, type ModalAction, type ModalProps } from '../modal/modal.js';

export interface ConfirmDialogProps
  extends
    Pick<
      ModalProps,
      'isOpen' | 'defaultOpen' | 'onOpenChange' | 'isDismissable' | 'title' | 'tone' | 'size'
    >,
    Pick<ModalAction, 'pendingLabel'>,
    BaseProps {
  /** What happens if the reader confirms; it describes the dialog. */
  message?: ReactNode;
  /** More content under the message. */
  children?: ReactNode;
  /** Defaults to the provider's `confirm` string. */
  confirmLabel?: ReactNode;
  /** Defaults to the provider's `cancel` string. */
  cancelLabel?: ReactNode;
  /** Runs on confirm; a returned promise keeps the dialog pending until it settles, open if it rejects. */
  onConfirm?: (() => void | Promise<unknown>) | undefined;
  /** Runs when the dialog closes without confirming: Cancel, Escape or an outside press. */
  onCancel?: (() => void) | undefined;
  /** Focuses the confirm action on open instead of Cancel. */
  autoFocusConfirm?: boolean | undefined;
}

/** `ConfirmDialog`'s props, less those the controller owns. */
export type ConfirmOptions = Omit<
  ConfirmDialogProps,
  'isOpen' | 'defaultOpen' | 'onOpenChange' | 'onCancel'
>;

const hooks = createHooks('confirm-dialog', ['message']);

/**
 * A yes-or-no decision in a modal alert dialog: a question, what confirming does, Cancel and a
 * confirm action. Focus starts on Cancel, the safe choice.
 */
export function ConfirmDialog({
  message,
  children,
  confirmLabel,
  cancelLabel,
  pendingLabel,
  onConfirm,
  onCancel,
  onOpenChange,
  autoFocusConfirm = false,
  className,
  ...rest
}: ConfirmDialogProps) {
  const strings = useUiStrings();
  const messageId = useId();
  const isConfirming = useRef(false);
  return (
    <Modal
      {...rest}
      role="alertdialog"
      className={mergeClassNames(hooks.className, className)}
      aria-describedby={isEmptyNode(message) ? undefined : messageId}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isConfirming.current) onCancel?.();
        onOpenChange?.(isOpen);
      }}
      cancelAction={{ label: cancelLabel, autoFocus: !autoFocusConfirm }}
      primaryAction={{
        label: confirmLabel ?? strings.confirm,
        pendingLabel,
        autoFocus: autoFocusConfirm,
        onPress: async (close) => {
          await onConfirm?.();
          isConfirming.current = true;
          try {
            close();
          } finally {
            isConfirming.current = false;
          }
        },
      }}
    >
      {isEmptyNode(message) && isEmptyNode(children) ? null : (
        <>
          {isEmptyNode(message) ? null : (
            <p {...hooks.slot('message')} id={messageId}>
              {message}
            </p>
          )}
          {children}
        </>
      )}
    </Modal>
  );
}

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
