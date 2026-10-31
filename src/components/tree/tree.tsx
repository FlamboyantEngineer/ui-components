'use client';

import {
  Tree as AriaTree,
  ListLayout,
  useDragAndDrop,
  Virtualizer,
} from '../../primitives/index.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { TextMatchProvider } from '../text-match/text-match.js';
import { TreeEmptyState } from './tree-item.js';
import { createTreeAriaKeys } from './tree-aria-keys.js';
import { treeHooks as hooks } from './tree-hooks.js';
import type { TreeItemData, TreeProps } from './tree-props.js';
import { useTreeModel } from './use-tree-model.js';

export type {
  TreeExpandGlyph,
  TreeItemData,
  TreeItemState,
  TreeProps,
  TreeSize,
  TreeVariant,
} from './tree-props.js';
export { useTreeLoads } from './use-tree-loads.js';
export type { TreeLoads } from './use-tree-loads.js';

/** The drag and drop options of a tree that does not reorder: neither draggable nor droppable. */
const noDragAndDrop = {};

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
