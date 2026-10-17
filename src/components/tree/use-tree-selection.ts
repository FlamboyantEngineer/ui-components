// Selection that cascades through a tree: a row's selection reaches its loaded descendants, and a
// row follows its children, all selected or not.

import { useCallback, useMemo, useState } from 'react';
import type { Key, Selection } from 'react-aria-components';
import type { TreeItemData, TreeProps } from './tree.js';

export interface TreeSelectionOptions<T extends TreeItemData> extends Pick<
  TreeProps<T>,
  'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange' | 'selectionPropagation'
> {
  items: readonly T[];
  getChildren: (item: T) => readonly T[] | undefined;
  disabledKeys: Iterable<Key> | undefined;
}

/** The selection props to hand React Aria's tree, and the rows holding a partial selection. */
export interface TreeSelection {
  props: Pick<
    TreeProps<TreeItemData>,
    'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange'
  >;
  /** Whether a row is not selected while some of its descendants are. */
  isIndeterminate: (key: Key) => boolean;
}

interface Cascade<T> {
  getChildren: (item: T) => readonly T[] | undefined;
  disabled: ReadonlySet<Key>;
}

const noKeys: ReadonlySet<Key> = new Set();

function collectKeys<T extends TreeItemData>(items: readonly T[], cascade: Cascade<T>): Key[] {
  return items.flatMap((item) =>
    cascade.disabled.has(item.id)
      ? []
      : [item.id, ...collectKeys(cascade.getChildren(item) ?? [], cascade)],
  );
}

function toKeySet<T extends TreeItemData>(
  selection: Selection,
  { items, cascade }: { items: readonly T[]; cascade: Cascade<T> },
): ReadonlySet<Key> {
  return selection === 'all' ? new Set(collectKeys(items, cascade)) : selection;
}

/** Selects or deselects the descendants of rows whose own selection changed. */
function pushDown<T extends TreeItemData>(
  items: readonly T[],
  context: { previous: ReadonlySet<Key>; result: Set<Key>; cascade: Cascade<T> },
): void {
  const { previous, result, cascade } = context;
  for (const item of items) {
    const children = cascade.getChildren(item) ?? [];
    const isSelected = result.has(item.id);
    if (isSelected === previous.has(item.id)) {
      pushDown(children, context);
      continue;
    }
    for (const key of collectKeys(children, cascade)) {
      if (isSelected) result.add(key);
      else result.delete(key);
    }
  }
}

/** Selects each row whose enabled children are all selected, and deselects the others. */
function pullUp<T extends TreeItemData>(item: T, result: Set<Key>, cascade: Cascade<T>): void {
  const children = (cascade.getChildren(item) ?? []).filter(
    (child) => !cascade.disabled.has(child.id),
  );
  for (const child of children) pullUp(child, result, cascade);
  if (children.length === 0 || cascade.disabled.has(item.id)) return;
  if (children.every((child) => result.has(child.id))) result.add(item.id);
  else result.delete(item.id);
}

/** Rows that are not selected while a descendant is. */
function findIndeterminate<T extends TreeItemData>(
  items: readonly T[],
  { selected, cascade }: { selected: ReadonlySet<Key>; cascade: Cascade<T> },
): ReadonlySet<Key> {
  const found = new Set<Key>();
  const visit = (item: T): boolean => {
    const below = (cascade.getChildren(item) ?? []).map(visit).some(Boolean);
    if (below && !selected.has(item.id)) found.add(item.id);
    return below || selected.has(item.id);
  };
  items.forEach(visit);
  return found;
}

/**
 * React Aria's selection, passed through, or with `selectionPropagation` held by the tree (unless
 * controlled) and cascaded: a row whose selection changes takes its loaded, enabled descendants
 * along, and then each branch is selected exactly when all its enabled children are.
 */
export function useTreeSelection<T extends TreeItemData>(
  options: TreeSelectionOptions<T>,
): TreeSelection {
  const { items, getChildren, disabledKeys, selectionPropagation = false } = options;
  const { selectedKeys, defaultSelectedKeys, onSelectionChange } = options;
  const [own, setOwn] = useState<Selection>(() =>
    defaultSelectedKeys === 'all' ? 'all' : new Set(defaultSelectedKeys ?? []),
  );
  const cascade = useMemo(
    () => ({ getChildren, disabled: new Set<Key>(disabledKeys ?? []) }),
    [getChildren, disabledKeys],
  );
  const current = selectedKeys === undefined ? own : selectedKeys;
  const selected = useMemo(
    () =>
      selectionPropagation
        ? toKeySet(current === 'all' ? 'all' : new Set(current), { items, cascade })
        : noKeys,
    [selectionPropagation, current, items, cascade],
  );
  const indeterminate = useMemo(
    () => (selectionPropagation ? findIndeterminate(items, { selected, cascade }) : noKeys),
    [selectionPropagation, items, selected, cascade],
  );
  const isIndeterminate = useCallback((key: Key) => indeterminate.has(key), [indeterminate]);
  if (!selectionPropagation) {
    return { props: { selectedKeys, defaultSelectedKeys, onSelectionChange }, isIndeterminate };
  }
  return {
    props: {
      selectedKeys: selected,
      onSelectionChange(next) {
        const result = new Set(toKeySet(next, { items, cascade }));
        pushDown(items, { previous: selected, result, cascade });
        for (const item of items) pullUp(item, result, cascade);
        if (selectedKeys === undefined) setOwn(result);
        onSelectionChange?.(result);
      },
    },
    isIndeterminate,
  };
}
