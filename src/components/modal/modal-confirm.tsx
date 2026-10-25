import { useId, useRef, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';
import type { ModalController } from '../modal-controller/modal-controller.js';
import { Modal, type ModalAction, type ModalProps, type ModalTone } from './modal.js';

export interface ModalConfirmationProps
  extends
    Pick<
      ModalProps,
      'isOpen' | 'defaultOpen' | 'onOpenChange' | 'isDismissable' | 'title' | 'size' | 'placement'
    >,
    Pick<ModalAction, 'pendingLabel'>,
    BaseProps {
  /** What happens if the reader confirms; it describes the dialog. */
  message?: ReactNode;
  /** More content under the message. */
  children?: ReactNode;
  /** Defaults to `neutral`. */
  tone?: ModalTone | undefined;
  /** Drawn before the title; defaults to the tone's glyph for `info`, `success` and `warning`. */
  icon?: IconSource;
  /** Defaults to the provider's `confirm` string. */
  confirmLabel?: ReactNode;
  /** Defaults to the provider's `cancel` string; `null` leaves Cancel out, for an acknowledgement. */
  cancelLabel?: ReactNode;
  /** Labels a third action between Cancel and the confirm action, such as "Don't save". */
  secondaryActionLabel?: ReactNode;
  /** Runs on confirm; a returned promise keeps the dialog pending until it settles, open if it rejects. */
  onConfirm?: (() => void | Promise<unknown>) | undefined;
  /** Runs on the third action, then closes the dialog, like `onConfirm`. */
  onSecondaryAction?: (() => void | Promise<unknown>) | undefined;
  /** Runs when the dialog closes without an action: Cancel, Escape or an outside press. */
  onCancel?: (() => void) | undefined;
  /** Focuses the confirm action on open instead of Cancel. */
  autoFocusConfirm?: boolean | undefined;
}

/** `ModalConfirmation`'s props, less those the controller owns. */
export type ConfirmOptions = Omit<
  ModalConfirmationProps,
  'isOpen' | 'defaultOpen' | 'onOpenChange' | 'onCancel'
>;

const hooks = createHooks('modal', ['confirmation-icon', 'message']);

const toneGlyphs: Partial<Record<ModalTone, IconSource>> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
};

/** The title, led by the tone's glyph or the caller's icon. */
function ConfirmTitle({ title, icon }: { title: ReactNode; icon: IconSource }) {
  if (isEmptyNode(icon)) return title;
  return (
    <>
      <Icon {...toIconProps(icon)} className={hooks.slotClass('confirmation-icon')} /> {title}
    </>
  );
}

/** Runs an action, then closes without reporting a cancel. */
function useClosingAction() {
  const isClosingByAction = useRef(false);
  const toAction =
    (run: (() => void | Promise<unknown>) | undefined) => async (close: () => void) => {
      await run?.();
      isClosingByAction.current = true;
      try {
        close();
      } finally {
        isClosingByAction.current = false;
      }
    };
  return { isClosingByAction, toAction };
}

/**
 * A yes-or-no decision in a modal alert dialog: a question, what confirming does, Cancel and a
 * confirm action, optionally a third action. Focus starts on Cancel, the safe choice.
 */
export function ModalConfirmation({
  message,
  children,
  tone = 'neutral',
  icon = toneGlyphs[tone],
  title,
  confirmLabel,
  cancelLabel,
  secondaryActionLabel,
  pendingLabel,
  onConfirm,
  onSecondaryAction,
  onCancel,
  onOpenChange,
  autoFocusConfirm = false,
  className,
  ...rest
}: ModalConfirmationProps) {
  const strings = useUiStrings();
  const messageId = useId();
  const { isClosingByAction, toAction } = useClosingAction();
  const hasCancel = cancelLabel !== null;
  return (
    <Modal
      {...rest}
      role="alertdialog"
      tone={tone}
      title={<ConfirmTitle title={title} icon={icon} />}
      className={className}
      aria-describedby={isEmptyNode(message) ? undefined : messageId}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isClosingByAction.current) onCancel?.();
        onOpenChange?.(isOpen);
      }}
      cancelAction={hasCancel ? { label: cancelLabel, autoFocus: !autoFocusConfirm } : null}
      secondaryAction={
        isEmptyNode(secondaryActionLabel)
          ? undefined
          : { label: secondaryActionLabel, onPress: toAction(onSecondaryAction) }
      }
      primaryAction={{
        label: confirmLabel ?? strings.confirm,
        pendingLabel,
        autoFocus: autoFocusConfirm || !hasCancel,
        onPress: toAction(onConfirm),
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
 * Opens a `ModalConfirmation` through `controller` and resolves `true` when the reader confirms (after
 * `onConfirm` succeeds), `false` when they cancel, take the third action or dismiss it otherwise.
 */
export function confirm(controller: ModalController, options: ConfirmOptions): Promise<boolean> {
  const handle = controller.open<boolean>({
    render: ({ isOpen, onOpenChange, close }) => (
      <ModalConfirmation
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
