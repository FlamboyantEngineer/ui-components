import { useEffect, useState, type RefObject } from 'react';
import type { Key } from 'react-aria-components';
import { collectBranchKeys, type FolderItem, type FolderNode } from './folder-model.js';

export interface FolderSelectionOptions {
  selectedKey?: Key | null | undefined;
  defaultSelectedKey?: Key | null | undefined;
  onSelectionChange?: ((key: Key | null) => void) | undefined;
}

export interface FolderExpansion {
  expandedKeys: Key[];
  onExpandedChange: (keys: Set<Key>) => void;
  /** Expands these rows, so a draft row below them is in view. */
  reveal: (keys: readonly Key[]) => void;
}

function findRow(region: HTMLElement, key: Key): HTMLElement | undefined {
  const rows = region.querySelectorAll<HTMLElement>('[role="row"]');
  return Array.from(rows).find((element) => element.dataset.key === String(key));
}

/** The selected folder (`null`: no folder), controlled or held here. */
export function useFolderSelection({
  selectedKey,
  defaultSelectedKey = null,
  onSelectionChange,
}: FolderSelectionOptions): [Key | null, (key: Key | null) => void] {
  const [own, setOwn] = useState<Key | null>(defaultSelectedKey);
  const selected = selectedKey !== undefined ? selectedKey : own;
  const select = (key: Key | null) => {
    if (key === selected) return;
    setOwn(key);
    onSelectionChange?.(key);
  };
  return [selected, select];
}

/**
 * Every row with children is expanded unless the reader collapsed it, so a folder created deep in
 * the tree is in view as soon as it appears.
 */
export function useFolderExpansion<T extends FolderItem>(
  nodes: readonly FolderNode<T>[],
): FolderExpansion {
  const [collapsed, setCollapsed] = useState<ReadonlySet<Key>>(() => new Set());
  const branchKeys = collectBranchKeys(nodes);
  return {
    expandedKeys: branchKeys.filter((key) => !collapsed.has(key)),
    onExpandedChange: (keys) => setCollapsed(new Set(branchKeys.filter((key) => !keys.has(key)))),
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
