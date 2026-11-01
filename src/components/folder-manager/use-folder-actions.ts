'use client';

import { toErrorMessage } from '../../utils/to-error-message.js';
import { useLayoutEffect, useRef, useState } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { findFolderPath, type FolderItem } from './folder-model.js';
import { isKey } from '../../utils/is-key.js';
import { useLatest } from '../../utils/use-latest.js';
import { useLifetimeSignal } from '../../utils/use-lifetime-signal.js';

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
  /** Deletes a folder; deleting several selected folders calls it for each, one after another. */
  onDelete?: ((key: Key) => unknown) | undefined;
  /** Why a folder cannot be deleted, or nothing when it can. */
  getDeleteBlockedReason?: ((folder: T) => string | null | undefined) | undefined;
}

interface FolderActionsOptions<T extends FolderItem> extends FolderCallbacks<T> {
  folders: readonly T[];
  /** Selects a folder (`null`: no folder) after a create or delete. */
  select: (key: Key | null) => void;
  /** Called when an edit or delete ends, with the folder whose row should take focus. */
  onSettle: (key: Key | null) => void;
  /** Called when an edit ends because its folder, its parent or its callback left. */
  onRevoke: () => void;
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
  /**
   * Deletes `targets`, in order, stopping at the first refusal. Every folder of `checked` (the
   * targets and the selected folders inside them) is asked for a blocked reason first.
   */
  remove(targets: readonly T[], checked?: readonly T[]): Promise<void>;
}

/** Runs an edit's callback; resolves to the folder to select and focus once it ends. */
async function runEdit(
  current: FolderEdit,
  name: string,
  { onCreate, onRename }: Pick<FolderCallbacks<FolderItem>, 'onCreate' | 'onRename'>,
): Promise<Key | null> {
  if (current.kind === 'rename' && current.key !== null) {
    await onRename?.({ key: current.key, name });
    return current.key;
  }
  const created = await onCreate?.({ name, parentKey: current.key });
  return isKey(created) ? created : current.key;
}

/** Whether an edit's folder (rename) or parent (create) and its callback are still there. */
function isEditAvailable(
  current: FolderEdit,
  folders: readonly FolderItem[],
  { onCreate, onRename }: Pick<FolderCallbacks<FolderItem>, 'onCreate' | 'onRename'>,
): boolean {
  const isPresent = current.key === null || findFolderPath(folders, current.key).length > 0;
  const hasCallback = current.kind === 'rename' ? onRename !== undefined : onCreate !== undefined;
  return isPresent && (current.kind === 'create' || current.key !== null) && hasCallback;
}

/** Ends an edit that is not pending once its folder, its parent or its callback leaves. */
function useEditRevocation({
  edit,
  folders,
  onCreate,
  onRename,
  onRevoke,
  setEdit,
}: Pick<FolderCallbacks<FolderItem>, 'onCreate' | 'onRename'> & {
  edit: FolderEdit | null;
  folders: readonly FolderItem[];
  onRevoke: () => void;
  setEdit: (next: null) => void;
}) {
  const isRevoked =
    edit !== null && !edit.isPending && !isEditAvailable(edit, folders, { onCreate, onRename });
  const end = useLatest(() => {
    setEdit(null);
    onRevoke();
  });
  useLayoutEffect(() => {
    if (isRevoked) end.current();
  }, [isRevoked, end]);
}

/**
 * The folder manager's edits and deletes. Each runs the caller's callback, which may return a
 * promise: while it is pending the edit ignores further submits, and a refusal keeps the edit open
 * with the typed name and shows the error's message. Once the manager unmounts, a pending action
 * settles nothing: it neither selects, moves focus nor reports its refusal.
 * An edit that is not pending ends without a callback once its folder (rename) or parent (create)
 * leaves `folders`, or its callback goes; the folder coming back does not reopen it.
 */
export function useFolderActions<T extends FolderItem>({
  folders,
  onCreate,
  onRename,
  onDelete,
  getDeleteBlockedReason,
  select,
  onSettle,
  onRevoke,
}: FolderActionsOptions<T>): FolderActions<T> {
  const strings = useUiStrings();
  const [edit, setEditState] = useState<FolderEdit | null>(null);
  const [isDeleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const latest = useRef<FolderEdit | null>(null);
  const beginAction = useLifetimeSignal();
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

  useEditRevocation({ edit, folders, onCreate, onRename, onRevoke, setEdit });

  const submit = async (text: string) => {
    const current = latest.current;
    if (!current || current.isPending) return;
    const name = text.trim();
    if (!name || name === current.original) return finish(current, current.key);
    setEdit({ ...current, name, isPending: true });
    const signal = beginAction();
    try {
      const key = await runEdit(current, name, { onCreate, onRename });
      if (signal.aborted) return;
      setMessage(null);
      if (current.kind === 'create') select(key);
      finish(current, key);
    } catch (error) {
      if (signal.aborted) return;
      setEdit({ ...current, name, isPending: false });
      setMessage(toErrorMessage(error, strings.actionFailed));
    }
  };

  const remove = async (targets: readonly T[], checked: readonly T[] = targets) => {
    const reason = checked.map((folder) => getDeleteBlockedReason?.(folder)).find(Boolean);
    if (reason) return setMessage(reason);
    const parentKey = findFolderPath(folders, targets[0]?.id ?? null).at(-2)?.id ?? null;
    setDeleting(true);
    setMessage(null);
    const signal = beginAction();
    try {
      for (const folder of targets) await onDelete?.(folder.id);
      if (signal.aborted) return;
      select(parentKey);
      onSettle(parentKey);
    } catch (error) {
      if (!signal.aborted) setMessage(toErrorMessage(error, strings.actionFailed));
    } finally {
      if (!signal.aborted) setDeleting(false);
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
