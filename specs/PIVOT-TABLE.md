# Pivot Table

`PivotTable` summarizes plain records in a grid: rows grouped by one or more row fields in expandable groups, columns by column fields, and cells aggregating value fields (sum, count, minimum, maximum, average or a caller function), with row and column totals and sortable columns. It draws a [Table](TABLE.md) with nested rows, column groups and a summary row, and offers a field chooser built on [Board](BOARD.md) that moves fields between rows, columns and values. The pure `pivot` function computes the result and is exported for hosts.

## UIC-PIVOT-TABLE-1 - Pivot

### UIC-PIVOT-TABLE-1.1 - Groups

`pivot(records, layout)` shall group the records by the layout's row fields into nested row groups (`PivotRow`), outermost first, each with its `key` (its path as JSON), its `field`, its `value` in that field, its `path` of values and the groups of the next row field as `children`; and list the columns (`PivotColumn`) as every combination of the column fields' values the records hold, each with its `key` (its path as JSON) and `path`, or one column with an empty path without column fields. A record's value in a field is its key: a string, finite number or boolean as it is, an empty value (missing, `null` or `''`) as `null`, anything else (`NaN` and infinite numbers included) as text. Keys order numbers by value, `false` before `true`, text naturally ignoring case, and `null` last.

Implementation: `src/utils/pivot.ts`
Verification: `src/utils/pivot.test.ts`

### UIC-PIVOT-TABLE-1.2 - Aggregation

Each value (`PivotValue`) of the layout shall aggregate its `field` over a set of records by its `aggregate`, `sum` by default: `count` counts the non-empty values, `sum`, `min`, `max` and `average` read the finite numbers and give `null` without one, and a function receives every value of the field (empty ones included) and returns a number or `null`. Aggregates (`PivotAggregates`) list one number or `null` per value, in layout order.

Built-in numeric aggregates shall not depend on the runtime limit on function arguments.

Implementation: `src/utils/summarize-numbers.ts`, `src/utils/pivot.ts`
Verification: `src/utils/pivot.test.ts`

### UIC-PIVOT-TABLE-1.3 - Totals

A row group shall hold its aggregates per column key in `cells` (no entry for a column it has no record in) and over all its records in `total`; the result holds the aggregates of every record per column key in `totals` and over all records in `grandTotal`. Every total aggregates the records it covers, never the aggregates of its parts, so averages, minimums and custom functions total correctly.

Implementation: `src/utils/pivot.ts`
Verification: `src/utils/pivot.test.ts`

## UIC-PIVOT-TABLE-2 - Table

### UIC-PIVOT-TABLE-2.1 - Structure

`PivotTable` shall pivot `records` by its layout and render a root `ui-pivot-table` holding the field chooser (UIC-PIVOT-TABLE-3.2) when `fieldChooser` is set, then a `Table` (`ui-pivot-table__table`) taking the caller's labelling props. The table's first column is the row header column, headed by the row fields' labels joined with `/`, or the provider's `pivotRows` string without row fields; then one column per pivot column and value, aligned to the end; then, with column fields, one row total column per value.

Implementation: `src/components/pivot-table/pivot-table.tsx`, `src/components/pivot-table/pivot-columns.tsx`, `src/core/analysis-strings.ts`
Verification: `src/components/pivot-table/pivot-table.test.tsx`, `e2e/pivot-table.spec.ts`

### UIC-PIVOT-TABLE-2.2 - Headers

A key shall read as its field's `formatKey(key)`, else as text, and a `null` key as the provider's `pivotEmptyKey` string; a pivot column's label joins its keys with `/`. A value's label is its `label`, else the provider's `pivotValueLabel` string with the aggregation's `pivotAggregate` name and the field's label (`Sum of Boxes`), else, for a function, the field's label. With several values, each pivot column's value columns are headed by the values' labels under a column group headed by the column's label, and the row totals by the values' labels under a group headed by the `pivotTotal` string; with one value and column fields, each column is headed by its label under one group headed by the value's label, and the row total by `pivotTotal`; without column fields, the value columns are headed by the values' labels.

Implementation: `src/components/pivot-table/pivot-columns.tsx`, `src/core/analysis-strings.ts`
Verification: `src/components/pivot-table/pivot-table.test.tsx`, `e2e/pivot-table.spec.ts`

### UIC-PIVOT-TABLE-2.3 - Cells

Each row header cell shall hold a `ui-pivot-table__key` with the group's key, and each value cell a `ui-pivot-table__value` with its aggregate formatted by `Intl.NumberFormat` in the provider's locale, with the field's `formatOptions` except for counts, or nothing for `null` or a column the group has no record in. Total cells publish `data-total`.

Implementation: `src/components/pivot-table/pivot-columns.tsx`
Verification: `src/components/pivot-table/pivot-table.test.tsx`, `e2e/pivot-table.spec.ts`

### UIC-PIVOT-TABLE-2.4 - Totals

With row fields, the table's summary row shall read the `pivotTotal` string in the row header column (a `ui-pivot-table__key` with `data-total`) and hold each column's total and the grand totals. Without row fields, the table holds one row reading `pivotTotal` with the column totals and the grand totals, and no summary row.

Implementation: `src/components/pivot-table/pivot-table.tsx`, `src/components/pivot-table/pivot-columns.tsx`
Verification: `src/components/pivot-table/pivot-table.test.tsx`, `e2e/pivot-table.spec.ts`

### UIC-PIVOT-TABLE-2.5 - Expandable row groups

With several row fields, each group of an outer field shall be a nested table row holding its inner groups ([UIC-TABLE-9.1](TABLE.md#uic-table-91---nested-rows)), collapsed at first, expanded from its expand button or the arrow keys. The expanded groups, keyed by their `key`, are `expandedKeys` (controlled) or held by the table from `defaultExpandedKeys`, and every change calls `onExpandedChange`.

Implementation: `src/components/pivot-table/pivot-table.tsx`
Verification: `src/components/pivot-table/pivot-table.test.tsx`, `e2e/pivot-table.spec.ts`

### UIC-PIVOT-TABLE-2.6 - Sorting

Every column shall sort on a header press (the table's own sort, ascending, descending, then unsorted), at every level of the row groups: the row header column in the order of the keys (UIC-PIVOT-TABLE-1.1), a value column by its aggregates. Unsorted, groups keep the order of their keys.

Implementation: `src/components/pivot-table/pivot-columns.tsx`
Verification: `src/components/pivot-table/pivot-table.test.tsx`, `e2e/pivot-table.spec.ts`

## UIC-PIVOT-TABLE-3 - Field chooser

### UIC-PIVOT-TABLE-3.1 - Layout

The row fields, column fields and values (`PivotLayout`) shall be `layout` (controlled) or held by the table from `defaultLayout` (uncontrolled, empty by default), and every change in the field chooser calls `onLayoutChange` with the new layout. `fields` lists the fields the table offers with their `label`; a layout field missing from it reads as its id.

Implementation: `src/components/pivot-table/pivot-table.tsx`, `src/components/pivot-table/pivot-fields.ts`
Verification: `src/components/pivot-table/pivot-fields.test.ts`, `src/components/pivot-table/pivot-table.test.tsx`

### UIC-PIVOT-TABLE-3.2 - Zones and cards

The field chooser shall be a `Board` (`ui-pivot-table__chooser`) named by the provider's `pivotFieldChooser` string, with four columns titled by the `pivotFields`, `pivotRows`, `pivotColumns` and `pivotValues` strings: the offered fields the layout does not use, the row fields and the column fields in layout order, and one card per value in order. A card holds a `ui-pivot-table__field` publishing its zone as `data-zone`, with a `ui-pivot-table__field-label` reading the field's label; a zone without cards reads the `pivotNoFields` string.

Each card shall have a unique internal key, including repeated fields and field ids that resemble generated keys, so moving a repeated field never moves a different card.

Implementation: `src/components/pivot-table/pivot-field-chooser.tsx`, `src/components/pivot-table/pivot-fields.ts`, `src/core/analysis-strings.ts`
Verification: `src/components/pivot-table/pivot-fields.test.ts`, `src/components/pivot-table/pivot-table.test.tsx`, `e2e/pivot-table.spec.ts`

### UIC-PIVOT-TABLE-3.3 - Moving fields

A card shall move within and between zones by drag and drop or Alt+Arrow keys ([UIC-BOARD-2](BOARD.md#uic-board-2---card-moves)), landing beside the card it is dropped on. A field landing in the values becomes a value aggregating by the field's `aggregate` (`count` by default); a value landing in the rows or columns becomes that field unless the zone holds it already; a card landing in the fields zone leaves the layout.

Implementation: `src/components/pivot-table/pivot-field-chooser.tsx`, `src/components/pivot-table/pivot-fields.ts`
Verification: `src/components/pivot-table/pivot-fields.test.ts`, `src/components/pivot-table/pivot-table.test.tsx`, `e2e/pivot-table.spec.ts`

### UIC-PIVOT-TABLE-3.4 - Aggregation picker

A value's card shall hold a [Select Field](SELECT-FIELD.md) (`ui-pivot-table__aggregate`) named by the provider's `pivotAggregationOf` string with the field's label, offering the five built-in aggregations by their `pivotAggregate` names; choosing one sets the value's aggregation. A value aggregating by a function has no picker.

Implementation: `src/components/pivot-table/pivot-field-chooser.tsx`, `src/components/pivot-table/pivot-fields.ts`
Verification: `src/components/pivot-table/pivot-fields.test.ts`, `src/components/pivot-table/pivot-table.test.tsx`, `e2e/pivot-table.spec.ts`

## UIC-PIVOT-TABLE-4 - Accessibility

### UIC-PIVOT-TABLE-4.1 - Hooks and caller attributes

`PivotTable` shall carry the hooks below, append the caller's `className`, forward `id` and caller `data-*` attributes to its root, and its labelling props to the table, which keeps the Table's grid semantics: the row header column names each row, and nested groups carry their level and expanded state.

Implementation: `src/components/pivot-table/pivot-table.tsx`, `labs/reference/pivot-table.css`
Verification: `src/components/pivot-table/pivot-table.test.tsx`, `e2e/pivot-table.spec.ts`

## Hooks

| Hook                          | Kind  | Values                                | Description                                                 |
| ----------------------------- | ----- | ------------------------------------- | ----------------------------------------------------------- |
| `ui-pivot-table`              | root  |                                       | The element holding the field chooser and the table.        |
| `ui-pivot-table__chooser`     | slot  |                                       | The field chooser (also `ui-board`).                        |
| `ui-pivot-table__field`       | slot  |                                       | A field card's content.                                     |
| `ui-pivot-table__field-label` | slot  |                                       | A field card's label.                                       |
| `ui-pivot-table__aggregate`   | slot  |                                       | A value card's aggregation picker (also `ui-select-field`). |
| `ui-pivot-table__table`       | slot  |                                       | The table (also `ui-table`).                                |
| `ui-pivot-table__key`         | slot  |                                       | A row group's key, or the totals' heading, in a row header. |
| `ui-pivot-table__value`       | slot  |                                       | An aggregate in a value cell.                               |
| `data-zone`                   | state | `fields`, `rows`, `columns`, `values` | On a field card's content: the zone it is in.               |
| `data-total`                  | state | `true`                                | On a key or value of the totals.                            |
