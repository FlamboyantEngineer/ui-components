'use client';

import { useMemo, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import {
  Tree as AriaTree,
  ListLayout,
  useDragAndDrop,
  Virtualizer,
} from '../../primitives/index.js';
import type {
  AriaLabellingProps,
  CollectionSelectionProps,
  ExpansionProps,
} from '../../core/events.js';
import type { BaseProps, Key, Size } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { readTreeChildren, type TreeMoveItem } from '../../utils/tree-reorder.js';
import { walkTree } from '../../utils/walk-tree.js';
import type { IconSource } from '../icon/icon.js';
import { TextMatchProvider } from '../text-match/text-match.js';
import { TreeEmptyState, useTreeItemRenderer } from './tree-item.js';
import { createTreeAriaKeys } from './tree-aria-keys.js';
import { treeHooks as hooks } from './tree-hooks.js';
import { useTreeExpansion } from './use-tree-expansion.js';
import { useTreeFilter } from './use-tree-filter.js';
import { useTreeKeyDown } from './use-tree-key-down.js';
import { useTreeLoads } from './use-tree-loads.js';
import { useTreeRename } from './use-tree-rename.js';
import { useTreeReorder, type TreeReorderOptions } from './use-tree-reorder.js';
import { useTreeSelection } from './use-tree-selection.js';

/** The minimal shape of a tree item: a key unique in the tree, and optional children. */
export type TreeItemData = TreeMoveItem<unknown>;

/** A row's state, passed to the render callbacks. */
export interface TreeItemState {
  /** Whether the row's children are shown. */
  isExpanded: boolean;
  /** Whether the row has children, loaded or not. */
  hasChildItems: boolean;
  /** The row's depth, from 1. */
  level: number;
  isSelected: boolean;
  isDisabled: boolean;
  /** Whether the row has keyboard focus. */
  isFocusVisible: boolean;
  /** Whether the row is the current page or item. */
  isCurrent: boolean;
}

/** `chevron` draws chevron-right and chevron-down; `plus-minus` draws plus and minus. */
export type TreeExpandGlyph = 'chevron' | 'plus-minus';
export type TreeSize = Extract<Size, 'sm' | 'md' | 'lg'>;
/** `picker` is a tree the reader chooses one row from; the stylesheet greys out rows that cannot be chosen. */
export type TreeVariant = 'default' | 'picker';

export interface TreeProps<T extends TreeItemData>
  extends BaseProps, AriaLabellingProps, CollectionSelectionProps, ExpansionProps {
  /** Top-level items. Each item's `id` must be unique in the whole tree. */
  items: readonly T[];
  /** Called with the key of the row the reader activates. */
  onAction?: ((key: Key) => void) | undefined;
  /** Plain text for an item: its accessible name and the text typeahead matches. */
  getTextValue: (item: T) => string;
  /** Children of an item. Defaults to its `children` property. */
  getChildren?: ((item: T) => readonly T[] | undefined) | undefined;
  /** Whether an item without loaded children has some, so it can be expanded to load them. */
  hasChildItems?: ((item: T) => boolean) | undefined;
  /** Whether an expanded item's children are loading: a loading row shows below it. */
  isItemPending?: ((item: T) => boolean) | undefined;
  /**
   * Loads the children of an expanded item that has some but none loaded, once its loading row is
   * in view. While a returned promise is pending the row shows as loading; a rejection shows its
   * message with a retry in the row.
   */
  onLoadChildren?: ((item: T) => unknown) | undefined;
  /** Makes the row itself a link. Navigation goes through the provider's `navigate` when set. */
  getHref?: ((item: T) => string | undefined) | undefined;
  /** The row that is the current page or item: `aria-current` and `data-current`. */
  currentKey?: Key | null | undefined;
  /** An imported icon component or rendered element before the label. */
  getIcon?: ((item: T, state: TreeItemState) => IconSource) | undefined;
  /** The label. Defaults to the text value. */
  renderLabel?: ((item: T, state: TreeItemState) => ReactNode) | undefined;
  /** Secondary text after the label. */
  renderMeta?: ((item: T, state: TreeItemState) => ReactNode) | undefined;
  /** Trailing controls, such as icon buttons, in the row's actions slot. */
  renderActions?: ((item: T, state: TreeItemState) => ReactNode) | undefined;
  /** Persists the uncontrolled expansion through the provider's storage under this key. */
  persistKey?: string | undefined;
  /** Items are loading: publishes `aria-busy`, and an empty tree shows a loading notice. */
  isPending?: boolean | undefined;
  /** The notice an empty tree shows when it is not loading. Without it the tree shows nothing. */
  emptyMessage?: ReactNode;
  /** The expand button's glyphs. Defaults to `chevron`. */
  expandGlyph?: TreeExpandGlyph | undefined;
  /** Row size. Defaults to `sm`. */
  size?: TreeSize | undefined;
  /** Navigation tree or picker. Defaults to `default`. */
  variant?: TreeVariant | undefined;
  /** Let labels wrap instead of keeping them on one line. */
  wrap?: boolean | undefined;
  /** Opt-in reordering by drag and drop and Alt+Arrow keys. Turning it on or off remounts the rows. */
  reorder?: TreeReorderOptions<T> | undefined;
  /** Renders only the rows in view; the stylesheet must bound the tree's height. */
  virtualized?: boolean | undefined;
  /** Row height in pixels for a virtualized tree. Defaults to 28, 32 or 40 by size. */
  rowHeight?: number | undefined;
  /** Draws a selection checkbox in each row while the tree selects. */
  checkboxSelection?: boolean | undefined;
  /**
   * With multiple selection, a row's selection reaches its loaded descendants and a branch is
   * selected exactly when all its children are; a branch with only some selected is indeterminate.
   */
  selectionPropagation?: boolean | undefined;
  /** Shows the rows whose text value matches, with their ancestors and descendants. */
  filterText?: string | undefined;
  /** Whether a text value matches `filterText`. Defaults to holding each of its terms. */
  filter?: ((textValue: string, filterText: string) => boolean) | undefined;
  /** Renames a row from the name field that F2 opens in it. */
  onRename?: ((item: T, name: string) => void) | undefined;
  /** Whether F2 may rename a row. Defaults to every row. */
  canRename?: ((item: T) => boolean) | undefined;
  /** Sees each keydown in a row before the tree does; return `true` to claim the key. */
  onItemKeyDown?: ((item: T, event: KeyboardEvent<HTMLElement>) => boolean) | undefined;
  /** The tree grid element. */
  ref?: Ref<HTMLDivElement> | undefined;
}

const virtualRowHeights: Readonly<Record<TreeSize, number>> = { sm: 28, md: 32, lg: 40 };

/** The drag and drop options of a tree that does not reorder: neither draggable nor droppable. */
const noDragAndDrop = {};

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
  const loads = useTreeLoads(
    onLoadChildren &&
      ((key) => {
        const item = findTreeItem(items, { key, getChildren });
        return item ? onLoadChildren(item) : undefined;
      }),
  );
  return onLoadChildren ? loads : null;
}

/** Everything the tree draws from its props: the rows shown, their selection and their keys. */
function useTreeModel<T extends TreeItemData>(props: TreeProps<T>) {
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

/**
 * A hierarchy of rows built on React Aria's `Tree`: expand and collapse, selection with optional
 * checkboxes and propagation, keyboard navigation and typeahead, filtering, link rows, optional
 * persisted expansion, children loaded on demand, loading and empty notices, an actions slot per
 * row, in-place renaming and opt-in reordering. Items are plain data; render callbacks draw them.
 */
export function Tree<T extends TreeItemData>(props: TreeProps<T>) {
  const { root, aria, state, items, expansion, selection, reordering, keys, ...model } =
    useTreeModel(props);
  const { isPending, emptyMessage, disabledKeys } = state;
  const ariaKeys = createTreeAriaKeys({
    selection: selection.props,
    expansion,
    disabledKeys,
    onAction: aria.onAction,
  });
  const hasEmptyState = isPending || !isEmptyNode(emptyMessage);
  const { dragAndDropHooks } = useDragAndDrop<T>(reordering?.dragAndDrop ?? noDragAndDrop);
  let tree = (
    <AriaTree
      // React Aria keeps drag and drop hooks for the tree's lifetime: remount when reordering toggles.
      key={reordering ? 'reorderable' : 'fixed'}
      {...aria}
      {...ariaKeys}
      {...hooks.root({ className: root.className, props: aria, data: root.data })}
      ref={root.ref}
      items={items}
      dependencies={model.dependencies}
      renderEmptyState={
        hasEmptyState
          ? () => <TreeEmptyState isPending={isPending} emptyMessage={emptyMessage} />
          : undefined
      }
      dragAndDropHooks={reordering ? dragAndDropHooks : undefined}
      render={(domProps) => (
        <div
          {...domProps}
          aria-busy={isPending || undefined}
          onKeyDownCapture={(event) => {
            keys.onKeyDownCapture(event);
            if (!event.isPropagationStopped()) domProps.onKeyDownCapture?.(event);
          }}
        />
      )}
    >
      {model.renderItem}
    </AriaTree>
  );
  if (props.filterText !== undefined) {
    tree = <TextMatchProvider query={props.filterText}>{tree}</TextMatchProvider>;
  }
  if (root.rowHeight === null) return tree;
  return (
    <Virtualizer layout={ListLayout} layoutOptions={{ rowHeight: root.rowHeight }}>
      {tree}
    </Virtualizer>
  );
}

export { useTreeLoads } from './use-tree-loads.js';
export type { TreeLoads } from './use-tree-loads.js';
