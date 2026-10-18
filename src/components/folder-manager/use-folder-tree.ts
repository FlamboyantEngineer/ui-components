import { useEffect, useState, type RefObject } from 'react';
import type { Key } from '../../core/props.js';
import {
  collectBranchKeys,
  findFolderNode,
  type FolderItem,
  type FolderNode,
} from './folder-model.js';

export interface FolderSelectionOptions {
  /** `single` (the default) selects one folder; `multiple` lets the reader select several. */
  selectionMode?: 'single' | 'multiple' | undefined;
  /** The selected folder (`null`: none), controlled, in single selection. */
  selectedKey?: Key | null | undefined;
  defaultSelectedKey?: Key | null | undefined;
  onSelectionChange?: ((key: Key | null) => void) | undefined;
  /** The selected folders, controlled, in multiple selection. */
  selectedKeys?: Iterable<Key> | undefined;
  defaultSelectedKeys?: Iterable<Key> | undefined;
  onSelectedKeysChange?: ((keys: Key[]) => void) | undefined;
}

export interface FolderExpansion {
  expandedKeys: Key[];
  onExpandedChange: (keys: Set<Key>) => void;
  /** Expands these rows, so a row below them is in view. */
  reveal: (keys: readonly Key[]) => void;
}

function findRow(region: HTMLElement, key: Key): HTMLElement | undefined {
  const rows = region.querySelectorAll<HTMLElement>('[role="row"]');
  return Array.from(rows).find((element) => element.dataset.key === String(key));
}

function isSameList(a: readonly Key[], b: readonly Key[]): boolean {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

function controlledKeys(options: FolderSelectionOptions): Key[] | undefined {
  if (options.selectionMode === 'multiple') {
    return options.selectedKeys === undefined ? undefined : [...options.selectedKeys];
  }
  if (options.selectedKey === undefined) return undefined;
  return options.selectedKey === null ? [] : [options.selectedKey];
}

function initialKeys(options: FolderSelectionOptions): Key[] {
  if (options.selectionMode === 'multiple') return [...(options.defaultSelectedKeys ?? [])];
  return options.defaultSelectedKey == null ? [] : [options.defaultSelectedKey];
}

/** The selected folders, in single or multiple selection, controlled or held here. */
export function useFolderSelection(
  options: FolderSelectionOptions,
): [Key[], (keys: Key[]) => void] {
  const [own, setOwn] = useState<Key[]>(() => initialKeys(options));
  const selected = controlledKeys(options) ?? own;
  const select = (keys: Key[]) => {
    if (isSameList(keys, selected)) return;
    setOwn(keys);
    if (options.selectionMode === 'multiple') options.onSelectedKeysChange?.(keys);
    else options.onSelectionChange?.(keys[0] ?? null);
  };
  return [selected, select];
}

/**
 * Every row with children is expanded unless the reader collapsed it, so a folder created deep in
 * the tree is in view as soon as it appears. A folder whose subfolders are not loaded yet starts
 * collapsed; expanding it calls `onOpen`, which loads them.
 */
export function useFolderExpansion<T extends FolderItem>(
  nodes: readonly FolderNode<T>[],
  onOpen: (key: Key) => void,
): FolderExpansion {
  const [collapsed, setCollapsed] = useState<ReadonlySet<Key>>(() => new Set());
  const [opened, setOpened] = useState<ReadonlySet<Key>>(() => new Set());
  const branchKeys = collectBranchKeys(nodes);
  const isLazy = (key: Key) => findFolderNode(nodes, key)?.isLazy ?? false;
  return {
    expandedKeys: [
      ...branchKeys.filter((key) => !collapsed.has(key)),
      ...[...opened].filter((key) => isLazy(key)),
    ],
    onExpandedChange: (keys) => {
      const lazy = [...keys].filter(isLazy);
      for (const key of lazy) if (!opened.has(key)) onOpen(key);
      setOpened(new Set(lazy));
      setCollapsed(new Set(branchKeys.filter((key) => !keys.has(key))));
    },
    reveal: (keys) =>
      setCollapsed((current) => new Set([...current].filter((key) => !keys.includes(key)))),
  };
}

/**
 * Moves focus to the row of `request.key` once that row is rendered: after an edit or a delete,
 * the field or row that held focus is gone. The tree renders new rows after its owner, and the
 * owner may update its folders later still, so the request waits for the row to appear.
 */
export function useRowFocus(
  regionRef: RefObject<HTMLElement | null>,
  request: { key: Key } | null,
  done: () => void,
) {
  useEffect(() => {
    const region = regionRef.current;
    if (!request || !region) return undefined;
    const focusRow = () => {
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
    observer.observe(region, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [regionRef, request, done]);
}
