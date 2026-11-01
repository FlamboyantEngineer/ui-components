'use client';

import { useEffect, useState, type RefObject } from 'react';
import type { Key } from '../../core/props.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { isNode } from '../../utils/is-element.js';
import { walkTree } from '../../utils/walk-tree.js';
import { fromFolderRowKey, type FolderItem, type FolderNode } from './folder-model.js';

/** `single` selects one folder; `multiple` lets the reader select several. */
export type FolderSelectionMode = 'single' | 'multiple';

/**
 * What `onSelectionChange` receives: the set of selected folders in multiple selection, as React
 * Aria reports it, else the selected folder (`null`: none).
 */
export type FolderSelectionHandler<M extends FolderSelectionMode> = [M] extends ['multiple']
  ? (keys: Set<Key>) => void
  : (key: Key | null) => void;

export interface FolderSelectionOptions<M extends FolderSelectionMode = FolderSelectionMode> {
  /** `single` (the default) selects one folder; `multiple` lets the reader select several. */
  selectionMode?: M | undefined;
  /** The selected folder (`null`: none), controlled, in single selection. */
  selectedKey?: Key | null | undefined;
  defaultSelectedKey?: Key | null | undefined;
  /** Called with the selection after each change: the folder, or the set of folders when multiple. */
  onSelectionChange?: FolderSelectionHandler<M> | undefined;
  /** The selected folders, controlled, in multiple selection. */
  selectedKeys?: Iterable<Key> | undefined;
  defaultSelectedKeys?: Iterable<Key> | undefined;
}

export interface FolderExpansion {
  expandedKeys: Key[];
  onExpandedChange: (keys: Set<Key>) => void;
  /** Expands these rows, so a row below them is in view. */
  reveal: (keys: readonly Key[]) => void;
}

function findRow(region: HTMLElement, key: Key): HTMLElement | undefined {
  const rows = region.querySelectorAll<HTMLElement>('[role="row"]');
  return Array.from(rows).find((element) => element.dataset.key === toCollectionKey(key));
}

function isSameList(a: readonly Key[], b: readonly Key[]): boolean {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

function controlledKeys<M extends FolderSelectionMode>(
  options: FolderSelectionOptions<M>,
): Key[] | undefined {
  if (options.selectionMode === 'multiple') {
    return options.selectedKeys === undefined ? undefined : [...options.selectedKeys];
  }
  if (options.selectedKey === undefined) return undefined;
  return options.selectedKey === null ? [] : [options.selectedKey];
}

function initialKeys<M extends FolderSelectionMode>(options: FolderSelectionOptions<M>): Key[] {
  if (options.selectionMode === 'multiple') return [...(options.defaultSelectedKeys ?? [])];
  return options.defaultSelectedKey == null ? [] : [options.defaultSelectedKey];
}

/** Reports a new selection in the shape of the selection mode. */
function reportSelection(options: FolderSelectionOptions, keys: Key[]) {
  // The handler's shape follows `selectionMode`, which the caller's type already matched.
  const onSelectionChange = options.onSelectionChange as
    | ((selection: Key | null | Set<Key>) => void)
    | undefined;
  if (options.selectionMode !== 'multiple') {
    onSelectionChange?.(keys[0] ?? null);
    return;
  }
  onSelectionChange?.(new Set(keys));
}

/** The selected folders, in single or multiple selection, controlled or held here. */
export function useFolderSelection<M extends FolderSelectionMode>(
  options: FolderSelectionOptions<M>,
): [Key[], (keys: Key[]) => void] {
  const [own, setOwn] = useState<Key[]>(() => initialKeys(options));
  const selected = controlledKeys(options) ?? own;
  const select = (keys: Key[]) => {
    if (isSameList(keys, selected)) return;
    setOwn(keys);
    reportSelection(options as FolderSelectionOptions, keys);
  };
  return [selected, select];
}

/**
 * Every row with children is expanded unless the reader collapsed it, so a folder created deep in
 * the tree is in view as soon as it appears. A folder whose subfolders are not loaded yet starts
 * collapsed; expanding it calls `onOpen` with its folder key, which loads them. Expansion is kept
 * by row key.
 */
export function useFolderExpansion<T extends FolderItem>(
  nodes: readonly FolderNode<T>[],
  onOpen: (key: Key) => void,
): FolderExpansion {
  const [collapsed, setCollapsed] = useState<ReadonlySet<Key>>(() => new Set());
  const [opened, setOpened] = useState<ReadonlySet<Key>>(() => new Set());
  const branchKeys: Key[] = [];
  const lazyKeys = new Set<Key>();
  for (const node of walkTree(nodes, (node) => node.children)) {
    if (node.children) branchKeys.push(node.id);
    if (node.isLazy) lazyKeys.add(node.id);
  }
  const isLazy = (key: Key) => lazyKeys.has(key);
  return {
    expandedKeys: [
      ...branchKeys.filter((key) => !collapsed.has(key)),
      ...[...opened].filter((key) => isLazy(key)),
    ],
    onExpandedChange: (keys) => {
      const lazy = [...keys].filter(isLazy);
      for (const key of lazy) {
        const folderKey = fromFolderRowKey(key);
        if (!opened.has(key) && folderKey !== null) onOpen(folderKey);
      }
      setOpened(new Set(lazy));
      setCollapsed(new Set(branchKeys.filter((key) => !keys.has(key))));
    },
    reveal: (keys) => {
      const revealed = new Set(keys);
      setCollapsed((current) => new Set([...current].filter((key) => !revealed.has(key))));
    },
  };
}

/**
 * Moves focus to the row of `request.key` once that row is rendered: after an edit or a delete,
 * the field or row that held focus is gone. The tree renders new rows after its owner, and the
 * owner may update its folders later still, so the request waits for the row to appear. It only
 * recovers focus the manager still owns: focus inside `rootRef`, or fallen to the page with the
 * gone field. Focus the reader moved elsewhere ends the request, as does a newer one.
 */
export function useRowFocus(
  {
    rootRef,
    regionRef,
  }: { rootRef: RefObject<HTMLElement | null>; regionRef: RefObject<HTMLElement | null> },
  request: { key: Key } | null,
  done: () => void,
) {
  useEffect(() => {
    const root = rootRef.current;
    const region = regionRef.current;
    if (!request || !root || !region) return undefined;
    const owner = root.ownerDocument;
    const isOwned = () => {
      const active = owner.activeElement;
      return active === null || active === owner.body || root.contains(active);
    };
    const focusRow = () => {
      if (!isOwned()) {
        done();
        return true;
      }
      const row = findRow(region, request.key);
      if (row) {
        row.focus();
        done();
      }
      return Boolean(row);
    };
    if (focusRow()) return undefined;
    const observer = new MutationObserver(() => {
      if (focusRow()) observer.disconnect();
    });
    // Focus the reader moves out of the manager while the row is awaited ends the request.
    const onFocusIn = (event: FocusEvent) => {
      if (isNode(event.target) && root.contains(event.target)) return;
      observer.disconnect();
      done();
    };
    observer.observe(region, { childList: true, subtree: true });
    owner.addEventListener('focusin', onFocusIn);
    return () => {
      observer.disconnect();
      owner.removeEventListener('focusin', onFocusIn);
    };
  }, [rootRef, regionRef, request, done]);
}
