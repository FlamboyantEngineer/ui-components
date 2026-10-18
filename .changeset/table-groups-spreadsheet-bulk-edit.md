---
'@flamboyantengineer/ui-components': minor
---

Add row groups, a spreadsheet mode and bulk edit to `Table`.

- Row groups: `groupBy` (column ids or computed `TableGrouping`s, nested level by level), `renderGroupLabel`, `collapsedGroups` / `defaultCollapsedGroups` / `onCollapsedGroupsChange`, and a column `aggregate` (`sum`, `count`, `min`, `max` or a function of the group's rows). Group header rows collapse from their expand button or ArrowLeft and ArrowRight, follow the sort and work with selection, pagination and virtualization; rows do not reorder while grouped. Hooks: `__group-row`, `__group-cell`, `__group-label`, `__group-count`, `__aggregate-cell`.
- Spreadsheet mode: `cellSelection` (`none`, `cell`, `range`), `selectedRange` / `defaultSelectedRange` / `onSelectedRangeChange` and `onCellsChange` for batches. Ranges by Shift with arrow keys or a press, or by dragging; copy as tab-separated text and HTML; paste tab-separated text; Delete to clear; a fill handle and Control or Command with D and R to fill down and right; typing opens the editor; Enter and Tab commit and move. Columns read and check values with `parseValue` and `validateValue`; the default editor shows a refused value's message. Hooks: `__fill-handle`, `__editor-message`, `data-in-range`, `data-range-top`, `data-range-bottom`, `data-range-start`, `data-range-end`, `data-fill-target`, `data-invalid`.
- Selection bar and bulk edit: `selectionActions` draws an Action Row selection bar while rows are selected; a column `bulkEdit` (`text`, `number`, `date`, `boolean` or `choice` with `options`) adds an action that sets that column across the selected rows in one `onCellsChange` batch. Hooks: `__selection-bar`, `__bulk-edit`.
- `formatTsv` and `parseTsv` utilities, and types `TableAggregate`, `TableBulkEdit`, `TableCellPosition`, `TableCellRange`, `TableCellSelectionMode`, `TableGroup`, `TableGroupBy`, `TableGrouping`, `TableGroupingProps` and `TableSpreadsheetProps`.
- Provider strings: `groupHeading`, `editSelected`, `editRows`, `field` and `apply`.
- F2 and Enter now also open the editor of an editable row header cell, and the table holds its selected and expanded keys itself when the caller does not control them.
