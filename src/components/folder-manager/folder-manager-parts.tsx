import type { Ref } from 'react';
import { Input } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { IconButton } from '../icon-button/icon-button.js';
import type { FolderEdit } from './use-folder-actions.js';

export interface FolderNameInputProps {
  edit: FolderEdit;
  /** The message that describes the field while an attempt was refused. */
  messageId: string | undefined;
  inputRef: Ref<HTMLInputElement>;
  onBlur: (name: string) => void;
}

/** A toolbar action: the button is drawn only when the action is offered. */
export interface FolderToolAction {
  isOffered: boolean;
  isDisabled: boolean;
  /** Why the action is unavailable, shown as the button's tooltip. */
  reason?: string | null | undefined;
  onPress: () => void;
}

export interface FolderToolbarProps {
  create: FolderToolAction;
  rename: FolderToolAction;
  remove: FolderToolAction;
}

export const folderManagerHooks = createHooks('folder-manager', [
  'toolbar',
  'filter',
  'tree',
  'name-input',
  'message',
  'load-error',
]);

const hooks = folderManagerHooks;

function ToolButton({
  action,
  icon,
  label,
}: {
  action: FolderToolAction;
  icon: 'plus' | 'edit' | 'delete';
  label: string;
}) {
  if (!action.isOffered) return null;
  return (
    <IconButton
      icon={icon}
      label={label}
      size="sm"
      isDisabled={action.isDisabled}
      focusableWhenDisabled={Boolean(action.reason)}
      tooltip={action.reason ?? label}
      onPress={action.onPress}
    />
  );
}

/**
 * The name field of a folder being created or renamed. The folder manager reads its keys: Enter
 * submits the name and Escape abandons the edit.
 */
export function FolderNameInput({ edit, messageId, inputRef, onBlur }: FolderNameInputProps) {
  const strings = useUiStrings();
  return (
    <Input
      className={hooks.slotClass('name-input')}
      ref={inputRef}
      aria-label={
        edit.kind === 'create' ? strings.newFolderName : strings.renameItem(edit.original)
      }
      aria-invalid={messageId ? true : undefined}
      aria-describedby={messageId}
      aria-busy={edit.isPending || undefined}
      defaultValue={edit.name}
      readOnly={edit.isPending}
      autoFocus
      onFocus={(event) => event.currentTarget.select()}
      onBlur={(event) => onBlur(event.currentTarget.value)}
    />
  );
}

/** New folder, Rename and Delete, acting on the selected folder. */
export function FolderToolbar({ create, rename, remove }: FolderToolbarProps) {
  const strings = useUiStrings();
  if (!create.isOffered && !rename.isOffered && !remove.isOffered) return null;
  return (
    <div {...hooks.slot('toolbar')}>
      <ToolButton action={create} icon="plus" label={strings.newFolder} />
      <ToolButton action={rename} icon="edit" label={strings.rename} />
      <ToolButton action={remove} icon="delete" label={strings.delete} />
    </div>
  );
}
