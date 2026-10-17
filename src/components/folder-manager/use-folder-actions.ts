import { useRef, useState } from 'react';
import type { Key } from 'react-aria-components';
import { useUiStrings } from '../../core/provider.js';
import { findFolderPath, type FolderItem } from './folder-model.js';

/** A folder being named: a new one under `key`, or the folder `key` being renamed. */
export interface FolderEdit {
  kind: 'create' | 'rename';
  /** The renamed folder, or the new folder's parent (`null`: at the top). */
  key: Key | null;
  /** The name field's starting text: the current name, or the text of a refused attempt. */
  name: string;
  /** The folder's name before the edit; empty for a new folder. */
  original: string;
  isPending: boolean;
}

export interface FolderCallbacks<T extends FolderItem> {
  /** Creates a folder. It may resolve to the new folder's key, which is then selected. */
  onCreate?: ((folder: { name: string; parentKey: Key | null }) => unknown) | undefined;
  onRename?: ((folder: { key: Key; name: string }) => unknown) | undefined;
  onDelete?: ((key: Key) => unknown) | undefined;
  /** Why a folder cannot be deleted, or nothing when it can. */
  getDeleteBlockedReason?: ((folder: T) => string | null | undefined) | undefined;
}

export interface FolderActionsOptions<T extends FolderItem> extends FolderCallbacks<T> {
  folders: readonly T[];
  /** Selects a folder (`null`: no folder) after a create or delete. */
  select: (key: Key | null) => void;
  /** Called when an edit or delete ends, with the folder whose row should take focus. */
  onSettle: (key: Key | null) => void;
}

export interface FolderActions<T extends FolderItem> {
  edit: FolderEdit | null;
  isDeleting: boolean;
  /** The reason of the last refused action. */
  message: string | null;
  startCreate(parentKey: Key | null): void;
  startRename(folder: T): void;
  /** Ends the edit with `name`: a blank or unchanged name abandons it. */
  submit(name: string): Promise<void>;
  cancel(): void;
  remove(folder: T): Promise<void>;
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function isKey(value: unknown): value is Key {
  return typeof value === 'string' || typeof value === 'number';
}

/**
 * The folder manager's edits and deletes. Each runs the caller's callback, which may return a
 * promise: while it is pending the edit ignores further submits, and a refusal keeps the edit open
 * with the typed name and shows the error's message.
 */
export function useFolderActions<T extends FolderItem>({
  folders,
  onCreate,
  onRename,
  onDelete,
  getDeleteBlockedReason,
  select,
  onSettle,
}: FolderActionsOptions<T>): FolderActions<T> {
  const strings = useUiStrings();
  const [edit, setEditState] = useState<FolderEdit | null>(null);
  const [isDeleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const latest = useRef<FolderEdit | null>(null);
  const setEdit = (next: FolderEdit | null) => {
    latest.current = next;
    setEditState(next);
  };
  const start = (next: Omit<FolderEdit, 'isPending'>) => {
    setMessage(null);
    setEdit({ ...next, isPending: false });
  };
  const finish = (current: FolderEdit, key: Key | null) => {
    setEdit(null);
    onSettle(current.kind === 'rename' ? current.key : key);
  };

  const run = async (current: FolderEdit, name: string): Promise<Key | null> => {
    if (current.kind === 'rename' && current.key !== null) {
      await onRename?.({ key: current.key, name });
      return current.key;
    }
    const created = await onCreate?.({ name, parentKey: current.key });
    return isKey(created) ? created : current.key;
  };

  const submit = async (text: string) => {
    const current = latest.current;
    if (!current || current.isPending) return;
    const name = text.trim();
    if (!name || name === current.original) return finish(current, current.key);
    setEdit({ ...current, name, isPending: true });
    try {
      const key = await run(current, name);
      setMessage(null);
      if (current.kind === 'create') select(key);
      finish(current, key);
    } catch (error) {
      setEdit({ ...current, name, isPending: false });
      setMessage(messageOf(error, strings.actionFailed));
    }
  };

  const remove = async (folder: T) => {
    const reason = getDeleteBlockedReason?.(folder);
    if (reason) return setMessage(reason);
    const parentKey = findFolderPath(folders, folder.id).at(-2)?.id ?? null;
    setDeleting(true);
    setMessage(null);
    try {
      await onDelete?.(folder.id);
      select(parentKey);
      onSettle(parentKey);
    } catch (error) {
      setMessage(messageOf(error, strings.actionFailed));
    } finally {
      setDeleting(false);
    }
  };

  return {
    edit,
    isDeleting,
    message,
    startCreate: (parentKey) => start({ kind: 'create', key: parentKey, name: '', original: '' }),
    startRename: (folder) =>
      start({ kind: 'rename', key: folder.id, name: folder.name, original: folder.name }),
    submit,
    cancel: () => {
      if (latest.current && !latest.current.isPending) finish(latest.current, latest.current.key);
    },
    remove,
  };
}
