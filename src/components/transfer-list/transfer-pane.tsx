import { useId, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { Key, Selection } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { IconSource } from '../icon/icon.js';
import { ListView, ListViewItem } from '../list-row/list-row.js';
import { SearchField } from '../search-field/search-field.js';
import type { TransferDrop } from './transfer-moves.js';

/** An item a transfer list moves between its sides. */
export interface TransferListItem {
  /** Unique among the items. */
  id: Key;
  /** The row's title, its accessible name and the text a side's filter matches. */
  label: string;
  /** Secondary text below the title. */
  description?: string | undefined;
  /** An imported icon component or rendered element before the title. */
  icon?: IconSource | undefined;
}

/** Which side of a transfer list: the items not chosen, or the chosen ones. */
export type TransferListSide = 'available' | 'chosen';

interface TransferPaneProps {
  side: TransferListSide;
  label: string;
  /** Every item on this side, before filtering. */
  total: number;
  /** The items this side shows through its filter. */
  items: readonly TransferListItem[];
  selected: ReadonlySet<Key>;
  onSelectionChange: (keys: Selection) => void;
  /** Moves the actioned row, or the selection holding it, to the other side. */
  onAction: (key: Key) => void;
  filterText: string;
  onFilterTextChange: (text: string) => void;
  disabledKeys: ReadonlySet<Key>;
  isDisabled: boolean;
  /** Reorders the side's rows by drag and drop, when set. */
  onReorder?: ((drop: TransferDrop) => void) | undefined;
  /** Controls under the side's header, such as the reorder buttons. */
  tools?: ReactNode;
}

const hooks = createHooks('transfer-list', [
  'pane',
  'header',
  'title',
  'count',
  'search',
  'list',
  'empty',
]);

/**
 * One side of a transfer list: its title and counts, its filter and its rows on a `ListView`, where
 * a press selects, Shift and Ctrl or Cmd extend the selection, and a double click or Enter moves.
 */
export function TransferPane({
  side,
  label,
  total,
  items,
  selected,
  onSelectionChange,
  onAction,
  filterText,
  onFilterTextChange,
  disabledKeys,
  isDisabled,
  onReorder,
  tools,
}: TransferPaneProps) {
  const strings = useUiStrings();
  const titleId = useId();
  const countId = useId();
  const count =
    selected.size > 0
      ? `${strings.itemCount(total)}, ${strings.selectedCount(selected.size)}`
      : strings.itemCount(total);
  return (
    <div {...hooks.slot('pane', { side })}>
      <div {...hooks.slot('header')}>
        <span {...hooks.slot('title')} id={titleId}>
          {label}
        </span>
        <span {...hooks.slot('count')} id={countId}>
          {count}
        </span>
      </div>
      {tools}
      <SearchField
        className={hooks.slotClass('search')}
        label={strings.filterLabel(label)}
        placeholder={strings.filterLabel(label)}
        size="sm"
        value={filterText}
        onChange={onFilterTextChange}
        isDisabled={isDisabled}
      />
      <ListView
        className={hooks.slotClass('list')}
        aria-labelledby={titleId}
        aria-describedby={countId}
        items={items}
        selectionMode="multiple"
        selectionBehavior="replace"
        selectedKeys={selected}
        onSelectionChange={onSelectionChange}
        disabledKeys={disabledKeys}
        onAction={onAction}
        reorder={onReorder ? { onMove: onReorder } : undefined}
        renderEmptyState={() => (
          <span {...hooks.slot('empty')}>
            {filterText.trim() ? strings.noResults : strings.noItems}
          </span>
        )}
      >
        {(item) => (
          <ListViewItem
            id={item.id}
            title={item.label}
            meta={item.description}
            icon={item.icon}
            textValue={item.label}
          />
        )}
      </ListView>
    </div>
  );
}
