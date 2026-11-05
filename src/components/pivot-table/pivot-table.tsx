'use client';

import { useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps, ExpansionProps } from '../../core/events.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { pivot, type PivotLayout, type PivotRecord, type PivotRow } from '../../utils/pivot.js';
import { Table } from '../table/table.js';
import { createPivotColumns, type PivotTableField, type PivotTableRow } from './pivot-columns.js';
import { PivotFieldChooser } from './pivot-field-chooser.js';
import { pivotTableHooks as hooks } from './pivot-table-hooks.js';

export type { PivotTableField } from './pivot-columns.js';

export interface PivotTableProps
  extends BaseProps, AriaLabellingProps, ExpansionProps, RefProps<HTMLDivElement> {
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
  /** Renders only the rows in view, for many row groups; the stylesheet must bound the table's height. */
  virtualized?: boolean | undefined;
  /** Row height in pixels for a virtualized table. Defaults to the table's. */
  rowHeight?: number | undefined;
}

const emptyLayout: PivotLayout = { rows: [], columns: [], values: [] };

// The table encodes its row keys itself, so group keys that hold spaces stay distinct.
function toTableRow(group: PivotRow, order: number): PivotTableRow {
  return { id: group.key, group, order };
}

/** A group's child rows, the same array for a group each time it is asked; nothing when flat. */
function useChildRows(isNested: boolean) {
  return useMemo(() => {
    if (!isNested) return undefined;
    const known = new WeakMap<PivotRow, PivotTableRow[]>();
    return ({ group }: PivotTableRow) => {
      if (!group) return undefined;
      const rows = known.get(group) ?? group.children.map(toTableRow);
      known.set(group, rows);
      return rows;
    };
  }, [isNested]);
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
  virtualized,
  rowHeight,
  expandedKeys,
  defaultExpandedKeys,
  onExpandedChange,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-details': ariaDetails,
  ref,
  ...rest
}: PivotTableProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const [current, setCurrent] = useControllableState(
    layout,
    defaultLayout ?? emptyLayout,
    onLayoutChange,
  );
  const result = useMemo(() => pivot(records, current, locale), [records, current, locale]);
  const { columns, groups } = useMemo(
    () => createPivotColumns({ result, layout: current, fields, strings, locale }),
    [result, current, fields, strings, locale],
  );
  const isGrouped = current.rows.length > 0;
  const rows = useMemo<PivotTableRow[]>(
    () => (isGrouped ? result.rows.map(toTableRow) : [{ id: 'total', group: null, order: 0 }]),
    [result, isGrouped],
  );
  const getChildRows = useChildRows(current.rows.length > 1);
  return (
    <div {...hooks.root({ className, props: rest })} id={id} ref={ref}>
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
        getChildRows={getChildRows}
        expandedKeys={expandedKeys}
        defaultExpandedKeys={defaultExpandedKeys}
        onExpandedChange={onExpandedChange}
        virtualized={virtualized}
        rowHeight={rowHeight}
      />
    </div>
  );
}
