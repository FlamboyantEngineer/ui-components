'use client';

import { keepTextControlKeys } from '../../utils/text-control-keys.js';
import { useCallback, type JSX, type ReactElement, type ReactNode } from 'react';
import {
  Collection,
  TreeItem,
  TreeItemContent,
  TreeLoadMoreItem,
  type TreeItemContentRenderProps,
  type TreeItemRenderProps,
  type TreeLoadMoreItemRenderProps,
} from '../../primitives/index.js';
import { measuredProperty } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { useShallowStable } from '../../utils/use-shallow-stable.js';
import { EmptyState } from '../empty-state/empty-state.js';
import type { TreeExpandGlyph, TreeItemData, TreeItemState, TreeProps } from './tree-props.js';
import { treeHooks as hooks } from './tree-hooks.js';
import { TreeRowContent, type RowContentOptions } from './tree-row.js';
import type { TreeKeyDown } from './use-tree-key-down.js';
import type { TreeLoads } from './use-tree-loads.js';
import type { TreeRename } from './use-tree-rename.js';
import type { TreeReorder } from './use-tree-reorder.js';

/** The props and tree state that draw each row. */
export interface TreeRowOptions<T extends TreeItemData> extends Pick<
  TreeProps<T>,
  | 'getTextValue'
  | 'hasChildItems'
  | 'isItemPending'
  | 'getHref'
  | 'currentKey'
  | 'getIcon'
  | 'renderLabel'
  | 'renderMeta'
  | 'renderActions'
> {
  /** Children of an item. */
  getChildren: (item: T) => readonly T[] | undefined;
  /** The expand button's glyphs. */
  expandGlyph: TreeExpandGlyph;
  /** Reordering, while the tree is reorderable. */
  reordering: TreeReorder | null;
  /** Records which item a row element draws. */
  registerRow: TreeKeyDown<T>['registerRow'];
  /** Whether rows draw a selection checkbox while the tree selects. */
  checkboxSelection: boolean;
  /** Whether a row holds some but not all selected descendants. */
  isIndeterminate: (key: Key) => boolean;
  /** In-place renaming, while the owner takes renames. */
  rename: TreeRename<T> | null;
  /** Loading children on demand, while the owner loads them. */
  loads: TreeLoads | null;
}

/** What a row element marks on top of React Aria's props. */
interface RowElementOptions {
  isMovable: boolean;
  isCurrent: boolean;
  isIndeterminate: boolean;
  href: string | undefined;
  keyShortcuts: string | undefined;
}

const getLevelStyle = ({ level }: TreeItemRenderProps | TreeLoadMoreItemRenderProps) =>
  measuredProperty('tree-level', String(level));

function toItemState(values: TreeItemContentRenderProps, isCurrent: boolean): TreeItemState {
  const { isExpanded, hasChildItems, level, isSelected, isDisabled, isFocusVisible } = values;
  return { isExpanded, hasChildItems, level, isSelected, isDisabled, isFocusVisible, isCurrent };
}

/**
 * The row element: React Aria's props, without its drag handlers when the row cannot move, plus
 * the current-row marks and the keyboard moves a movable row announces.
 */
function createRowElement(options: RowElementOptions) {
  const { isMovable, isCurrent, isIndeterminate, href, keyShortcuts } = options;
  return (domProps: JSX.IntrinsicElements['div']) => {
    const { draggable, onDragStart, onDrag, onDragEnd, ...others } = domProps;
    return (
      <div
        {...keepTextControlKeys(others)}
        {...(isMovable ? { draggable, onDragStart, onDrag, onDragEnd } : {})}
        data-current={isCurrent || undefined}
        data-indeterminate={isIndeterminate || undefined}
        aria-current={isCurrent ? (href ? 'page' : true) : undefined}
        aria-keyshortcuts={isMovable ? keyShortcuts : undefined}
      />
    );
  };
}

/**
 * The loading row below an expanded row whose children are not loaded yet. With `onLoadMore` it
 * asks for them once it is in view (React Aria's loading sentinel).
 */
function TreeLoaderRow(props: { isLoading: boolean; onLoadMore: (() => void) | undefined }) {
  const strings = useUiStrings();
  return (
    <TreeLoadMoreItem
      className={hooks.slotClass('loader')}
      style={getLevelStyle}
      isLoading={props.isLoading}
      onLoadMore={props.onLoadMore}
    >
      <EmptyState variant="loading" size="sm" description={strings.loading} />
    </TreeLoadMoreItem>
  );
}

/** The notice an empty tree shows: a loading notice while pending, else the caller's message. */
export function TreeEmptyState(props: { isPending: boolean; emptyMessage: ReactNode }) {
  const strings = useUiStrings();
  return (
    <EmptyState
      variant={props.isPending ? 'loading' : 'empty'}
      size="sm"
      description={props.isPending ? strings.loading : props.emptyMessage}
      className={hooks.slotClass('empty')}
    />
  );
}

const isNeverMovable = () => false;

/** The options every row's content reads, kept while none of them changes. */
function useRowContentOptions<T extends TreeItemData>(options: TreeRowOptions<T>) {
  const { getTextValue, getIcon, renderLabel, renderMeta, renderActions, expandGlyph } = options;
  const { checkboxSelection, isIndeterminate, rename, loads } = options;
  const isMovable = options.reordering?.isMovable;
  return useShallowStable<RowContentOptions<T>>({
    ...{ getTextValue, getIcon, renderLabel, renderMeta, renderActions, expandGlyph },
    ...{ checkboxSelection, isIndeterminate, rename, loads },
    isMovable: isMovable ?? isNeverMovable,
    hasReorder: isMovable !== undefined,
  });
}

/** The loading row of a branch whose children are not loaded, asking for them unless they came. */
function renderLoader<T extends TreeItemData>(
  item: T,
  { isItemPending, loads }: Pick<TreeRowOptions<T>, 'isItemPending' | 'loads'>,
) {
  const isLoading = (isItemPending?.(item) ?? false) || (loads?.isLoading(item.id) ?? false);
  const canLoad = loads && !loads.hasLoaded(item.id) && !loads.errorOf(item.id);
  return (
    <TreeLoaderRow
      isLoading={isLoading}
      onLoadMore={canLoad ? () => loads.load(item.id) : undefined}
    />
  );
}

/**
 * Draws an item as a row with its loaded children nested below it, or with a loading row when it
 * has children that are not loaded yet.
 */
export function useTreeItemRenderer<T extends TreeItemData>(
  options: TreeRowOptions<T>,
): (item: T) => ReactElement {
  const { getTextValue, getChildren, hasChildItems, isItemPending, getHref, currentKey } = options;
  const { reordering, registerRow, loads } = options;
  const content = useRowContentOptions(options);
  const keyShortcuts = reordering?.keyShortcuts;
  return useCallback(
    function renderItem(item: T): ReactElement {
      const children = getChildren(item) ?? [];
      const isLazy = children.length === 0 && (hasChildItems?.(item) ?? false);
      const href = getHref?.(item);
      const isCurrent = currentKey != null && item.id === currentKey;
      const isIndeterminate = content.isIndeterminate(item.id);
      const isMovable = content.isMovable(item.id);
      const rowElement = { isMovable, isCurrent, isIndeterminate, href, keyShortcuts };
      return (
        <TreeItem
          id={toCollectionKey(item.id)}
          textValue={getTextValue(item)}
          href={href}
          hasChildItems={isLazy || undefined}
          className={hooks.slotClass('item')}
          style={getLevelStyle}
          render={createRowElement(rowElement)}
          ref={(node: HTMLDivElement | null) => registerRow(node, item)}
        >
          <TreeItemContent>
            {(values) => (
              <TreeRowContent
                item={item}
                state={toItemState(values, isCurrent)}
                hasCheckbox={content.checkboxSelection && values.selectionMode !== 'none'}
                options={content}
              />
            )}
          </TreeItemContent>
          {children.length > 0 ? (
            // React Aria caches rendered items until a dependency changes: the render function is one.
            <Collection items={children} dependencies={[renderItem]}>
              {renderItem}
            </Collection>
          ) : null}
          {isLazy ? renderLoader(item, { isItemPending, loads }) : null}
        </TreeItem>
      );
    },
    [
      getChildren,
      hasChildItems,
      isItemPending,
      getHref,
      currentKey,
      getTextValue,
      content,
      keyShortcuts,
      registerRow,
      loads,
    ],
  );
}
