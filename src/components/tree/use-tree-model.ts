'use client';

import { useCallback, useMemo } from 'react';
import type { Key } from '../../core/props.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { readTreeChildren } from '../../utils/tree-reorder.js';
import { walkTree } from '../../utils/walk-tree.js';
import { useTreeItemRenderer } from './tree-item.js';
import type {
  TreeItemData,
  TreeMarks,
  TreeProps,
  TreeSectionData,
  TreeSize,
} from './tree-props.js';
import { useTreeExpansion } from './use-tree-expansion.js';
import { useTreeFilter } from './use-tree-filter.js';
import { useTreeKeyDown } from './use-tree-key-down.js';
import { useTreeLoads } from './use-tree-loads.js';
import { useTreeRename } from './use-tree-rename.js';
import { useTreeReorder } from './use-tree-reorder.js';
import { useTreeSelection } from './use-tree-selection.js';

const virtualRowHeights: Readonly<Record<TreeSize, number>> = { sm: 28, md: 32, lg: 40 };

/** Whether a mark is a glyph that every row reserves a place for. */
const isGlyphMark = (mark: string) => mark === 'dot' || mark === 'caret';

/** The marks the tree publishes, defaults filled. */
function toMarkData({ current = 'tint', selected = 'tint', new: fresh = 'dot' }: TreeMarks = {}) {
  return { currentMark: current, selectedMark: selected, newMark: fresh };
}

/** Whether every row reserves the place of a dot or caret marking the current or selected row. */
function hasStateGlyph(marks: TreeMarks | undefined): boolean {
  const { currentMark, selectedMark } = toMarkData(marks);
  return isGlyphMark(currentMark) || isGlyphMark(selectedMark);
}

/** Separates the props that draw rows, the expansion, the root's own and React Aria's. */
function splitTreeProps<T extends TreeItemData>({
  items,
  getTextValue,
  getChildren = readTreeChildren,
  getSection,
  hasChildItems,
  isItemPending,
  getHref,
  currentKey,
  isItemNew,
  marks,
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
    isItemNew,
    hasStateMark: hasStateGlyph(marks),
    getIcon,
    renderLabel,
    renderMeta,
    renderActions,
    expandGlyph,
  };
  const expansion = { expandedKeys, defaultExpandedKeys, onExpandedChange, persistKey };
  const state = { items, isPending, emptyMessage, reorder, onItemKeyDown, disabledKeys };
  const selection = { selectionPropagation, selectedKeys, defaultSelectedKeys, onSelectionChange };
  const features = { checkboxSelection, selection, filterText, filter, onLoadChildren, getSection };
  const data = {
    size,
    variant,
    expandGlyph,
    ...toMarkData(marks),
    wrap,
    pending: isPending,
    virtualized,
    reordering: reorder !== undefined && !getSection,
    sectioned: getSection !== undefined,
  };
  const height = virtualized ? (rowHeight ?? virtualRowHeights[size]) : null;
  const root = { className, ref, data, rowHeight: height };
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

/** A section of the tree as it draws it: its heading and its top-level items, in order. */
export interface TreeShownSection<T> {
  /** The collection key of the section, apart from every item key. */
  id: string;
  section: TreeSectionData;
  items: readonly T[];
}

/** The top-level rows without a section, then each section with its rows in first-item order. */
function groupSections<T extends TreeItemData>(
  items: readonly T[],
  getSection: (item: T) => TreeSectionData | undefined,
): { loose: T[]; sections: TreeShownSection<T>[] } {
  const loose: T[] = [];
  const sections = new Map<string, { section: TreeSectionData; items: T[] }>();
  for (const item of items) {
    const section = getSection(item);
    if (!section) {
      loose.push(item);
      continue;
    }
    // Item keys are URI-encoded, which never holds a colon.
    const id = `section:${toCollectionKey(section.id)}`;
    const group = sections.get(id) ?? { section, items: [] };
    group.items.push(item);
    sections.set(id, group);
  }
  return { loose, sections: [...sections].map(([id, group]) => ({ id, ...group })) };
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
  // A sectioned tree does not reorder (UIC-TREE-8.1).
  const reorder = features.getSection ? undefined : state.reorder;
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
  const { reordering, dragAndDrop } = useTreeReorder({
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
  const { getSection } = features;
  const shown = useMemo(
    () => (getSection ? groupSections(items, getSection) : null),
    [items, getSection],
  );
  const dependencies = useMemo(() => [renderItem], [renderItem]);
  return {
    ...parts,
    state: { ...state, disabledKeys },
    items,
    shown,
    expansion,
    selection,
    reordering,
    dragAndDrop,
    keys,
    renderItem,
    dependencies,
  };
}
