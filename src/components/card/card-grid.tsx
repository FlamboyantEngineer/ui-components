'use client';

// Card collections: React Aria's grid list in its grid layout, one item per card.

import { useMemo, type ReactElement, type ReactNode } from 'react';
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
import type { BaseProps, Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { EmptyState } from '../empty-state/empty-state.js';

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
  className,
  ...rest
}: CardGridProps<T>) {
  const emptyState = useMemo(
    () => renderEmptyState && (() => renderEmptyState()),
    [renderEmptyState],
  );
  const grid = (
    <GridList
      {...rest}
      layout="grid"
      renderEmptyState={emptyState}
      {...gridHooks.root({ className, props: rest })}
    >
      <CardGridCards {...{ items, children, dependencies, onLoadMore, isLoading }} />
    </GridList>
  );
  if (!virtualized && layout === 'grid') return grid;
  return <Virtualizer {...toVirtualLayout(layout, minItemSize)}>{grid}</Virtualizer>;
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
