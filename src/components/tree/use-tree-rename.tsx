'use client';

// Renaming a row in place: F2 swaps its label for a text field, Enter or leaving the field renames
// the row, and Escape keeps the old name. The rename acts on the row as the owner draws it now: a
// row that becomes disabled, leaves the tree or stops taking renames closes its field unrenamed.

import {
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Input } from '../../primitives/index.js';
import { isFocused } from '../../utils/focus-target.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { walkTree } from '../../utils/walk-tree.js';
import { InlineError } from '../inline-error/inline-error.js';
import { Stack } from '../layout/layout.js';
import { treeHooks as hooks } from './tree-hooks.js';
import type { TreeItemData, TreeProps } from './tree-props.js';
import { useTreeRenameRequest } from './use-tree-rename-request.js';

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
  pending,
  error,
}: {
  name: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onBlur: () => void;
  pending: boolean;
  error: string | null;
}) {
  const strings = useUiStrings();
  const errorId = useId();
  return (
    <Stack space="xs">
      <Input
        ref={inputRef}
        className={hooks.slotClass('rename-input')}
        aria-label={strings.renameItem(name)}
        defaultValue={name}
        readOnly={pending}
        aria-busy={pending || undefined}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? errorId : undefined}
        autoFocus
        onFocus={(event) => event.currentTarget.select()}
        onBlur={onBlur}
      />
      {error ? (
        <InlineError id={errorId} className={hooks.slotClass('rename-error')}>
          {error}
        </InlineError>
      ) : null}
    </Stack>
  );
}

/**
 * Commits the current draft once, preserving its field until an asynchronous rename succeeds. A
 * rejected draft is submitted again only by Enter, or when focus leaves it after it changed.
 */
function finishRename<T extends TreeItemData>(options: {
  key: Key | null;
  input: HTMLInputElement | null;
  scope: RenameScope<T>;
  request: ReturnType<typeof useTreeRenameRequest>;
  onRename: TreeProps<T>['onRename'];
  getTextValue: (item: T) => string;
  close: () => void;
  isCommit: boolean;
  restoreFocus: boolean;
  /** The draft the last rejected request submitted, while its error shows. */
  submitted: { current: string | null };
}) {
  const { key, input, scope, request, onRename, getTextValue, isCommit, restoreFocus } = options;
  if (key === null || request.pending) return;
  const item = findRenameable(key, scope);
  const name = input?.value.trim() ?? '';
  // Leaving a rejected draft unchanged keeps it and its error; only Enter submits it again.
  if (!restoreFocus && request.error !== null && name === options.submitted.current) return;
  const close = () => {
    options.close();
    if (restoreFocus && input && isFocused(input)) focusNear(input);
  };
  if (isCommit && item && name !== '' && name !== getTextValue(item)) {
    options.submitted.current = name;
    request.run(() => onRename?.(item, name), close);
  } else {
    request.reset();
    close();
  }
}

/**
 * Renaming rows in place: F2 on a row the owner lets rename (`canRename`, every row by default)
 * opens a name field holding the text value. Enter and leaving the field report a changed, non-blank
 * name for the row as it is now through `onRename`; Escape abandons it. Enter and Escape return focus
 * to the row. Leaving a draft `onRename` rejected, unchanged, keeps it and its error without
 * submitting it again. A row that becomes disabled, leaves the shown rows or stops taking renames closes its
 * field without renaming, returning focus to the row while it is still shown.
 */
export function useTreeRename<T extends TreeItemData>(
  options: TreeRenameOptions<T>,
): TreeRename<T> | null {
  const { onRename, getTextValue, canRename, items, getChildren, disabledKeys } = options;
  const request = useTreeRenameRequest();
  const [editingKey, setEditingKey] = useState<Key | null>(null);
  const editingRef = useRef<Key | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef<string | null>(null);
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
    request.reset();
    if (input && isFocused(input)) focusNear(input);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- focus leaves the committed field before it unmounts.
    setEditingKey(null);
  }, [isRevoked, request]);
  return useMemo(() => {
    // A field open as `onRename` goes stays one render, so the revocation can move its focus.
    if (!onRename && editingKey === null) return null;
    const finish = (isCommit: boolean, restoreFocus = false) =>
      finishRename({
        key: editingRef.current,
        input: inputRef.current,
        scope,
        request,
        onRename,
        getTextValue,
        close: () => {
          editingRef.current = null;
          setEditingKey(null);
        },
        isCommit,
        restoreFocus,
        submitted: submittedRef,
      });
    return {
      editingKey,
      start(item: T) {
        if (request.pending || !findRenameable(item.id, scope)) return false;
        request.reset();
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
        finish(event.key === 'Enter', true);
      },
      renderEditor: (item: T) => (
        <TreeRenameInput
          name={getTextValue(item)}
          inputRef={inputRef}
          onBlur={() => finish(true)}
          pending={request.pending}
          error={request.error}
        />
      ),
    };
  }, [editingKey, scope, onRename, getTextValue, request]);
}
