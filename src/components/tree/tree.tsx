import { useMemo, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import {
  Tree as AriaTree,
  type TreeItemContentRenderProps,
  type TreeProps as AriaTreeProps,
} from 'react-aria-components';
import type { BaseProps, Size } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { readTreeChildren, type TreeMoveItem } from '../../utils/tree-reorder.js';
import type { IconSource } from '../icon/icon.js';
import { TreeEmptyState, useTreeItemRenderer } from './tree-item.js';
import { treeHooks as hooks } from './tree-hooks.js';
import { useTreeExpansion } from './use-tree-expansion.js';
import { useTreeKeyDown } from './use-tree-key-down.js';
import { useTreeReorder, type TreeReorderOptions } from './use-tree-reorder.js';

/** The minimal shape of a tree item: a key unique in the tree, and optional children. */
export type TreeItemData = TreeMoveItem<unknown>;

/** A row's state, passed to the render callbacks. */
export interface TreeItemState extends Pick<
  TreeItemContentRenderProps,
  'isExpanded' | 'hasChildItems' | 'level' | 'isSelected' | 'isDisabled' | 'isFocusVisible'
> {
  /** Whether the row is the current page or item. */
  isCurrent: boolean;
}

/** `chevron` draws chevron-right and chevron-down; `plus-minus` draws plus and minus. */
export type TreeExpandGlyph = 'chevron' | 'plus-minus';
export type TreeSize = Extract<Size, 'sm' | 'md' | 'lg'>;
/** `picker` is a tree the reader chooses one row from; the stylesheet greys out rows that cannot be chosen. */
export type TreeVariant = 'default' | 'picker';

export interface TreeProps<T extends TreeItemData>
  extends
    Omit<
      AriaTreeProps<T>,
      | 'items'
      | 'children'
      | 'className'
      | 'style'
      | 'render'
      | 'dragAndDropHooks'
      | 'renderEmptyState'
    >,
    BaseProps {
  /** Top-level items. Each item's `id` must be unique in the whole tree. */
  items: readonly T[];
  /** Plain text for an item: its accessible name and the text typeahead matches. */
  getTextValue: (item: T) => string;
  /** Children of an item. Defaults to its `children` property. */
  getChildren?: ((item: T) => readonly T[] | undefined) | undefined;
  /** Whether an item without loaded children has some, so it can be expanded to load them. */
  hasChildItems?: ((item: T) => boolean) | undefined;
  /** Whether an expanded item's children are loading: a loading row shows below it. */
  isItemPending?: ((item: T) => boolean) | undefined;
  /** Makes the row itself a link. Navigation goes through the provider's `navigate` when set. */
  getHref?: ((item: T) => string | undefined) | undefined;
  /** Whether the row is the current page or item: `aria-current` and `data-current`. */
  isItemCurrent?: ((item: T) => boolean) | undefined;
  /** A built-in glyph name or icon node before the label. */
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
  /** Sees each keydown in a row before the tree does; return `true` to claim the key. */
  onItemKeyDown?: ((item: T, event: KeyboardEvent<HTMLElement>) => boolean) | undefined;
  /** The tree grid element. */
  ref?: Ref<HTMLDivElement> | undefined;
}

const noDependencies: readonly unknown[] = [];

/** Separates the props that draw rows, the expansion, the root's own and React Aria's. */
function splitTreeProps<T extends TreeItemData>({
  items,
  getTextValue,
  getChildren = readTreeChildren,
  hasChildItems,
  isItemPending,
  getHref,
  isItemCurrent,
  getIcon,
  renderLabel,
  renderMeta,
  renderActions,
  expandGlyph = 'chevron',
  dependencies = noDependencies,
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
  className,
  ref,
  disabledKeys,
  ...aria
}: TreeProps<T>) {
  const row = {
    getTextValue,
    getChildren,
    hasChildItems,
    isItemPending,
    getHref,
    isItemCurrent,
    getIcon,
    renderLabel,
    renderMeta,
    renderActions,
    expandGlyph,
    dependencies,
  };
  const expansion = { expandedKeys, defaultExpandedKeys, onExpandedChange, persistKey };
  const state = { items, isPending, emptyMessage, reorder, onItemKeyDown, disabledKeys };
  const root = { className, ref, data: { size, variant, expandGlyph, wrap, pending: isPending } };
  return { row, expansion, state, root, aria };
}

/**
 * A hierarchy of rows built on React Aria's `Tree`: expand and collapse, selection, keyboard
 * navigation and typeahead, link rows, optional persisted expansion, loading and empty notices, an
 * actions slot per row, and opt-in reordering. Items are plain data; render callbacks draw them.
 */
export function Tree<T extends TreeItemData>(props: TreeProps<T>) {
  const { row, expansion: expansionOptions, state, root, aria } = splitTreeProps(props);
  const expansion = useTreeExpansion(expansionOptions);
  const { items, reorder, disabledKeys, isPending, emptyMessage } = state;
  const { getChildren, getTextValue } = row;
  const reordering = useTreeReorder({
    items,
    reorder,
    disabledKeys,
    expansion,
    getChildren,
    getTextValue,
  });
  const keys = useTreeKeyDown({ onItemKeyDown: state.onItemKeyDown, reordering });
  const renderItem = useTreeItemRenderer({ ...row, reordering, registerRow: keys.registerRow });
  const dependencies = useMemo(
    () => [renderItem, ...row.dependencies],
    [renderItem, row.dependencies],
  );
  const hasEmptyState = isPending || !isEmptyNode(emptyMessage);
  return (
    <AriaTree
      // React Aria keeps drag and drop hooks for the tree's lifetime: remount when reordering toggles.
      key={reordering ? 'reorderable' : 'fixed'}
      {...aria}
      {...hooks.root({ className: root.className, props: aria, data: root.data })}
      ref={root.ref}
      items={items}
      disabledKeys={disabledKeys}
      dependencies={dependencies}
      expandedKeys={expansion.expandedKeys}
      onExpandedChange={expansion.setExpandedKeys}
      renderEmptyState={
        hasEmptyState
          ? () => <TreeEmptyState isPending={isPending} emptyMessage={emptyMessage} />
          : undefined
      }
      dragAndDropHooks={reordering?.dragAndDropHooks}
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
      {renderItem}
    </AriaTree>
  );
}
