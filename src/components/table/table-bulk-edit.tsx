import { useState } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { ActionRow, type ActionRowAction } from '../action-row/action-row.js';
import { BooleanField } from '../boolean-field/boolean-field.js';
import { DateTimeField } from '../date-time-field/date-time-field.js';
import { Modal } from '../modal/modal.js';
import { NumberField } from '../number-field/number-field.js';
import { SelectField } from '../select-field/select-field.js';
import { TextField } from '../text-field/text-field.js';
import { getColumnText } from './table-column.js';
import { tableHooks as hooks } from './table-hooks.js';
import {
  getCellValue,
  type TableCellValue,
  type TableColumn,
  type TableRow,
} from './table-rows.js';
import type { TableCellEdit } from './use-cell-editing.js';

/**
 * How a bulk edit sets a column across the selected rows: a text, number, date (`YYYY-MM-DD`) or
 * boolean field, or a choice of `options`.
 */
export type TableBulkEdit =
  | { type: 'text' | 'number' | 'date' | 'boolean' }
  | { type: 'choice'; options: readonly string[] };

export interface TableSelectionBarProps<T> {
  /** The caller's bulk actions. */
  actions: readonly ActionRowAction[];
  /** The drawn data columns; those with `bulkEdit` can be set. */
  columns: readonly TableColumn<T>[];
  /** The selected rows the table presents. */
  rows: readonly T[];
  onClearSelection: () => void;
  /** Reports the edits a bulk edit makes, in one batch. */
  onEdit: (edits: readonly TableCellEdit<T>[]) => void;
}

interface BulkEditFieldProps {
  edit: TableBulkEdit;
  label: string;
  value: TableCellValue;
  onChange: (value: TableCellValue) => void;
}

/** The value a bulk edit field starts at: empty text, false, or nothing chosen yet. */
function getInitialValue(edit: TableBulkEdit | undefined): TableCellValue {
  if (edit?.type === 'text') return '';
  return edit?.type === 'boolean' ? false : null;
}

/** The field of a bulk-editable column's type, holding the value to set. */
function BulkEditField({ edit, label, value, onChange }: BulkEditFieldProps) {
  switch (edit.type) {
    case 'number': {
      const number = typeof value === 'number' ? value : null;
      return (
        <NumberField label={label} value={number} committedValue={number} onChange={onChange} />
      );
    }
    case 'date': {
      const date = typeof value === 'string' ? value : null;
      return <DateTimeField label={label} value={date} committedValue={date} onChange={onChange} />;
    }
    case 'boolean':
      return (
        <BooleanField
          label={label}
          value={value === true}
          committedValue={false}
          onChange={onChange}
        />
      );
    case 'choice': {
      const chosen = typeof value === 'string' ? value : null;
      return (
        <SelectField
          label={label}
          options={edit.options.map((option) => ({ id: option, label: option }))}
          value={chosen}
          committedValue={null}
          onChange={(next: Key | null) => onChange(next === null ? null : String(next))}
        />
      );
    }
    default: {
      const text = typeof value === 'string' ? value : '';
      return <TextField label={label} value={text} committedValue="" onChange={onChange} />;
    }
  }
}

/** The edits that set `value` in one column of each row, skipping refused and unchanged values. */
function createBulkEdits<T extends TableRow>(
  rows: readonly T[],
  column: TableColumn<T>,
  value: TableCellValue,
): TableCellEdit<T>[] {
  return rows.flatMap((row) => {
    const isRefused = (column.validateValue?.(value, row) ?? null) !== null;
    if (isRefused || Object.is(getCellValue(row, column), value)) return [];
    return [{ row, columnId: column.id, value }];
  });
}

/** The bulk edit dialog: a choice of column, the field of its type and Apply. */
function TableBulkEditDialog<T extends TableRow>(
  props: Omit<TableSelectionBarProps<T>, 'actions' | 'onClearSelection'> & {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
  },
) {
  const strings = useUiStrings();
  const columns = props.columns.filter((column) => column.bulkEdit !== undefined);
  const [columnId, setColumnId] = useState(columns[0]?.id ?? null);
  const column = columns.find((candidate) => candidate.id === columnId);
  const [value, setValue] = useState(getInitialValue(column?.bulkEdit));
  return (
    <Modal
      className={hooks.slotClass('bulk-edit')}
      title={strings.editRows(props.rows.length)}
      size="sm"
      isOpen={props.isOpen}
      onOpenChange={props.onOpenChange}
      primaryAction={{
        label: strings.apply,
        isDisabled: !column,
        onPress: (close) => {
          if (column) props.onEdit(createBulkEdits(props.rows, column, value));
          close();
        },
      }}
    >
      <SelectField
        label={strings.field}
        options={columns.map((candidate) => ({
          id: candidate.id,
          label: getColumnText(candidate),
        }))}
        value={columnId}
        committedValue={columnId}
        onChange={(next: Key | null) => {
          const id = next === null ? null : String(next);
          setColumnId(id);
          setValue(getInitialValue(columns.find((candidate) => candidate.id === id)?.bulkEdit));
        }}
      />
      {column?.bulkEdit ? (
        <BulkEditField
          key={column.id}
          edit={column.bulkEdit}
          label={getColumnText(column)}
          value={value}
          onChange={setValue}
        />
      ) : null}
    </Modal>
  );
}

/**
 * The selection bar above the grid while rows are selected: the selected count, a button that
 * clears the selection, the caller's bulk actions and, when a drawn column has `bulkEdit`, an
 * action that opens the bulk edit of the selected rows.
 */
export function TableSelectionBar<T extends TableRow>(props: TableSelectionBarProps<T>) {
  const strings = useUiStrings();
  const [isOpen, setOpen] = useState(false);
  // A new key per opening starts the dialog's fields afresh.
  const [opening, setOpening] = useState(0);
  const canEdit = props.columns.some((column) => column.bulkEdit !== undefined);
  const editAction: ActionRowAction = {
    verb: 'edit',
    label: strings.editSelected,
    onPress: () => {
      setOpening((count) => count + 1);
      setOpen(true);
    },
  };
  return (
    <>
      <ActionRow
        className={hooks.slotClass('selection-bar')}
        actions={canEdit ? [...props.actions, editAction] : props.actions}
        selectedCount={props.rows.length}
        onClearSelection={props.onClearSelection}
        size="sm"
      />
      {canEdit ? (
        <TableBulkEditDialog
          key={opening}
          columns={props.columns}
          rows={props.rows}
          onEdit={props.onEdit}
          isOpen={isOpen}
          onOpenChange={setOpen}
        />
      ) : null}
    </>
  );
}
