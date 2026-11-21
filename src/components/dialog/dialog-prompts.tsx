'use client';

import { type KeyboardEvent, type ReactNode, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { TextField } from '../text-field/text-field.js';
import { Dialog, type DialogProps } from './dialog.js';
import { AlertDialogConfirmation, type ConfirmOptions } from './dialog-confirm.js';
import type { DialogController, DialogEntryRenderProps } from './dialog-controller.js';

/** Options of `alert`: a confirm dialog whose one action acknowledges it. */
export type AlertOptions = Omit<
  ConfirmOptions,
  'cancelLabel' | 'secondaryActionLabel' | 'onSecondaryAction' | 'autoFocusConfirm'
>;

/** Options of `prompt`: a dialog that asks for one line of text. */
export interface PromptOptions extends Pick<DialogProps, 'title'> {
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

function AlertEntry({
  options,
  isOpen,
  onOpenChange,
  close,
}: Omit<DialogEntryRenderProps<void>, 'handle'> & { options: AlertOptions }) {
  const strings = useUiStrings();
  return (
    <AlertDialogConfirmation
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
}: Omit<DialogEntryRenderProps<string>, 'handle'> & { options: PromptOptions }) {
  const strings = useUiStrings();
  const { title, message, label, defaultValue = '', confirmLabel, cancelLabel } = options;
  const [text, setText] = useState(defaultValue);
  // Enter answers the prompt, as in the browser's own; Control+Enter runs the action as in any modal.
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !isComposingKey(event.nativeEvent)) close(text);
  };
  return (
    <Dialog
      title={title}
      isDismissable={false}
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
    </Dialog>
  );
}

/**
 * Opens an alert through `controller`: a `AlertDialogConfirmation` (tone `info` by default) whose one action,
 * labelled by the provider's `ok` string, acknowledges it. Resolves once it closes, however it closes.
 */
export function alert(controller: DialogController, options: AlertOptions): Promise<void> {
  const handle = controller.open<void>({
    render: (entry) => <AlertEntry {...entry} options={options} />,
  });
  return handle.result.then(() => undefined);
}

/**
 * Opens a dialog through `controller` that asks for one line of text, and resolves to the text when
 * the reader confirms (the action or Enter), or `null` when they cancel or dismiss it.
 */
export function prompt(
  controller: DialogController,
  options: PromptOptions,
): Promise<string | null> {
  const handle = controller.open<string>({
    render: (entry) => <PromptDialog {...entry} options={options} />,
  });
  return handle.result.then((value) => value ?? null);
}
