import { useMemo } from 'react';
import { useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps, ExpansionProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { pivot, type PivotLayout, type PivotRecord, type PivotRow } from '../../utils/pivot.js';
import { Table } from '../table/table.js';
import { createPivotColumns, type PivotTableField, type PivotTableRow } from './pivot-columns.js';
import { PivotFieldChooser } from './pivot-field-chooser.js';
import { pivotTableHooks as hooks } from './pivot-table-hooks.js';

export type { PivotTableField } from './pivot-columns.js';

export interface PivotTableProps extends BaseProps, AriaLabellingProps, ExpansionProps {
  /** The records to pivot, as plain data. */
  records: readonly PivotRecord[];
  /** The fields the table offers: their labels, formats and the chooser's cards. */
  fields: readonly PivotTableField[];
  /** The row fields, column fields and values, controlled. */
  layout?: PivotLayout | undefined;
  /** The row fields, column fields and values at first, uncontrolled. */
  defaultLayout?: PivotLayout | undefined;
  /** Called with the layout after each change in the field chooser. */
  onLayoutChange?: ((layout: PivotLayout) => void) | undefined;
  /** Draws the field chooser above the table. */
  fieldChooser?: boolean | undefined;
}

const emptyLayout: PivotLayout = { rows: [], columns: [], values: [] };

// The table encodes its row keys itself, so group keys that hold spaces stay distinct.
function toTableRow(group: PivotRow, order: number): PivotTableRow {
  return { id: group.key, group, order };
}

/**
 * A pivot of plain records: rows grouped by row fields in expandable groups, columns by column
 * fields, cells aggregating value fields, with row and column totals and sortable columns, drawn
 * as a `Table`. An optional field chooser moves fields between rows, columns and values.
 */
export function PivotTable({
  records,
  fields,
  layout,
  defaultLayout,
  onLayoutChange,
  fieldChooser = false,
  expandedKeys,
  defaultExpandedKeys,
  onExpandedChange,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-details': ariaDetails,
  ...rest
}: PivotTableProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const [current, setCurrent] = useControllableState(
    layout,
    defaultLayout ?? emptyLayout,
    onLayoutChange,
  );
  const result = useMemo(() => pivot(records, current), [records, current]);
  const { columns, groups } = createPivotColumns({
    result,
    layout: current,
    fields,
    strings,
    locale,
  });
  const rows: PivotTableRow[] =
    current.rows.length > 0
      ? result.rows.map(toTableRow)
      : [{ id: 'total', group: null, order: 0 }];
  return (
    <div {...hooks.root({ className, props: rest })} id={id}>
      {fieldChooser ? (
        <PivotFieldChooser fields={fields} layout={current} onLayoutChange={setCurrent} />
      ) : null}
      <Table
        className={hooks.slotClass('table')}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-details={ariaDetails}
        columns={columns}
        columnGroups={groups}
        rows={rows}
        getChildRows={
          current.rows.length > 1 ? (row) => row.group?.children.map(toTableRow) : undefined
        }
        expandedKeys={expandedKeys}
        defaultExpandedKeys={defaultExpandedKeys}
        onExpandedChange={onExpandedChange}
      />
    </div>
  );
}
