# Table

`Table` shows records a reader scans, sorts, selects and acts on. It is built on React Aria's `Table`: columns and rows are plain data with render callbacks, and the table adds sorting, filtering, selection, resizable and persisted column widths, row reordering by drag and drop or keyboard, full-width loading, empty and error notices, and virtualization for long lists. `sortTableRows` and `applyTableMove` are exported for callers that keep the order of their rows themselves.

## UIC-TABLE-1 - Columns and rows

### UIC-TABLE-1.1 - Data-driven grid

`Table` shall render React Aria's grid semantics (`grid`, `columnheader`, `row`, `rowheader` and `gridcell` roles) named by its `aria-label` or `aria-labelledby`, with one row per item in `rows`, keyed by the item's `id`, and one cell per column. A cell shows `renderCell(row)` when the column has it, else the column's value (`getValue(row)`, else the row's property named by the column `id`) as text when it is a string or a number. Content is React nodes; no HTML string is injected. The columns marked `isRowHeader`, or the first column when none is, name each row.

Implementation: `src/components/table/table.tsx`, `src/components/table/table-header.tsx`, `src/components/table/table-body.tsx`
Verification: `src/components/table/table.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-1.2 - Column hooks

Data column headers and cells shall publish `data-kind="data"`, `data-align` (`start` by default, `center` or `end` from the column's `align`) and `data-column` with the column id; the selection and actions columns and their cells publish `data-kind="selection"` and `data-kind="actions"`.

Implementation: `src/components/table/table-header.tsx`, `src/components/table/table-body.tsx`
Verification: `src/components/table/table.test.tsx`

### UIC-TABLE-1.3 - Accessible column names

Each column header shall carry its header content in `ui-table__column-label` and take its accessible name from it, or from the column's `textValue` when the header is not plain text. The actions column's label is the provider's `rowActions` string, which the stylesheet may hide visually.

Implementation: `src/components/table/table-header.tsx`, `src/core/strings.ts`
Verification: `src/components/table/table.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-1.4 - Hooks and caller attributes

`Table` shall carry the hooks below on a root element that holds the filter and the scroll area, append the caller's `className`, forward `id` and caller `data-*` attributes to that root, and pass every other React Aria table prop to the grid.

Implementation: `src/components/table/table.tsx`, `src/components/table/use-table-grid.ts`
Verification: `src/components/table/table.test.tsx`

## UIC-TABLE-2 - Sorting and filtering

### UIC-TABLE-2.1 - Sort cycle

Pressing the header of a column with `allowsSorting`, by pointer or with Enter, shall cycle its sort through ascending, descending and unsorted. The sorted header carries `aria-sort="ascending"` or `"descending"` and `data-sort-direction`; other sortable headers carry `aria-sort="none"`. `onSortChange` receives each next descriptor, or `null` for unsorted.

Implementation: `src/components/table/use-table-rows.ts`, `src/components/table/table-rows.ts`
Verification: `src/components/table/table.test.tsx`, `src/components/table/table-rows.test.ts`, `e2e/table.spec.ts`

### UIC-TABLE-2.2 - Table-owned order

Without a `sortDescriptor` prop the table shall own the sort, starting from `defaultSortDescriptor`, and order the rows itself by the sorted column's values: numbers, booleans and dates numerically, text naturally and ignoring case. Rows the column cannot separate keep their given order, each value is read once per row, and the caller's array is never modified.

Implementation: `src/components/table/use-table-rows.ts`, `src/components/table/table-rows.ts`
Verification: `src/components/table/table.test.tsx`, `src/components/table/table-rows.test.ts`

### UIC-TABLE-2.3 - Caller-owned order

With a `sortDescriptor` prop the table shall render `rows` in the order given and only report the descriptor on the header. The exported `sortTableRows` orders rows the same way the table does.

Implementation: `src/components/table/use-table-rows.ts`, `src/components/table/table-rows.ts`
Verification: `src/components/table/table.test.tsx`

### UIC-TABLE-2.4 - Sort indicator

Every sortable header shall show exactly one decorative provider glyph in `ui-table__sort-icon`: `sort-none` while unsorted, `sort-ascending` or `sort-descending` while sorted. The glyph is hidden from assistive technology, so the header keeps its label as its name.

Implementation: `src/components/table/table-header.tsx`
Verification: `src/components/table/table.test.tsx`

### UIC-TABLE-2.5 - Filtering

`filterable` shall draw a React Aria search field above the grid, named and labelled by `filterLabel` (the provider's `filterRows` string by default), that keeps the rows whose text (their string and number values in every column) contains every whitespace-separated term of the query, ignoring case. Escape or the clear button empties the query. When nothing matches, the empty notice replaces the rows.

Implementation: `src/components/table/table-filter.tsx`, `src/components/table/table-rows.ts`, `src/components/table/use-table-grid.ts`
Verification: `src/components/table/table.test.tsx`, `src/components/table/table-rows.test.ts`, `e2e/table.spec.ts`

## UIC-TABLE-3 - Selection and row actions

### UIC-TABLE-3.1 - Selection

The table shall pass React Aria's selection props through (`selectionMode` `none`, `single` or `multiple`, `selectionBehavior`, `selectedKeys`, `defaultSelectedKeys`, `disabledKeys`, `onSelectionChange`), controlled or not. Multiple selection adds a leading checkbox column whose header checkbox selects every enabled row; each checkbox draws the `check` glyph when selected, the `minus` glyph when indeterminate and nothing otherwise, and takes React Aria's localized names. Disabled rows are never selected.

Implementation: `src/components/table/table-header.tsx`, `src/components/table/table-body.tsx`
Verification: `src/components/table/table.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-3.2 - Row action

`onRowAction` shall receive the key of a row the reader activates (as React Aria defines activation for the selection mode); activating a notice row never calls it.

Implementation: `src/components/table/table.tsx`
Verification: `src/components/table/table.test.tsx`

### UIC-TABLE-3.3 - Row actions slot

`renderRowActions(row)` shall render its content in a trailing actions cell per row, in a column `actionsColumnWidth` pixels wide (44 by default). Controls in it perform their own action without selecting or activating the row.

Implementation: `src/components/table/table-header.tsx`, `src/components/table/table-body.tsx`
Verification: `src/components/table/table.test.tsx`

## UIC-TABLE-4 - Column sizing

### UIC-TABLE-4.1 - Column widths

Each data column shall size from its `width` (pixels, a percentage or an `fr` share; `1fr` by default), `minWidth` and `maxWidth` through React Aria's resizable table container, with a maximum never below the minimum and pixel widths kept inside the bounds. The selection column is 44 pixels wide and the actions column `actionsColumnWidth` pixels.

Implementation: `src/components/table/column-sizing.ts`, `src/components/table/table-header.tsx`
Verification: `src/components/table/column-sizing.test.ts`, `src/components/table/table.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-4.2 - Resizing

A column with `allowsResizing` shall draw a React Aria column resizer named `Resize <column>` (the provider's `resizeColumn` string). The reader resizes by dragging it, or from the keyboard by focusing the header, pressing ArrowRight to reach the resizer, Enter to start, the arrow keys to resize and Enter to finish, within the column's bounds. The column redraws live during the gesture, and `onColumnWidthsChange` receives the data columns' widths once when it ends.

Implementation: `src/components/table/use-column-widths.ts`, `src/components/table/table-header.tsx`
Verification: `src/components/table/use-column-widths.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-4.3 - Persisted widths

With `persistKey`, the widths a resize leaves shall be written through the provider's storage under that key and restored when the table mounts again. Stored widths of unknown columns, unusable values and unreadable data are ignored, and stored pixel widths are kept inside the column's bounds.

Implementation: `src/components/table/use-column-widths.ts`, `src/components/table/column-sizing.ts`
Verification: `src/components/table/use-column-widths.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-4.4 - Sizing helpers

The table shall size columns with small pure functions: a usable width is a positive pixel count, percentage or `fr` share; a column's maximum is never below its minimum; pixel widths are kept inside the bounds; a column renders at its usable stored width, else its declared width, else `1fr`; and only the usable widths of known columns are taken from a resize report or from storage.

Implementation: `src/components/table/column-sizing.ts`
Verification: `src/components/table/column-sizing.test.ts`

## UIC-TABLE-5 - Reordering

### UIC-TABLE-5.1 - Drag and drop

With `reorder`, the first cell of each row shall start with a React Aria drag handle (`ui-table__drag-handle`, named `Drag <row>` by React Aria). Dragging a row by pointer, or from the keyboard with Enter on its handle, the arrow keys and Enter, shall report one `reorder.onMove({ keys, targetKey, position })` with `position` `before` or `after`, while a `ui-table__drop-indicator` row marks the drop position. Drop positions that would leave the order unchanged are refused. The table never reorders its rows itself.

Implementation: `src/components/table/use-table-reorder.tsx`, `src/components/table/table-body.tsx`
Verification: `src/components/table/use-table-reorder.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-5.2 - Fixed rows

A row for which `reorder.canMove` returns false shall not move: its handle is disabled, drags starting on it are refused and Alt+Arrow keys leave it in place. Disabled rows are never dragged. Other rows may still be dropped beside it.

Implementation: `src/components/table/use-table-reorder.tsx`, `src/components/table/table-body.tsx`
Verification: `src/components/table/use-table-reorder.test.tsx`

### UIC-TABLE-5.3 - Keyboard moves

Alt+ArrowUp and Alt+ArrowDown with focus on a movable row, or inside it, shall report a move of that row before the previous row or after the next one. At either end the keys are claimed and nothing moves.

Implementation: `src/components/table/use-table-reorder.tsx`
Verification: `src/components/table/use-table-reorder.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-5.4 - Move helper

`applyTableMove(rows, move)` shall return a copy of `rows` with the moved rows, in their current order, placed before or after the target, leaving the input unchanged.

Implementation: `src/components/table/table-rows.ts`
Verification: `src/components/table/table-rows.test.ts`

## UIC-TABLE-6 - Notices

### UIC-TABLE-6.1 - Notice row

While loading, empty or failed, the table shall replace its rows with one full-width row (`ui-table__state-row` with `data-variant`) whose cell spans every column, including the selection and actions columns, while the headers and the table's name stay. An error wins over loading, and loading over empty. The notice row can take focus, so its controls stay reachable, but it is never selected, dragged or passed to `onRowAction`. A table without data columns draws no selection or actions column and no rows, rather than failing.

Implementation: `src/components/table/table-body.tsx`, `src/components/table/use-table-grid.ts`
Verification: `src/components/table/table-body.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-6.2 - Loading

`isLoading` shall show the library's loading `EmptyState` (a polite status) reading `loadingMessage`, the provider's `loading` string by default, and mark the table root `aria-busy`.

Implementation: `src/components/table/table-body.tsx`, `src/components/table/table.tsx`
Verification: `src/components/table/table-body.test.tsx`

### UIC-TABLE-6.3 - Empty

A table with no rows to show shall show the library's `EmptyState` reading `emptyMessage`, the provider's `noResults` string by default.

Implementation: `src/components/table/table-body.tsx`
Verification: `src/components/table/table-body.test.tsx`

### UIC-TABLE-6.4 - Error

`errorMessage` shall show the library's `InlineError` (an alert) with that message and, with `onRetry`, a retry button that works by pointer and keyboard without selecting or activating a row.

Implementation: `src/components/table/table-body.tsx`
Verification: `src/components/table/table-body.test.tsx`, `e2e/table.spec.ts`

## UIC-TABLE-7 - Layout

### UIC-TABLE-7.1 - Density

`density` (`regular` by default, or `compact`) shall publish `data-density` on the root, from which the stylesheet sets row spacing.

Implementation: `src/components/table/table.tsx`
Verification: `src/components/table/table.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-7.2 - Sticky header

`stickyHeader` shall publish `data-sticky-header` on the root, from which the stylesheet keeps the header in view while a bounded scroll area scrolls.

Implementation: `src/components/table/table.tsx`
Verification: `src/components/table/table.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-7.3 - Virtualization

`virtualized` shall render the grid through React Aria's `Virtualizer` with its table layout and publish `data-virtualized` on the root: only the rows in view of the scroll area, plus a small buffer, are in the document, at `rowHeight` pixels each (40 by default, 32 when compact), and scrolling reaches the last row. The stylesheet bounds the scroll area's height.

Implementation: `src/components/table/table.tsx`, `src/components/table/use-table-grid.ts`
Verification: `src/components/table/table.test.tsx`, `e2e/table.spec.ts`

## Hooks

| Hook                            | Kind      | Values                         | Description                                                          |
| ------------------------------- | --------- | ------------------------------ | -------------------------------------------------------------------- |
| `ui-table`                      | root      |                                | The element holding the filter and the scroll area.                  |
| `ui-table__filter`              | slot      |                                | The search field above a filterable table.                           |
| `ui-table__filter-icon`         | slot      |                                | The search field's leading glyph (also `ui-icon`).                   |
| `ui-table__filter-input`        | slot      |                                | The search field's input.                                            |
| `ui-table__filter-clear`        | slot      |                                | The search field's clear button.                                     |
| `ui-table__scroll`              | slot      |                                | React Aria's resizable container; the scroll area.                   |
| `ui-table__grid`                | slot      |                                | The grid (`<table>`, or a `div` when virtualized).                   |
| `ui-table__header`              | slot      |                                | The header row group.                                                |
| `ui-table__column`              | slot      |                                | One column header.                                                   |
| `ui-table__column-label`        | slot      |                                | A column header's content.                                           |
| `ui-table__sort-icon`           | slot      |                                | A sortable header's sort glyph (also `ui-icon`).                     |
| `ui-table__resizer`             | slot      |                                | A resizable column's resizer.                                        |
| `ui-table__body`                | slot      |                                | The body row group.                                                  |
| `ui-table__row`                 | slot      |                                | One data row.                                                        |
| `ui-table__cell`                | slot      |                                | One data row cell.                                                   |
| `ui-table__checkbox`            | slot      |                                | A selection checkbox (`<label>` around a visually hidden input).     |
| `ui-table__checkbox-box`        | slot      |                                | The checkbox's box, holding the check or minus glyph.                |
| `ui-table__drag-handle`         | slot      |                                | A row's drag handle button.                                          |
| `ui-table__drop-indicator`      | slot      |                                | The row marking a drop position while dragging.                      |
| `ui-table__state-row`           | slot      |                                | The full-width notice row.                                           |
| `ui-table__state-cell`          | slot      |                                | The notice row's spanning cell.                                      |
| `data-density`                  | attribute | `regular`, `compact`           | Row spacing, on the root.                                            |
| `data-kind`                     | attribute | `data`, `selection`, `actions` | What a column header or cell holds.                                  |
| `data-align`                    | attribute | `start`, `center`, `end`       | A data column's alignment, on its header and cells.                  |
| `data-column`                   | attribute |                                | A data column's id, on its header and cells.                         |
| `data-variant`                  | attribute | `loading`, `empty`, `error`    | Which notice the notice row shows.                                   |
| `data-sort-direction`           | attribute | `ascending`, `descending`      | The sorted column's direction (React Aria).                          |
| `data-resizable-direction`      | attribute | `left`, `right`, `both`        | Which ways a column can still be resized (React Aria).               |
| `data-selection-mode`           | attribute | `single`, `multiple`           | The table's selection mode, on rows (React Aria).                    |
| `data-key`                      | attribute |                                | A column, row or cell key (React Aria).                              |
| `data-collection`               | attribute |                                | React Aria's collection identifier; not for styling.                 |
| `data-column-index`             | attribute |                                | A cell's column index (React Aria).                                  |
| `data-level`                    | attribute |                                | A row's nesting level, always `1` here (React Aria).                 |
| `data-sticky-header`            | state     | `true`                         | The header stays in view, on the root.                               |
| `data-virtualized`              | state     | `true`                         | Only the rows in view render, on the root.                           |
| `data-empty`                    | state     | `true`                         | The search field has no query (React Aria).                          |
| `data-allows-sorting`           | state     | `true`                         | A sortable column header (React Aria).                               |
| `data-allows-dragging`          | state     | `true`                         | The grid's rows can be dragged (React Aria).                         |
| `data-dragging`                 | state     | `true`                         | A row being dragged (React Aria).                                    |
| `data-drop-target`              | state     | `true`                         | The drop indicator or grid targeted by a drag (React Aria).          |
| `data-resizing`                 | state     | `true`                         | A column or resizer being resized (React Aria).                      |
| `data-selected`                 | state     | `true`                         | A selected row or checked checkbox (React Aria).                     |
| `data-indeterminate`            | state     | `true`                         | The header checkbox while some rows are selected (React Aria).       |
| `data-disabled`                 | state     | `true`                         | A disabled row, checkbox or drag handle (React Aria).                |
| `data-hovered`                  | state     | `true`                         | Pointer over a row, header, resizer or control (React Aria).         |
| `data-pressed`                  | state     | `true`                         | A row, header or control being pressed (React Aria).                 |
| `data-focused`                  | state     | `true`                         | A focused grid, header, row, cell or control (React Aria).           |
| `data-focus-visible`            | state     | `true`                         | Keyboard focus on a grid, header, row, cell or control (React Aria). |
| `data-focus-visible-within`     | state     | `true`                         | Keyboard focus inside a row (React Aria).                            |
| `data-focus-visible-within-row` | state     | `true`                         | Keyboard focus inside a cell's row, on the cell (React Aria).        |
