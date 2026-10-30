import { FilterGlyph } from '../../core/glyphs.js';
import {
  CheckboxContext,
  CheckboxFieldContext,
  DialogTrigger,
  Provider,
  useLocale,
} from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { ChoiceGroup, Choice } from '../choice-group/choice-group.js';
import { DateTimeField, type DateRangeValue } from '../date-time-field/date-time-field.js';
import { Modal } from '../modal/modal.js';
import { NumberField } from '../number-field/number-field.js';
import { TextField } from '../text-field/text-field.js';
import {
  listFilterOptions,
  type TableColumnFilterValue,
  type TableNumberRange,
} from './table-filters.js';
import { tableHooks as hooks } from './table-hooks.js';
import type { TableColumn, TableRow } from './table-rows.js';

/** One column's filter: its value, where to report a new one, and the rows that list options. */
interface TableColumnFilterProps<T extends TableRow> {
  column: TableColumn<T>;
  /** The column's accessible name. */
  label: string;
  value: TableColumnFilterValue | undefined;
  /** Reports the new value, or null to clear the filter. */
  onChange: (value: TableColumnFilterValue | null) => void;
  /** Every row given to the table, from which a `set` filter lists its values. */
  rows: readonly T[];
}

function isRange(
  value: TableColumnFilterValue | undefined,
): value is TableNumberRange | DateRangeValue {
  return typeof value === 'object' && !Array.isArray(value);
}

function toRange(value: TableColumnFilterValue | undefined): TableNumberRange {
  return isRange(value) && !('start' in value) ? value : {};
}

function toDateRange(value: TableColumnFilterValue | undefined): DateRangeValue | null {
  return isRange(value) && 'start' in value ? value : null;
}

/** Two bounds for a `number` filter; either may stay empty. */
function NumberRangeFields<T extends TableRow>({ value, onChange }: TableColumnFilterProps<T>) {
  const strings = useUiStrings();
  const range = toRange(value);
  const min = range.min ?? null;
  const max = range.max ?? null;
  return (
    <>
      <NumberField
        label={strings.rangeFrom}
        value={min}
        committedValue={min}
        onChange={(next) => onChange({ ...range, min: next })}
      />
      <NumberField
        label={strings.rangeTo}
        value={max}
        committedValue={max}
        onChange={(next) => onChange({ ...range, max: next })}
      />
    </>
  );
}

/** The field a column's filter type edits its value with. */
function TableFilterField<T extends TableRow>(props: TableColumnFilterProps<T>) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const { column, label, value, onChange } = props;
  switch (column.filter?.type) {
    case 'number':
      return <NumberRangeFields {...props} />;
    case 'date': {
      const range = toDateRange(value);
      return (
        <DateTimeField
          mode="date-range"
          label={label}
          value={range}
          committedValue={range}
          onChange={(next) => onChange(next)}
        />
      );
    }
    case 'set': {
      const ticked = Array.isArray(value) ? [...value] : [];
      const options = listFilterOptions(props.rows, column, locale).map((option) => ({
        value: option,
        label: option,
      }));
      return (
        <ChoiceGroup
          selectionMode="multiple"
          label={label}
          value={ticked}
          committedValue={ticked}
          onChange={onChange}
        >
          {options.map((option) => (
            <Choice key={option.value} value={option.value}>
              {option.label}
            </Choice>
          ))}
        </ChoiceGroup>
      );
    }
    default: {
      const text = typeof value === 'string' ? value : '';
      return (
        <TextField
          label={strings.contains}
          value={text}
          committedValue={text}
          onChange={onChange}
        />
      );
    }
  }
}

/**
 * A column header's filter button, which opens a popover holding the field of the column's filter
 * type and a button that clears it. The rows follow each change as it is made.
 */
export function TableColumnFilter<T extends TableRow>(props: TableColumnFilterProps<T>) {
  const strings = useUiStrings();
  const title = strings.filterLabel(props.label);
  return (
    <DialogTrigger>
      <Button
        icon={FilterGlyph}
        label={title}
        size="xs"
        excludeFromTabOrder
        className={hooks.slotClass('column-filter')}
      />
      <Modal
        title={title}
        placement="bottom start"
        size="sm"
        isDismissable
        className={hooks.slotClass('column-filter-dialog')}
        actions={
          <Button variant="ghost" size="sm" onPress={() => props.onChange(null)}>
            {strings.clearFilter}
          </Button>
        }
      >
        {/* The header row slots its select-all checkbox; checkboxes in the dialog are free. */}
        <Provider
          values={[
            [CheckboxContext, null],
            [CheckboxFieldContext, null],
          ]}
        >
          <TableFilterField {...props} />
        </Provider>
      </Modal>
    </DialogTrigger>
  );
}
