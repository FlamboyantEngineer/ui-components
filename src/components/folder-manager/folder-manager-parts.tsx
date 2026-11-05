'use client';

import type { Ref } from 'react';
import { DeleteGlyph, EditGlyph, type GlyphComponent, PlusGlyph } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Input } from '../../primitives/index.js';
import { Button } from '../button/button.js';
import type { FolderEdit } from './use-folder-actions.js';

interface FolderNameInputProps {
  edit: FolderEdit;
  /** The message that describes the field while an attempt was refused. */
  messageId: string | undefined;
  /** The folders are loading: a submit waits. */
  isWaiting: boolean;
  inputRef: Ref<HTMLInputElement>;
  /** Called with the text as the reader types it. */
  onType: (name: string) => void;
  onBlur: (name: string) => void;
}

/** A toolbar action: the button is drawn only when the action is offered. */
interface FolderToolAction {
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
  icon: GlyphComponent;
  label: string;
}) {
  if (!action.isOffered) return null;
  return (
    <Button
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
 * submits the name and Escape abandons the edit. Its text lives with the edit, so a field that
 * remounts starts from what was typed; focus then selects an untouched name, or puts the caret
 * after typed text.
 */
export function FolderNameInput({
  edit,
  messageId,
  isWaiting,
  inputRef,
  onType,
  onBlur,
}: FolderNameInputProps) {
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
      aria-busy={edit.isPending || isWaiting || undefined}
      defaultValue={edit.name}
      readOnly={edit.isPending}
      autoFocus
      onFocus={(event) => {
        const input = event.currentTarget;
        if (input.value === edit.original) input.select();
        else input.setSelectionRange(input.value.length, input.value.length);
      }}
      onChange={(event) => onType(event.currentTarget.value)}
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
      <ToolButton action={create} icon={PlusGlyph} label={strings.newFolder} />
      <ToolButton action={rename} icon={EditGlyph} label={strings.rename} />
      <ToolButton action={remove} icon={DeleteGlyph} label={strings.delete} />
    </div>
  );
}
