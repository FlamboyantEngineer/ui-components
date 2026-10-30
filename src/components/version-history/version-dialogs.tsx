// The dialogs a version history opens from a version's menu: confirming a restore, and naming.

import { useState } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Modal } from '../modal/modal.js';
import { TextField } from '../text-field/text-field.js';

/** The version a dialog is open for: its key, the name it shows and its current name. */
export interface VersionDialogTarget {
  key: Key;
  /** The version's name, or its time when it has none. */
  title: string;
  /** The version's own name; empty for a version without one. */
  label: string;
}

interface DialogProps<Action> {
  /** The version the dialog is for; it stays set while the dialog closes. */
  target: VersionDialogTarget | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: Action;
}

/** Confirms bringing a version back as the current one before `onAction` restores it. */
export function RestoreVersionDialog({
  target,
  isOpen,
  onClose,
  onAction,
}: DialogProps<(key: Key) => void | Promise<unknown>>) {
  const strings = useUiStrings();
  return (
    <Modal
      role="alertdialog"
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={strings.restoreVersionTitle(target?.title ?? '')}
      description={strings.restoreVersionMessage}
      cancelAction={{ autoFocus: true }}
      primaryAction={{
        label: strings.restore,
        onPress: async (close) => {
          if (target) await onAction(target.key);
          close();
        },
      }}
    />
  );
}

/**
 * Names a version, or renames it. Saving a changed name (trimmed; empty removes the name) calls
 * `onAction` and closes the dialog; saving the same name only closes it. Enter in the field saves
 * through the dialog's action, so it is pending until a returned promise settles and shows a failure.
 */
export function RenameVersionDialog({
  target,
  isOpen,
  onClose,
  onAction,
}: DialogProps<(key: Key, label: string) => void | Promise<unknown>>) {
  const strings = useUiStrings();
  const [draft, setDraft] = useState<{ key: Key; value: string } | null>(null);
  const label = target?.label ?? '';
  const value = draft !== null && draft.key === target?.key ? draft.value : label;
  const save = async () => {
    const trimmed = value.trim();
    if (target && trimmed !== label) await onAction(target.key, trimmed);
    onClose();
  };
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      onExitComplete={() => setDraft(null)}
      title={label === '' ? strings.nameVersion : strings.renameVersion}
      primaryAction={{ label: strings.save, onPress: save }}
    >
      {({ runPrimaryAction }) => (
        <TextField
          label={strings.versionName}
          value={value}
          onChange={(next) => {
            if (target) setDraft({ key: target.key, value: next });
          }}
          onKeyDown={(event) => {
            // Control+Enter is the modal's own shortcut for the same action.
            if (event.key !== 'Enter' || event.ctrlKey || event.metaKey) return;
            if (!event.nativeEvent.isComposing) runPrimaryAction();
          }}
          autoFocus
        />
      )}
    </Modal>
  );
}
