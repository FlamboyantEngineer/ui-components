// Card collections: React Aria's grid list in its grid layout, one item per card.

import {
  GridList,
  GridListItem,
  composeRenderProps,
  type GridListItemProps as AriaGridListItemProps,
  type GridListProps as AriaGridListProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Checkbox } from '../checkbox/checkbox.js';

export interface CardGridProps<T extends object>
  extends Omit<AriaGridListProps<T>, 'className' | 'style' | 'layout'>, BaseProps {}

/** The item's `id` is its React Aria collection key. */
export interface CardGridItemProps<T extends object = object>
  extends Omit<AriaGridListItemProps<T>, 'className' | 'style'>, Omit<BaseProps, 'id'> {}

const gridHooks = createHooks('card-grid');
const itemHooks = createHooks('card-grid-item', ['checkbox']);

/**
 * A collection of cards with two-dimensional arrow-key navigation, built on React Aria's grid list
 * in its grid layout. Selection, actions, links, drag and drop, empty states and collection children
 * (`Virtualizer` layouts such as `GridLayout` or `WaterfallLayout`, `GridListLoadMoreItem`) are React
 * Aria's.
 */
export function CardGrid<T extends object>({ className, ...rest }: CardGridProps<T>) {
  return <GridList {...rest} layout="grid" {...gridHooks.root({ className, props: rest })} />;
}

/**
 * One item of a `CardGrid`, usually holding a `Card`. While the grid selects with toggles, it draws
 * a selection checkbox before its content; a render function receives React Aria's item states,
 * such as `isSelected` for the card.
 */
export function CardGridItem<T extends object = object>({
  className,
  children,
  ...rest
}: CardGridItemProps<T>) {
  return (
    <GridListItem {...rest} {...itemHooks.root({ className, props: rest })}>
      {composeRenderProps(children, (content, { selectionMode, selectionBehavior }) => (
        <>
          {selectionMode !== 'none' && selectionBehavior === 'toggle' ? (
            <Checkbox slot="selection" className={itemHooks.slotClass('checkbox')} />
          ) : null}
          {content}
        </>
      ))}
    </GridListItem>
  );
}
