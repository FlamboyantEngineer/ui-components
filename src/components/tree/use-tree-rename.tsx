// Renaming a row in place: F2 swaps its label for a text field, Enter or leaving the field renames
// the row, and Escape keeps the old name.

import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { Input, type Key } from 'react-aria-components';
import { useUiStrings } from '../../core/provider.js';
import type { TreeItemData, TreeProps } from './tree.js';
import { treeHooks as hooks } from './tree-hooks.js';

export type TreeRenameOptions<T extends TreeItemData> = Pick<
  TreeProps<T>,
  'onRename' | 'canRename'
> & { getTextValue: (item: T) => string };

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

function TreeRenameInput(props: {
  name: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onBlur: () => void;
}) {
  const strings = useUiStrings();
  return (
    <Input
      ref={props.inputRef}
      className={hooks.slotClass('rename-input')}
      aria-label={strings.renameItem(props.name)}
      defaultValue={props.name}
      autoFocus
      onFocus={(event) => event.currentTarget.select()}
      onBlur={props.onBlur}
    />
  );
}

/**
 * Renaming rows in place: F2 on a row the owner lets rename (`canRename`, every row by default)
 * opens a name field holding the text value. Enter and leaving the field report a changed, non-blank
 * name through `onRename`; Escape abandons it. Enter and Escape return focus to the row.
 */
export function useTreeRename<T extends TreeItemData>(
  options: TreeRenameOptions<T>,
): TreeRename<T> | null {
  const { onRename, canRename, getTextValue } = options;
  const [editing, setEditing] = useState<T | null>(null);
  const editingRef = useRef<T | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  return useMemo(() => {
    if (!onRename) return null;
    const finish = (isCommit: boolean) => {
      const item = editingRef.current;
      if (!item) return;
      editingRef.current = null;
      setEditing(null);
      const name = inputRef.current?.value.trim() ?? '';
      if (isCommit && name !== '' && name !== getTextValue(item)) onRename(item, name);
    };
    return {
      editingKey: editing?.id ?? null,
      start(item: T) {
        if (canRename && !canRename(item)) return false;
        editingRef.current = item;
        setEditing(item);
        return true;
      },
      isEditorEvent: (event: KeyboardEvent<HTMLElement>) => event.target === inputRef.current,
      onEditorKeyDown(event: KeyboardEvent<HTMLElement>) {
        event.stopPropagation();
        if (event.key !== 'Enter' && event.key !== 'Escape') return;
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
  }, [editing, onRename, canRename, getTextValue]);
}
