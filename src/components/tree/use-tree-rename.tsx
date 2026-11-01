'use client';

// Renaming a row in place: F2 swaps its label for a text field, Enter or leaving the field renames
// the row, and Escape keeps the old name. The rename acts on the row as the owner draws it now: a
// row that becomes disabled, leaves the tree or stops taking renames closes its field unrenamed.

import { isFocused } from '../../utils/focus-target.js';
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { Input } from '../../primitives/index.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { walkTree } from '../../utils/walk-tree.js';
import type { TreeItemData, TreeProps } from './tree-props.js';
import { treeHooks as hooks } from './tree-hooks.js';

type TreeRenameOptions<T extends TreeItemData> = Pick<TreeProps<T>, 'onRename' | 'canRename'> & {
  getTextValue: (item: T) => string;
  /** The rows the tree shows, filtered, and their children. */
  items: readonly T[];
  getChildren: (item: T) => readonly T[] | undefined;
  disabledKeys: ReadonlySet<Key> | undefined;
};

type RenameScope<T extends TreeItemData> = Pick<
  TreeRenameOptions<T>,
  'canRename' | 'items' | 'getChildren' | 'disabledKeys'
>;

/** The row with a key as the tree shows it now, while it may still be renamed. */
function findRenameable<T extends TreeItemData>(key: Key, scope: RenameScope<T>): T | null {
  if (scope.disabledKeys?.has(key)) return null;
  for (const item of walkTree(scope.items, scope.getChildren)) {
    if (item.id !== key) continue;
    return !scope.canRename || scope.canRename(item) ? item : null;
  }
  return null;
}

/** Moves focus from a closing name field to its row, or to the tree when the row takes no focus. */
function focusNear(input: HTMLInputElement) {
  input.closest<HTMLElement>('[role="row"]')?.focus();
  if (!isFocused(input)) return;
  input.closest<HTMLElement>('[role="treegrid"]')?.focus();
}

/** A tree's in-place rename, while the owner takes renames. */
export interface TreeRename<T> {
  /** The row being renamed, or `null`. */
  editingKey: Key | null;
  /** Starts renaming a row the owner lets rename; returns whether it started. */
  start: (item: T) => boolean;
  /** Handles a key typed in the name field; no key there reaches the tree. */
  onEditorKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  /** Whether a key comes from the name field. */
  isEditorEvent: (event: KeyboardEvent<HTMLElement>) => boolean;
  /** The name field of the row being renamed. */
  renderEditor: (item: T) => ReactNode;
}

function TreeRenameInput({
  name,
  inputRef,
  onBlur,
}: {
  name: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onBlur: () => void;
}) {
  const strings = useUiStrings();
  return (
    <Input
      ref={inputRef}
      className={hooks.slotClass('rename-input')}
      aria-label={strings.renameItem(name)}
      defaultValue={name}
      autoFocus
      onFocus={(event) => event.currentTarget.select()}
      onBlur={onBlur}
    />
  );
}

/**
 * Renaming rows in place: F2 on a row the owner lets rename (`canRename`, every row by default)
 * opens a name field holding the text value. Enter and leaving the field report a changed, non-blank
 * name for the row as it is now through `onRename`; Escape abandons it. Enter and Escape return focus
 * to the row. A row that becomes disabled, leaves the shown rows or stops taking renames closes its
 * field without renaming, returning focus to the row while it is still shown.
 */
export function useTreeRename<T extends TreeItemData>(
  options: TreeRenameOptions<T>,
): TreeRename<T> | null {
  const { onRename, getTextValue, canRename, items, getChildren, disabledKeys } = options;
  const [editingKey, setEditingKey] = useState<Key | null>(null);
  const editingRef = useRef<Key | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scope = useMemo(
    () => ({ canRename, items, getChildren, disabledKeys }),
    [canRename, items, getChildren, disabledKeys],
  );
  const isRevoked =
    editingKey !== null && (onRename === undefined || findRenameable(editingKey, scope) === null);
  useLayoutEffect(() => {
    if (!isRevoked) return;
    const input = inputRef.current;
    editingRef.current = null;
    if (input && isFocused(input)) focusNear(input);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- focus leaves the committed field before it unmounts.
    setEditingKey(null);
  }, [isRevoked]);
  return useMemo(() => {
    // A field open as `onRename` goes stays one render, so the revocation can move its focus.
    if (!onRename && editingKey === null) return null;
    const finish = (isCommit: boolean) => {
      const key = editingRef.current;
      if (key === null) return;
      editingRef.current = null;
      setEditingKey(null);
      const item = findRenameable(key, scope);
      const name = inputRef.current?.value.trim() ?? '';
      if (isCommit && item && name !== '' && name !== getTextValue(item)) onRename?.(item, name);
    };
    return {
      editingKey,
      start(item: T) {
        if (!findRenameable(item.id, scope)) return false;
        editingRef.current = item.id;
        setEditingKey(item.id);
        return true;
      },
      isEditorEvent: (event: KeyboardEvent<HTMLElement>) => event.target === inputRef.current,
      onEditorKeyDown(event: KeyboardEvent<HTMLElement>) {
        event.stopPropagation();
        if (event.key !== 'Enter' && event.key !== 'Escape') return;
        if (isComposingKey(event.nativeEvent)) return;
        event.preventDefault();
        const row = inputRef.current?.closest<HTMLElement>('[role="row"]');
        finish(event.key === 'Enter');
        row?.focus();
      },
      renderEditor: (item: T) => (
        <TreeRenameInput
          name={getTextValue(item)}
          inputRef={inputRef}
          onBlur={() => finish(true)}
        />
      ),
    };
  }, [editingKey, scope, onRename, getTextValue]);
}
