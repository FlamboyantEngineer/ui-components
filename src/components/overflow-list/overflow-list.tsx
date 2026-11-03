'use client';

import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { useCallback, useRef, type ReactNode, type Ref, type RefCallback } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ContainerProps, Key } from '../../core/props.js';
import { renderElement, type ElementRender } from '../../utils/render-element.js';
import { useOverflowItems, type OverflowCollapseFrom } from '../../utils/use-overflow-items.js';

/** The state an `OverflowList`'s `render` receives. */
export interface OverflowListRenderState {
  /** Some items do not fit and are left to the indicator. */
  isOverflowing: boolean;
  /** The element holding the items and indicator when the rendered root wraps them in its own strip. */
  itemContainerRef: RefCallback<HTMLElement>;
}

export interface OverflowListProps<T> extends Omit<ContainerProps<'div'>, 'children'>, BaseProps {
  /** Every item, in order. */
  items: readonly T[];
  /**
   * The item's identity, unique in `items`. An item keeps its element, state and focus while the
   * list reorders, grows or shrinks around it; `1` and `'1'` are different items.
   */
  getKey: (item: T) => Key;
  /** Draws one item. `index` is the item's position in `items`. */
  renderItem: (item: T, index: number) => ReactNode;
  /** Draws the indicator for the items that do not fit, such as a "+N" count or a "more" menu. */
  renderOverflow: (hiddenItems: readonly T[]) => ReactNode;
  /** Which end hidden items leave from. Defaults to `end`. */
  collapseFrom?: OverflowCollapseFrom | undefined;
  /** Replaces the root `<div>`, for example with a toolbar; spread the props and ref onto it. */
  render?: ElementRender<'div', OverflowListRenderState> | undefined;
}

const hooks = createHooks('overflow-list', ['item', 'overflow']);

/** A React key that keeps a number apart from the string of its digits. */
function toElementKey(key: Key): string {
  return `${typeof key}:${String(key)}`;
}

/** Keeps the caller's root ref separate from the strip the row measures, when one is supplied. */
function useOverflowRefs(
  containerRef: RefCallback<HTMLElement>,
  callerRef: Ref<HTMLDivElement> | undefined,
) {
  const root = useRef<HTMLElement | null>(null);
  const itemContainer = useRef<HTMLElement | null>(null);
  const setRoot = useCallback(
    (element: HTMLElement | null) => {
      root.current = element;
      containerRef(itemContainer.current ?? element);
    },
    [containerRef],
  );
  const itemContainerRef = useCallback(
    (element: HTMLElement | null) => {
      itemContainer.current = element;
      containerRef(element ?? root.current);
    },
    [containerRef],
  );
  const rootRef = useMergedRefs(setRoot, callerRef);
  return { rootRef, itemContainerRef };
}

/**
 * One row of items that keeps as many as fit and hands the rest to an indicator at one end, such as
 * a "+N" count or a "more" menu. The row measures itself; the stylesheet lays it out on one line.
 */
export function OverflowList<T>({
  items,
  getKey,
  renderItem,
  renderOverflow,
  collapseFrom = 'end',
  render,
  className,
  ref,
  ...rest
}: OverflowListProps<T>) {
  const { containerRef, visibleItems, hiddenItems } = useOverflowItems({ items, collapseFrom });
  const { rootRef, itemContainerRef } = useOverflowRefs(containerRef, ref);
  const isOverflowing = hiddenItems.length > 0;
  const offset = collapseFrom === 'start' ? items.length - visibleItems.length : 0;
  const indicator = isOverflowing ? (
    <div {...hooks.slot('overflow')}>{renderOverflow(hiddenItems)}</div>
  ) : null;

  return renderElement(
    'div',
    {
      ...rest,
      ...hooks.root({ className, props: rest, data: { collapseFrom, overflowing: isOverflowing } }),
      ref: rootRef,
      children: (
        <>
          {collapseFrom === 'start' ? indicator : null}
          {visibleItems.map((item, index) => (
            <div key={toElementKey(getKey(item))} {...hooks.slot('item')}>
              {renderItem(item, offset + index)}
            </div>
          ))}
          {collapseFrom === 'end' ? indicator : null}
        </>
      ),
    },
    { render, state: { isOverflowing, itemContainerRef } },
  );
}

export { VisibleCollection } from './visible-collection.js';
export type { VisibleCollectionProps } from './visible-collection.js';
