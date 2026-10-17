import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { useUiStrings } from '../../core/provider.js';
import type {
  ModalController,
  ModalEntryRenderProps,
} from '../modal-controller/modal-controller.js';
import { Modal, type ModalProps } from '../modal/modal.js';
import { TextField } from '../text-field/text-field.js';
import { ConfirmDialog, type ConfirmOptions } from './confirm-dialog.js';

/** Options of `alert`: a confirm dialog whose one action acknowledges it. */
export type AlertOptions = Omit<
  ConfirmOptions,
  'cancelLabel' | 'secondaryActionLabel' | 'onSecondaryAction' | 'autoFocusConfirm'
>;

/** Options of `prompt`: a dialog that asks for one line of text. */
export interface PromptOptions extends Pick<ModalProps, 'title'> {
  /** What the text is for, under the title. */
  message?: ReactNode;
  /** Names the text field. */
  label: string;
  /** The text the field starts with. */
  defaultValue?: string | undefined;
  /** Defaults to the provider's `ok` string. */
  confirmLabel?: ReactNode;
  /** Defaults to the provider's `cancel` string. */
  cancelLabel?: ReactNode;
}

function AlertDialog({
  options,
  isOpen,
  onOpenChange,
  close,
}: Omit<ModalEntryRenderProps<void>, 'handle'> & { options: AlertOptions }) {
  const strings = useUiStrings();
  return (
    <ConfirmDialog
      tone="info"
      confirmLabel={strings.ok}
      {...options}
      cancelLabel={null}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onConfirm={async () => {
        await options.onConfirm?.();
        close();
      }}
    />
  );
}

function PromptDialog({
  options,
  isOpen,
  onOpenChange,
  close,
}: Omit<ModalEntryRenderProps<string>, 'handle'> & { options: PromptOptions }) {
  const strings = useUiStrings();
  const { title, message, label, defaultValue = '', confirmLabel, cancelLabel } = options;
  const [text, setText] = useState(defaultValue);
  // Enter answers the prompt, as in the browser's own; Control+Enter runs the action as in any modal.
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) close(text);
  };
  return (
    <Modal
      title={title}
      description={message}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      cancelAction={{ label: cancelLabel }}
      primaryAction={{ label: confirmLabel ?? strings.ok, onPress: () => close(text) }}
    >
      <TextField
        label={label}
        defaultValue={defaultValue}
        onChange={setText}
        onKeyDown={onKeyDown}
        autoFocus
      />
    </Modal>
  );
}

/**
 * Opens an alert through `controller`: a `ConfirmDialog` (tone `info` by default) whose one action,
 * labelled by the provider's `ok` string, acknowledges it. Resolves once it closes, however it closes.
 */
export function alert(controller: ModalController, options: AlertOptions): Promise<void> {
  const handle = controller.open<void>({
    render: (entry) => <AlertDialog {...entry} options={options} />,
  });
  return handle.result.then(() => undefined);
}

/**
 * Opens a dialog through `controller` that asks for one line of text, and resolves to the text when
 * the reader confirms (the action or Enter), or `null` when they cancel or dismiss it.
 */
export function prompt(
  controller: ModalController,
  options: PromptOptions,
): Promise<string | null> {
  const handle = controller.open<string>({
    render: (entry) => <PromptDialog {...entry} options={options} />,
  });
  return handle.result.then((value) => value ?? null);
}
