'use client';

// The dialogs a view switcher opens from a view's actions: naming a view, and confirming a deletion.

import { useState } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Modal } from '../modal/modal.js';
import { TextField } from '../text-field/text-field.js';
import { isComposingKey } from '../../utils/is-composing-key.js';

/**
 * A dialog a view switcher opens, by what it does and the view it acts on, never by a callback: the
 * switcher looks its action up afresh on every render.
 */
export type ViewDialogRequest =
  | { type: 'save-as'; label: string; isOpen: boolean }
  | { type: 'rename' | 'delete'; key: Key; label: string; isOpen: boolean };

type NameSubmit = (label: string) => void | Promise<unknown>;

/** An open dialog with the current action it runs. */
export type ViewDialog =
  | { type: 'save-as' | 'rename'; label: string; isOpen: boolean; onSubmit: NameSubmit }
  | { type: 'delete'; label: string; isOpen: boolean; onSubmit: () => void | Promise<unknown> };

interface ViewDialogsProps {
  /** The open dialog, which stays set while it closes. */
  dialog: ViewDialog | null;
  onClose: () => void;
}

/**
 * Names a new view or renames one: the name field starts from `label`, and Save, or Enter in the
 * field, submits the trimmed name, refused while blank; a returned promise keeps the dialog pending
 * until it settles and open with the failure if it rejects.
 */
function NameViewDialog({
  dialog,
  onClose,
}: ViewDialogsProps & { dialog: Extract<ViewDialog, { onSubmit: NameSubmit }> | null }) {
  const strings = useUiStrings();
  const [draft, setDraft] = useState<string | null>(null);
  const name = (draft ?? dialog?.label ?? '').trim();
  // `close` closes only the opening this save began in, never a dialog opened since.
  const submit = async (close: () => void) => {
    await dialog?.onSubmit(name);
    close();
  };
  return (
    <Modal
      isOpen={dialog?.isOpen ?? false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      onExitComplete={() => setDraft(null)}
      title={dialog?.type === 'rename' ? strings.renameView : strings.newView}
      primaryAction={{ label: strings.save, isDisabled: !name, onPress: submit }}
    >
      {({ runPrimaryAction }) => (
        <TextField
          label={strings.viewName}
          value={draft ?? dialog?.label ?? ''}
          onChange={setDraft}
          onKeyDown={(event) => {
            // Control+Enter is the modal's own shortcut for the same action.
            if (event.key !== 'Enter' || event.ctrlKey || event.metaKey) return;
            if (!isComposingKey(event.nativeEvent)) runPrimaryAction();
          }}
          isRequired
          autoFocus
        />
      )}
    </Modal>
  );
}

/** The view switcher's open dialog: naming a view, or confirming a view's deletion. */
export function ViewDialogs({ dialog, onClose }: ViewDialogsProps) {
  const strings = useUiStrings();
  const deletion = dialog?.type === 'delete' ? dialog : null;
  return (
    <>
      <NameViewDialog dialog={dialog?.type === 'delete' ? null : dialog} onClose={onClose} />
      <Modal
        role="alertdialog"
        isOpen={deletion?.isOpen ?? false}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        tone="danger"
        title={strings.deleteViewTitle(deletion?.label ?? '')}
        description={strings.deleteViewMessage}
        cancelAction={{ autoFocus: true }}
        primaryAction={{
          label: strings.delete,
          onPress: async (close) => {
            await deletion?.onSubmit();
            close();
          },
        }}
      />
    </>
  );
}
