'use client';

import { armHandleDrag } from '../drag-handle/drag-handle.js';
import {
  Tree as AriaTree,
  ListLayout,
  useDragAndDrop,
  Virtualizer,
} from '../../primitives/index.js';
import { useContext, useMemo } from 'react';
import { PrimaryActionKeysContext } from '../../utils/primary-action-keys.js';
import { keepTreePrimaryKeys } from './tree-primary-keys.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { useCarriedFocus } from '../../utils/use-carried-focus.js';
import { useKeptCollectionAttributes } from '../../utils/use-kept-collection-attributes.js';
import { TextMatchProvider } from '../text-match/text-match.js';
import { TreeEmptyState } from './tree-item.js';
import { useTreeChildren } from './tree-section.js';
import { createTreeAriaKeys } from './tree-aria-keys.js';
import { treeHooks as hooks } from './tree-hooks.js';
import type { TreeItemData, TreeProps } from './tree-props.js';
import { useTreeModel } from './use-tree-model.js';

export type {
  TreeCurrentMark,
  TreeExpandGlyph,
  TreeItemData,
  TreeItemState,
  TreeMarks,
  TreeNewMark,
  TreeProps,
  TreeSectionData,
  TreeSelectedMark,
  TreeSize,
  TreeVariant,
} from './tree-props.js';
export { useTreeLoads } from './use-tree-loads.js';
export type { TreeLoads } from './use-tree-loads.js';

/** A virtualized tree's row height, which its section heading rows take too. */
const toLayoutOptions = (rowHeight: number) => ({ rowHeight, headingHeight: rowHeight });

/**
 * A hierarchy of rows built on React Aria's `Tree`: expand and collapse, selection with optional
 * checkboxes and propagation, keyboard navigation and typeahead, filtering, link rows, optional
 * persisted expansion, children loaded on demand, loading and empty notices, an actions slot per
 * row, in-place renaming, opt-in reordering and category sections under heading rows. Items are plain data; render callbacks draw them.
 */
export function Tree<T extends TreeItemData>(props: TreeProps<T>) {
  const isBoundary = useContext(PrimaryActionKeysContext);
  const {
    root,
    aria,
    state,
    items,
    shown,
    expansion,
    selection,
    reordering,
    dragAndDrop,
    keys,
    ...model
  } = useTreeModel(props);
  const children = useTreeChildren(shown, model.renderItem, model.dependencies);
  const { isPending, emptyMessage, disabledKeys } = state;
  const ariaKeys = createTreeAriaKeys({
    selection: selection.props,
    expansion,
    disabledKeys,
    onAction: aria.onAction,
  });
  const hasEmptyState = isPending || !isEmptyNode(emptyMessage);
  // React Aria keeps the hooks a tree mounts with, so they stay and are disabled while it does not
  // reorder: turning reordering on and off keeps the rows mounted.
  const { dragAndDropHooks } = useDragAndDrop<T>({ ...dragAndDrop, isDisabled: !reordering });
  // Turning virtualization on or off mounts React Aria's tree afresh.
  const carried = useCarriedFocus<HTMLDivElement>(String(root.rowHeight === null));
  const described = useKeptCollectionAttributes<HTMLDivElement>(aria);
  const ref = useMemo(
    () => mergeRefs(carried, described, root.ref),
    [carried, described, root.ref],
  );
  const tree = (
    <AriaTree
      {...aria}
      {...ariaKeys}
      {...hooks.root({ className: root.className, props: aria, data: root.data })}
      ref={ref}
      items={shown ? undefined : items}
      dependencies={model.dependencies}
      renderEmptyState={
        hasEmptyState
          ? () => <TreeEmptyState isPending={isPending} emptyMessage={emptyMessage} />
          : undefined
      }
      dragAndDropHooks={dragAndDropHooks}
      render={(domProps) => (
        <div
          {...keepTreePrimaryKeys(domProps, isBoundary)}
          // An empty pending tree holds the loading status, which a busy ancestor would hold back.
          aria-busy={
            (isPending && !(domProps as { 'data-empty'?: boolean })['data-empty']) || undefined
          }
          onKeyDownCapture={(event) => {
            keys.onKeyDownCapture(event);
            if (!event.isPropagationStopped())
              keepTreePrimaryKeys(domProps, isBoundary).onKeyDownCapture?.(event);
          }}
          // With handle drags only a press on a row's handle makes that row draggable.
          onPointerDownCapture={(event) => {
            if (reordering?.isHandleDrag) armHandleDrag(event);
            domProps.onPointerDownCapture?.(event);
          }}
        />
      )}
    >
      {children}
    </AriaTree>
  );
  // Always drawn, so a filter starting or ending keeps the tree mounted; without one it passes through.
  const matched = (
    <TextMatchProvider query={props.filterText} isInherited={props.filterText === undefined}>
      {tree}
    </TextMatchProvider>
  );
  if (root.rowHeight === null) return matched;
  return (
    <Virtualizer layout={ListLayout} layoutOptions={toLayoutOptions(root.rowHeight)}>
      {matched}
    </Virtualizer>
  );
}
