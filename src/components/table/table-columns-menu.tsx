'use client';

import type { Selection } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { getColumnText } from './table-columns.js';
import { tableHooks as hooks } from './table-hooks.js';
import type { TableColumn } from './table-rows.js';

interface TableColumnsMenuProps<T> {
  /** Every column, in layout order. */
  columns: readonly TableColumn<T>[];
  hidden: readonly string[];
  onHiddenChange: (hidden: readonly string[]) => void;
}

/** The hidden columns after a change to the shown hideable ones; others stay as they were. */
function toHidden<T>(
  hideable: readonly TableColumn<T>[],
  hidden: readonly string[],
  shown: Selection,
): string[] {
  const isHideable = (id: string) => hideable.some((column) => column.id === id);
  const isShown = (id: string) => shown === 'all' || shown.has(id);
  return [
    ...hidden.filter((id) => !isHideable(id)),
    ...hideable.filter((column) => !isShown(column.id)).map((column) => column.id),
  ];
}

/**
 * The columns menu: a checkable item per column that allows hiding, ticked while it is shown. The
 * menu stays open while columns are toggled.
 */
export function TableColumnsMenu<T>({ columns, hidden, onHiddenChange }: TableColumnsMenuProps<T>) {
  const strings = useUiStrings();
  const hideable = columns.filter((column) => column.allowsHiding);
  return (
    <DropdownMenu
      label={strings.columns}
      size="sm"
      className={hooks.slotClass('columns-menu')}
      items={hideable.map((column) => ({ id: column.id, label: getColumnText(column) }))}
      selectionMode="multiple"
      selectedKeys={hideable
        .filter((column) => !hidden.includes(column.id))
        .map((column) => column.id)}
      shouldCloseOnSelect={false}
      onSelectionChange={(shown) => onHiddenChange(toHidden(hideable, hidden, shown))}
    />
  );
}
