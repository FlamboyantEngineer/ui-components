'use client';

// Card collections: React Aria's grid list in its grid layout, one item per card.

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  Collection,
  GridLayout,
  GridList,
  GridListItem,
  GridListLoadMoreItem,
  Size as LayoutSize,
  Virtualizer,
  WaterfallLayout,
} from '../../primitives/index.js';
import type { AriaLabellingProps, CollectionSelectionProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, Selection } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { isElement, isNode } from '../../utils/is-element.js';

/** `grid` lines cards up in rows and columns; `waterfall` stacks cards of different heights in columns. */
export type CardGridLayout = 'grid' | 'waterfall';

/** The smallest size, in pixels, the virtual layout gives a card. */
export interface CardGridItemSize {
  width: number;
  height: number;
}

export interface CardGridProps<T extends object>
  extends BaseProps, AriaLabellingProps, CollectionSelectionProps {
  /** The cards as data, drawn by the function in `children`. */
  items?: Iterable<T> | undefined;
  /** `CardGridItem`s, or a function drawing one from each of `items`. */
  children?: ReactNode | ((item: T) => ReactElement);
  /** Values that, when they change, redraw the items drawn from `items`. */
  dependencies?: readonly unknown[] | undefined;
  /** Called with the key of the card the reader opens. */
  onAction?: ((key: Key) => void) | undefined;
  /** How the cards are laid out. Defaults to `grid`; `waterfall` always renders only the cards in view. */
  layout?: CardGridLayout | undefined;
  /** Renders only the cards in view; the stylesheet must bound the grid's height. */
  virtualized?: boolean | undefined;
  /** The smallest card size in the virtual layout. Defaults to 200 by 200 pixels. */
  minItemSize?: CardGridItemSize | undefined;
  /** Asks for more cards when the end of the grid scrolls into view. */
  onLoadMore?: (() => void) | undefined;
  /** More cards are loading: a loading item follows the cards. */
  isLoading?: boolean | undefined;
  /** Draws the grid while it has no cards. */
  renderEmptyState?: (() => ReactNode) | undefined;
}

/** The state a card grid item hands to a render function in its `children`. */
export interface CardGridItemState {
  /** Whether the item is selected, for the card's own `isSelected`. */
  isSelected: boolean;
}

export interface CardGridItemProps extends Omit<BaseProps, 'id'> {
  /** The item's key in the grid. */
  id?: Key | undefined;
  /** The text typeahead matches and the item's accessible name. */
  textValue?: string | undefined;
  /** Makes the item a link: opening it follows the address. */
  href?: string | undefined;
  /** Called when the reader opens this item, as well as the grid's `onAction`. */
  onAction?: (() => void) | undefined;
  /** The item's content, usually a `Card`, or a function drawing it from the item's state. */
  children?: ReactNode | ((state: CardGridItemState) => ReactNode);
}

const gridHooks = createHooks('card-grid', ['loader']);
const itemHooks = createHooks('card-grid-item', ['checkbox']);

const defaultItemSize: CardGridItemSize = { width: 200, height: 200 };

/** React Aria's virtual layout and its options for a layout and a smallest card size. */
function toVirtualLayout(layout: CardGridLayout, { width, height }: CardGridItemSize) {
  const minItemSize = new LayoutSize(width, height);
  return layout === 'waterfall'
    ? ({ layout: WaterfallLayout, layoutOptions: { minItemSize } } as const)
    : ({ layout: GridLayout, layoutOptions: { minItemSize } } as const);
}

/**
 * The selection, held here while uncontrolled: switching between the plain grid and the virtual
 * layouts mounts React Aria's grid list afresh, which would start again from `defaultSelectedKeys`.
 */
function useCardGridSelection({
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
}: Pick<CardGridProps<object>, 'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange'>) {
  const [own, setOwn] = useState<Iterable<Key> | 'all'>(() => defaultSelectedKeys ?? []);
  const isControlled = selectedKeys !== undefined;
  return {
    selectedKeys: isControlled ? selectedKeys : own,
    onSelectionChange(keys: Selection) {
      if (!isControlled) setOwn(keys);
      onSelectionChange?.(keys);
    },
  };
}

/**
 * Focuses the card with `key` once the grid renders it (a virtual layout renders its cards after
 * measuring), unless focus lands somewhere else first. Returns a function that stops waiting.
 */
function refocusCard(grid: HTMLElement, key: string): () => void {
  const owner = grid.ownerDocument;
  const attempt = () => {
    if (owner.activeElement !== owner.body) return true;
    const card = grid.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`);
    card?.focus();
    return card !== null;
  };
  if (attempt()) return () => undefined;
  const observer = new MutationObserver(() => {
    if (attempt()) observer.disconnect();
  });
  observer.observe(grid, { childList: true, subtree: true });
  return () => observer.disconnect();
}

/**
 * Keeps focus on the same card when the grid list mounts afresh for another `layout` or
 * `virtualized`: the card that held focus, if focus had not moved elsewhere, takes it again.
 */
function useCarriedFocus(mode: string) {
  const gridRef = useRef<HTMLDivElement>(null);
  const focusedKey = useRef<string | null>(null);
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;
    const key = focusedKey.current;
    const stopRefocus = key === null ? undefined : refocusCard(grid, key);
    const onFocusIn = (event: FocusEvent) => {
      const target = isElement(event.target) ? event.target : null;
      focusedKey.current = target?.closest('[data-key]')?.getAttribute('data-key') ?? null;
    };
    // A card leaving the page takes focus to nowhere; focus moved elsewhere names where it went.
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (isNode(next) && !grid.contains(next)) focusedKey.current = null;
    };
    grid.addEventListener('focusin', onFocusIn);
    grid.addEventListener('focusout', onFocusOut);
    return () => {
      stopRefocus?.();
      grid.removeEventListener('focusin', onFocusIn);
      grid.removeEventListener('focusout', onFocusOut);
    };
  }, [mode]);
  return gridRef;
}

/** The cards: children, or the cards drawn from `items`, and the loading item when loading more. */
function CardGridCards<T extends object>(
  props: Pick<CardGridProps<T>, 'items' | 'children' | 'dependencies' | 'onLoadMore' | 'isLoading'>,
) {
  const strings = useUiStrings();
  const { items, children, dependencies, onLoadMore, isLoading = false } = props;
  return (
    <>
      <Collection items={items} dependencies={dependencies}>
        {children}
      </Collection>
      {onLoadMore ? (
        <GridListLoadMoreItem
          className={gridHooks.slotClass('loader')}
          isLoading={isLoading}
          onLoadMore={onLoadMore}
        >
          <EmptyState variant="loading" size="sm" description={strings.loading} />
        </GridListLoadMoreItem>
      ) : null}
    </>
  );
}

/**
 * A collection of cards with two-dimensional arrow-key navigation, built on React Aria's grid list
 * in its grid layout: selection with checkboxes, actions, links, typeahead, a virtualized grid or
 * waterfall, loading more and an empty state.
 */
export function CardGrid<T extends object>({
  items,
  children,
  dependencies,
  layout = 'grid',
  virtualized = false,
  minItemSize = defaultItemSize,
  onLoadMore,
  isLoading,
  renderEmptyState,
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  className,
  ...rest
}: CardGridProps<T>) {
  const emptyState = useMemo(
    () => renderEmptyState && (() => renderEmptyState()),
    [renderEmptyState],
  );
  const selection = useCardGridSelection({ selectedKeys, defaultSelectedKeys, onSelectionChange });
  const isVirtual = virtualized || layout !== 'grid';
  const gridRef = useCarriedFocus(isVirtual ? layout : 'plain');
  const grid = (
    <GridList
      {...rest}
      {...selection}
      ref={gridRef}
      layout="grid"
      renderEmptyState={emptyState}
      {...gridHooks.root({ className, props: rest })}
    >
      <CardGridCards {...{ items, children, dependencies, onLoadMore, isLoading }} />
    </GridList>
  );
  if (!isVirtual) return grid;
  // React Aria's virtualizer cannot change its layout class in place, so a new layout remounts it.
  return (
    <Virtualizer key={layout} {...toVirtualLayout(layout, minItemSize)}>
      {grid}
    </Virtualizer>
  );
}

/**
 * One item of a `CardGrid`, usually holding a `Card`. While the grid selects with toggles, it draws
 * a selection checkbox before its content; a render function receives the item's `isSelected` for
 * the card.
 */
export function CardGridItem({ className, children, ...rest }: CardGridItemProps) {
  return (
    <GridListItem {...rest} {...itemHooks.root({ className, props: rest })}>
      {({ selectionMode, selectionBehavior, isSelected }) => (
        <>
          {selectionMode !== 'none' && selectionBehavior === 'toggle' ? (
            <Checkbox size="sm" slot="selection" className={itemHooks.slotClass('checkbox')} />
          ) : null}
          {typeof children === 'function' ? children({ isSelected }) : children}
        </>
      )}
    </GridListItem>
  );
}
