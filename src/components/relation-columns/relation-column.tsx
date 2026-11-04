'use client';

import { type ReactNode, useId } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { formatCount } from '../../utils/count.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { ListView, ListViewItem } from '../list-row/list-row.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { relationColumnsHooks as hooks } from './relation-columns-hooks.js';
import type { RelationColumn, RelationDirection } from './relation-columns-model.js';

/** What every column of a walk shares. */
export interface RelationColumnContext<T> {
  getRelated: (item: T, direction: RelationDirection) => readonly T[];
  getTextValue: (item: T) => string;
  renderItem: ((item: T) => ReactNode) | undefined;
  onAction: ((key: Key) => void) | undefined;
  onSelect: (column: RelationColumn<T>, key: Key) => void;
}

interface RelationColumnViewProps<T> {
  column: RelationColumn<T>;
  context: RelationColumnContext<T>;
}

/** A count drawn as digits in the provider locale and read as text. */
function Count({
  count,
  text,
  slot,
}: {
  count: number;
  text: string;
  slot: 'column-count' | 'item-count';
}) {
  const { locale } = useLocale();
  return (
    <span {...hooks.slot(slot)}>
      <span aria-hidden="true">{formatCount(count, locale)}</span>
      <VisuallyHidden as="span">{text}</VisuallyHidden>
    </span>
  );
}

/** The column's title: what it lists, by the item it lists them for. */
function useColumnTitle<T>(column: RelationColumn<T>, getTextValue: (item: T) => string): string {
  const strings = useUiStrings();
  if (column.direction === 'item') return strings.relationItem;
  const source = getTextValue(column.source);
  return column.direction === 'upstream'
    ? strings.upstreamOf(source)
    : strings.downstreamOf(source);
}

/**
 * One column of a relation walk: a header with its title and item count, then a `ListView` of
 * its items, each with the count of items further along its side. In a side column a press or the
 * arrow keys choose an item (single selection that follows focus); the start item's column only
 * shows it.
 */
export function RelationColumnView<T extends { id: Key }>({
  column,
  context,
}: RelationColumnViewProps<T>) {
  const strings = useUiStrings();
  const titleId = useId();
  const title = useColumnTitle(column, context.getTextValue);
  const { direction } = column;
  const isSide = direction !== 'item';
  return (
    <div
      role="group"
      {...hooks.slot('column', { direction, depth: column.depth })}
      aria-labelledby={titleId}
    >
      <div {...hooks.slot('column-header')}>
        <span id={titleId} {...hooks.slot('column-title')}>
          {title}
        </span>{' '}
        <Count
          count={column.items.length}
          text={strings.itemCount(column.items.length)}
          slot="column-count"
        />
      </div>
      <ListView
        aria-labelledby={titleId}
        className={hooks.slotClass('list')}
        items={column.items}
        dependencies={[context.getRelated, context.getTextValue, context.renderItem]}
        selectionMode={isSide ? 'single' : 'none'}
        selectionBehavior="replace"
        disallowEmptySelection
        selectedKeys={column.selectedKey === null ? [] : [column.selectedKey]}
        onSelectionChange={(keys) => {
          const [key] = keys === 'all' ? [] : [...keys];
          if (key !== undefined) context.onSelect(column, key);
        }}
        onAction={isSide ? context.onAction : undefined}
        renderEmptyState={() => (
          <EmptyState
            className={hooks.slotClass('empty')}
            size="sm"
            description={direction === 'upstream' ? strings.noUpstream : strings.noDownstream}
          />
        )}
      >
        {(item) => {
          const further = isSide ? context.getRelated(item, direction).length : 0;
          return (
            <ListViewItem
              id={item.id}
              className={hooks.slotClass('item')}
              textValue={context.getTextValue(item)}
              title={context.renderItem?.(item) ?? context.getTextValue(item)}
              meta={
                isSide ? (
                  <Count
                    count={further}
                    text={strings.relatedCount(further, direction)}
                    slot="item-count"
                  />
                ) : undefined
              }
            />
          );
        }}
      </ListView>
    </div>
  );
}
