import { useCallback, type KeyboardEvent } from 'react';
import type { Key, Selection } from 'react-aria-components';
import type { TreeMove } from '../../utils/tree-reorder.js';
import { ContextMenuTrigger } from '../context-menu/context-menu.js';
import { Menu, type MenuEntry } from '../menu/menu.js';
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

export interface FolderTreeProps<T extends FolderItem> {
  model: FolderManagerModel<T>;
  folders: readonly T[];
  'aria-label': string | undefined;
  'aria-labelledby': string | undefined;
  rootLabel: string | undefined;
  maxDepth: number | undefined;
  isPending: boolean;
  onMove: ((move: TreeMove) => void) | undefined;
  /** The context menu's Rename and Delete entries; none leaves the browser's menu alone. */
  menuEntries: MenuEntry[];
}

function firstKey(keys: Selection): Key | null {
  if (keys === 'all') return null;
  const [key] = keys;
  return key ?? null;
}

/** The row node under an event target, matched against the rendered rows by key. */
function nodeAt<T extends FolderItem>(target: EventTarget, nodes: readonly FolderNode<T>[]) {
  const row = target instanceof Element ? target.closest('[role="row"]') : null;
  const key = row?.getAttribute('data-key');
  const visit = (level: readonly FolderNode<T>[]): FolderNode<T> | undefined => {
    for (const node of level) {
      if (String(node.id) === key) return node;
      const found = node.children ? visit(node.children) : undefined;
      if (found) return found;
    }
    return undefined;
  };
  return key === null || key === undefined ? undefined : visit(nodes);
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
  tree: Omit<FolderTreeProps<T>, 'model' | 'menuEntries'>,
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
 * the edit, and no key reaches the tree's own handling. F2 renames a folder and Delete deletes it.
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

/** The folder tree, its rows' name field and its context menu of Rename and Delete. */
export function FolderTree<T extends FolderItem>({
  model,
  menuEntries,
  ...tree
}: FolderTreeProps<T>) {
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
        node.name
      ),
    [edit, message, model.editKey, model.messageId, nameRef, actions],
  );
  const keys = useFolderKeys(model, menuEntries);
  return (
    <ContextMenuTrigger isDisabled={menuEntries.length === 0}>
      <div
        {...hooks.slot('tree')}
        ref={model.regionRef}
        onKeyDownCapture={keys.onKeyDownCapture}
        onContextMenu={(event) => {
          const node = nodeAt(event.target, model.nodes);
          if (node && node.kind !== 'draft' && !isBusy) model.select(node.folder?.id ?? null);
        }}
      >
        <Tree<FolderNode<T>>
          items={model.nodes}
          aria-label={tree['aria-label']}
          aria-labelledby={tree['aria-labelledby']}
          getTextValue={(node) => node.name}
          getIcon={() => 'folder'}
          renderLabel={renderLabel}
          selectionMode="single"
          selectionBehavior="replace"
          disallowEmptySelection
          selectedKeys={model.selectedRow === null ? [] : [model.selectedRow]}
          onSelectionChange={(keys) => {
            const key = firstKey(keys);
            if (key === null || key === folderDraftKey) return;
            model.select(key === folderRootKey ? null : key);
          }}
          expandedKeys={model.expansion.expandedKeys}
          onExpandedChange={model.expansion.onExpandedChange}
          isPending={tree.isPending}
          onItemKeyDown={keys.onItemKeyDown}
          reorder={reorderOf(tree, isBusy)}
        />
      </div>
      <Menu
        items={menuEntries}
        onAction={(key) => (key === 'rename' ? model.startRename() : model.remove())}
      />
    </ContextMenuTrigger>
  );
}
