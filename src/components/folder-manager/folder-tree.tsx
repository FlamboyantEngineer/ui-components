import { FolderGlyph } from '../../core/glyphs.js';
import { useCallback, useRef, type KeyboardEvent } from 'react';
import type { Key, Selection } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { TreeMove } from '../../utils/tree-reorder.js';
import { walkTree } from '../../utils/walk-tree.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { ContextMenuTrigger } from '../context-menu/context-menu.js';
import { InlineError } from '../inline-error/inline-error.js';
import { Menu, type MenuEntry } from '../menu/menu.js';
import { TextMatch, TextMatchProvider } from '../text-match/text-match.js';
import { Tree, type TreeProps } from '../tree/tree.js';
import { FolderNameInput, folderManagerHooks as hooks } from './folder-manager-parts.js';
import {
  findFolderPath,
  folderDraftKey,
  folderRootKey,
  getFolderHeight,
  type FolderItem,
  type FolderNode,
} from './folder-model.js';
import type { FolderManagerModel } from './use-folder-manager.js';

interface FolderTreeProps<T extends FolderItem> {
  model: FolderManagerModel<T>;
  folders: readonly T[];
  'aria-label': string | undefined;
  'aria-labelledby': string | undefined;
  rootLabel: string | undefined;
  maxDepth: number | undefined;
  isPending: boolean;
  onMove: ((move: TreeMove) => void) | undefined;
  selectionMode: 'single' | 'multiple';
  virtualized: boolean | undefined;
  rowHeight: number | undefined;
  /** The context menu's entries; none leaves the browser's menu alone. */
  menuEntries: MenuEntry[];
  /** Runs a context menu entry. */
  onMenuAction: (key: Key) => void;
}

/** The selected folder keys a tree selection stands for: never the root or draft rows. */
function toFolderKeys<T extends FolderItem>(keys: Selection, nodes: readonly FolderNode<T>[]) {
  const chosen =
    keys === 'all'
      ? Array.from(
          walkTree(nodes, (node) => node.children),
          (node) => node.id,
        )
      : [...keys];
  return chosen.filter((key) => key !== folderRootKey && key !== folderDraftKey);
}

/**
 * The selection to give the tree: React Aria's own selection object while it holds the selected
 * rows, since it remembers where a Shift range starts, or else the rows.
 */
function useTreeSelection(rows: readonly Key[]) {
  const last = useRef<Selection | null>(null);
  const current = last.current;
  const isSame =
    current !== null &&
    current !== 'all' &&
    current.size === rows.length &&
    rows.every((key) => current.has(key));
  return {
    selectedKeys: isSame ? current : rows,
    remember: (selection: Selection) => {
      last.current = selection;
    },
  };
}

/** The row node under an event target, matched against the rendered rows by key. */
function nodeAt<T extends FolderItem>(target: EventTarget, nodes: readonly FolderNode<T>[]) {
  const row = target instanceof Element ? target.closest('[role="row"]') : null;
  const key = row?.getAttribute('data-key');
  if (key === null || key === undefined) return undefined;
  const original = fromCollectionKey(key);
  for (const node of walkTree(nodes, (node) => node.children)) {
    if (node.id === original) return node;
  }
  return undefined;
}

/** Whether `node` may go among `parent`'s children within the depth limit. */
function canNest<T extends FolderItem>(
  node: FolderNode<T>,
  parent: FolderNode<T> | null,
  { folders, rootLabel, maxDepth }: Pick<FolderTreeProps<T>, 'folders' | 'rootLabel' | 'maxDepth'>,
): boolean {
  if (parent === null) return rootLabel === undefined;
  if (parent.kind === 'draft' || !node.folder) return false;
  if (maxDepth === undefined) return true;
  const depth = parent.kind === 'root' ? 0 : findFolderPath(folders, parent.id).length;
  return depth + getFolderHeight(node.folder) <= maxDepth;
}

/** Reordering, when the owner applies moves: folders move unless the manager is busy. */
function reorderOf<T extends FolderItem>(
  tree: Pick<FolderTreeProps<T>, 'folders' | 'rootLabel' | 'maxDepth' | 'onMove'>,
  isBusy: boolean,
): TreeProps<FolderNode<T>>['reorder'] {
  const { onMove } = tree;
  if (!onMove) return undefined;
  return {
    canMove: (node) => node.kind === 'folder' && !isBusy,
    canMoveInto: (node, parent) => canNest(node, parent, tree),
    onMove,
  };
}

/**
 * The tree's keys. Keys typed in the name field edit the name: Enter submits it, Escape abandons
 * the edit, and no key reaches the tree's own handling. F2 renames a folder and Delete deletes the
 * selected folders.
 */
function useFolderKeys<T extends FolderItem>(model: FolderManagerModel<T>, entries: MenuEntry[]) {
  const { actions, nameRef, isBusy } = model;
  const offers = (id: Key) => entries.some((entry) => entry.id === id);
  return {
    onKeyDownCapture(event: KeyboardEvent<HTMLDivElement>) {
      const input = nameRef.current;
      if (!input || event.target !== input) return;
      event.stopPropagation();
      if (event.key === 'Enter') void actions.submit(input.value);
      else if (event.key === 'Escape') actions.cancel();
      else return;
      event.preventDefault();
    },
    onItemKeyDown(node: FolderNode<T>, event: KeyboardEvent<HTMLElement>) {
      if (node.kind !== 'folder' || isBusy) return false;
      if (event.key === 'F2' && offers('rename')) model.startRename();
      else if (event.key === 'Delete' && offers('delete')) model.remove();
      else return false;
      return true;
    },
  };
}

/** A branch whose subfolders failed to load: the reason and a retry, in the row's meta slot. */
function createLoadErrorRenderer<T extends FolderItem>({ loads }: FolderManagerModel<T>) {
  return (node: FolderNode<T>) => {
    const error = loads.errorOf(node.id);
    if (!error) return null;
    return (
      <InlineError className={hooks.slotClass('load-error')} onRetry={() => loads.load(node.id)}>
        {error}
      </InlineError>
    );
  };
}

/** The folder tree, its rows' name field, the filter highlight and the context menu. */
export function FolderTree<T extends FolderItem>({
  model,
  menuEntries,
  onMenuAction,
  ...tree
}: FolderTreeProps<T>) {
  const strings = useUiStrings();
  const { actions, nameRef, isBusy } = model;
  const { edit, message } = actions;
  const renderLabel = useCallback(
    (node: FolderNode<T>) =>
      edit && node.id === model.editKey ? (
        <FolderNameInput
          edit={edit}
          messageId={message ? model.messageId : undefined}
          inputRef={nameRef}
          onBlur={(name) => void actions.submit(name)}
        />
      ) : (
        <TextMatch>{node.name}</TextMatch>
      ),
    [edit, message, model.editKey, model.messageId, nameRef, actions],
  );
  const keys = useFolderKeys(model, menuEntries);
  const selection = useTreeSelection(model.selectedRows);
  const isMultiple = tree.selectionMode === 'multiple';
  return (
    <ContextMenuTrigger isDisabled={menuEntries.length === 0}>
      <div
        {...hooks.slot('tree')}
        ref={model.regionRef}
        onKeyDownCapture={keys.onKeyDownCapture}
        onContextMenu={(event) => {
          const node = nodeAt(event.target, model.nodes);
          if (!node || node.kind === 'draft' || isBusy) return;
          if (!model.selectedRows.includes(node.id))
            model.select(node.folder ? [node.folder.id] : []);
        }}
      >
        <TextMatchProvider query={model.query}>
          <Tree<FolderNode<T>>
            items={model.nodes}
            aria-label={tree['aria-label']}
            aria-labelledby={tree['aria-labelledby']}
            getTextValue={(node) => node.name}
            getIcon={() => FolderGlyph}
            renderLabel={renderLabel}
            renderMeta={createLoadErrorRenderer(model)}
            hasChildItems={(node) => node.isLazy}
            isItemPending={(node) => model.loads.isLoading(node.id)}
            selectionMode={tree.selectionMode}
            selectionBehavior="replace"
            disallowEmptySelection={!isMultiple}
            selectedKeys={selection.selectedKeys}
            onSelectionChange={(next) => {
              selection.remember(next);
              const chosen = toFolderKeys(next, model.nodes);
              const isDraft = next !== 'all' && next.has(folderDraftKey);
              if (!isDraft && (isMultiple || chosen.length <= 1)) model.select(chosen);
            }}
            expandedKeys={model.expansion.expandedKeys}
            onExpandedChange={model.expansion.onExpandedChange}
            isPending={tree.isPending}
            emptyMessage={model.query.trim() ? strings.noResults : undefined}
            onItemKeyDown={keys.onItemKeyDown}
            reorder={reorderOf(tree, isBusy)}
            virtualized={tree.virtualized}
            rowHeight={tree.rowHeight}
          />
        </TextMatchProvider>
      </div>
      <Menu items={menuEntries} onAction={onMenuAction} />
    </ContextMenuTrigger>
  );
}
