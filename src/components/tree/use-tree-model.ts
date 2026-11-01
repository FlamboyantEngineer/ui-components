'use client';

import { useCallback, useMemo } from 'react';
import type { Key } from '../../core/props.js';
import { readTreeChildren } from '../../utils/tree-reorder.js';
import { walkTree } from '../../utils/walk-tree.js';
import { useTreeItemRenderer } from './tree-item.js';
import type { TreeItemData, TreeProps, TreeSize } from './tree-props.js';
import { useTreeExpansion } from './use-tree-expansion.js';
import { useTreeFilter } from './use-tree-filter.js';
import { useTreeKeyDown } from './use-tree-key-down.js';
import { useTreeLoads } from './use-tree-loads.js';
import { useTreeRename } from './use-tree-rename.js';
import { useTreeReorder } from './use-tree-reorder.js';
import { useTreeSelection } from './use-tree-selection.js';

const virtualRowHeights: Readonly<Record<TreeSize, number>> = { sm: 28, md: 32, lg: 40 };

/** Separates the props that draw rows, the expansion, the root's own and React Aria's. */
function splitTreeProps<T extends TreeItemData>({
  items,
  getTextValue,
  getChildren = readTreeChildren,
  hasChildItems,
  isItemPending,
  getHref,
  currentKey,
  getIcon,
  renderLabel,
  renderMeta,
  renderActions,
  expandGlyph = 'chevron',
  expandedKeys,
  defaultExpandedKeys,
  onExpandedChange,
  persistKey,
  isPending = false,
  emptyMessage,
  size = 'sm',
  variant = 'default',
  wrap = false,
  reorder,
  onItemKeyDown,
  virtualized = false,
  rowHeight,
  className,
  ref,
  disabledKeys,
  checkboxSelection,
  selectionPropagation,
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  filterText,
  filter,
  onLoadChildren,
  onRename,
  canRename,
  ...aria
}: TreeProps<T>) {
  const row = {
    getTextValue,
    getChildren,
    hasChildItems,
    isItemPending,
    getHref,
    currentKey,
    getIcon,
    renderLabel,
    renderMeta,
    renderActions,
    expandGlyph,
  };
  const expansion = { expandedKeys, defaultExpandedKeys, onExpandedChange, persistKey };
  const state = { items, isPending, emptyMessage, reorder, onItemKeyDown, disabledKeys };
  const selection = { selectionPropagation, selectedKeys, defaultSelectedKeys, onSelectionChange };
  const features = { checkboxSelection, selection, filterText, filter, onLoadChildren };
  const data = { size, variant, expandGlyph, wrap, pending: isPending, virtualized };
  const root = {
    className,
    ref,
    data,
    rowHeight: virtualized ? (rowHeight ?? virtualRowHeights[size]) : null,
  };
  return { row, expansion, state, features, rename: { onRename, canRename }, root, aria };
}

function findTreeItem<T extends TreeItemData>(
  items: readonly T[],
  { key, getChildren }: { key: Key; getChildren: (item: T) => readonly T[] | undefined },
): T | undefined {
  for (const item of walkTree(items, getChildren)) {
    if (item.id === key) return item;
  }
  return undefined;
}

/** Loading children through `onLoadChildren`, while the owner sets it. */
function useOwnerLoads<T extends TreeItemData>(
  items: readonly T[],
  {
    getChildren,
    onLoadChildren,
  }: Pick<TreeProps<T>, 'onLoadChildren'> & {
    getChildren: (item: T) => readonly T[] | undefined;
  },
) {
  const isListed = useCallback(
    (key: Key) => findTreeItem(items, { key, getChildren }) !== undefined,
    [items, getChildren],
  );
  const loads = useTreeLoads(
    onLoadChildren &&
      ((key) => {
        const item = findTreeItem(items, { key, getChildren });
        return item ? onLoadChildren(item) : undefined;
      }),
    isListed,
  );
  return onLoadChildren ? loads : null;
}

/** Everything the tree draws from its props: the rows shown, their selection and their keys. */
export function useTreeModel<T extends TreeItemData>(props: TreeProps<T>) {
  const { row, expansion: expansionOptions, state, features, ...parts } = splitTreeProps(props);
  const { getTextValue, getChildren: getAllChildren } = row;
  const { items, getChildren, expansion } = useTreeFilter({
    items: state.items,
    getChildren: getAllChildren,
    getTextValue,
    filterText: features.filterText,
    filter: features.filter,
    expansion: useTreeExpansion(expansionOptions),
  });
  const { reorder } = state;
  const disabledKeys = useMemo(
    () => (state.disabledKeys ? new Set(state.disabledKeys) : undefined),
    [state.disabledKeys],
  );
  const defaultSelectedKeys = useMemo(
    () =>
      features.selection.defaultSelectedKeys === 'all'
        ? ('all' as const)
        : features.selection.defaultSelectedKeys && new Set(features.selection.defaultSelectedKeys),
    [features.selection.defaultSelectedKeys],
  );
  const selection = useTreeSelection({
    ...features.selection,
    selectionMode: parts.aria.selectionMode,
    defaultSelectedKeys,
    items: state.items,
    getChildren: getAllChildren,
    disabledKeys,
  });
  const loads = useOwnerLoads(state.items, { getChildren: getAllChildren, ...features });
  const rename = useTreeRename({ ...parts.rename, getTextValue, items, getChildren, disabledKeys });
  const reordering = useTreeReorder({
    items,
    reorder,
    disabledKeys,
    expansion,
    getChildren,
    getTextValue,
  });
  const keys = useTreeKeyDown({ onItemKeyDown: state.onItemKeyDown, reordering, rename });
  const renderItem = useTreeItemRenderer({
    ...row,
    getChildren,
    reordering,
    registerRow: keys.registerRow,
    checkboxSelection: features.checkboxSelection ?? false,
    isIndeterminate: selection.isIndeterminate,
    rename,
    loads,
  });
  const dependencies = useMemo(() => [renderItem], [renderItem]);
  return {
    ...parts,
    state: { ...state, disabledKeys },
    items,
    expansion,
    selection,
    reordering,
    keys,
    renderItem,
    dependencies,
  };
}
