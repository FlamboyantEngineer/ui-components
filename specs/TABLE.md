# Table

`Table` shows records a reader scans, sorts, filters, selects, edits and acts on. It is built on React Aria's `Table`: columns and rows are plain data with render callbacks, and the table adds sorting by one or several columns, a search box and typed column filters, selection with a selection bar and bulk edit, resizable, reorderable, hideable, pinned and grouped columns with a persisted layout, row groups with aggregates, nested rows and detail rows, cell editing and a spreadsheet mode with cell ranges, the clipboard and filling, a summary row, row reordering by drag and drop or keyboard, pagination through [Pagination](PAGINATION.md), loading more rows, full-width loading, empty and error notices, and virtualization for long lists. `sortTableRows`, `filterTableRows` and `applyTableMove` are exported for callers that keep the order, the filtering or the pages of their rows themselves, and `formatTsv` and `parseTsv` for tab-separated text.

Pointer ownership and drag lifecycle cleanup follow the shared [drag interaction contract](DRAG-INTERACTIONS.md).

## UIC-TABLE-1 - Columns and rows

### UIC-TABLE-1.1 - Data-driven grid

`Table` shall render React Aria's grid semantics (`grid`, `columnheader`, `row`, `rowheader` and `gridcell` roles) named by its `aria-label` or `aria-labelledby`, with one row per item in `rows`, keyed by the item's `id`, and one cell per column. A cell shows `renderCell(row)` when the column has it, else the column's value (`getValue(row)`, else the row's property named by the column `id`) as text when it is a string or a number. Content is React nodes; no HTML string is injected. The columns marked `isRowHeader`, or the first column when none is, name each row.

Row keys retain their primitive type, including numeric `1` and text `"1"`. Collection identities encode whitespace, so keys `"a b"` and `"ab"` keep separate accessible names, selections, expansion, cell ranges, editors, row actions and moves. Callbacks report the caller's original keys; `data-key` is an opaque collection identity.

Column ids containing whitespace shall likewise remain distinct in accessible names, sorting, widths and cell editing.

Implementation: `src/components/table/table.tsx`, `src/components/table/table-header.tsx`, `src/components/table/table-column.tsx`, `src/components/table/table-body.tsx`, `src/components/table/table-row.tsx`, `src/components/table/table-data-cell.tsx`
Verification: `src/components/table/table.test.tsx`, `e2e/table.spec.ts`, `src/components/table/table-key-identity.test.tsx`

### UIC-TABLE-1.2 - Column hooks

Data column headers and cells shall publish `data-kind="data"`, `data-align` (`start` by default, `center` or `end` from the column's `align`) and `data-column` with the column id; the selection and actions columns and their cells publish `data-kind="selection"` and `data-kind="actions"`.

Implementation: `src/components/table/table-header.tsx`, `src/components/table/table-column.tsx`, `src/components/table/table-row.tsx`, `src/components/table/table-data-cell.tsx`
Verification: `src/components/table/table.test.tsx`

### UIC-TABLE-1.3 - Accessible column names

Each column header shall carry its header content in `ui-table__column-label` and take its accessible name from it, or from the column's `textValue` when the header is not plain text. Buttons and checkboxes in header content are free of the header row's slots (its select-all checkbox): they need no `slot` and take none of its props, and the select-all checkbox keeps its slot. The actions column's label is the provider's `rowActions` string, which the stylesheet may hide visually.

Implementation: `src/components/table/table-header.tsx`, `src/components/table/table-column.tsx`, `src/utils/free-controls.tsx`, `src/core/strings.ts`
Verification: `src/components/table/table.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-1.4 - Hooks and caller attributes

`Table` shall carry the hooks below on a root element that holds the toolbar, the scroll area and the page navigation, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to that root. Its labelling (`aria-label`, `aria-labelledby`, `aria-describedby`, `aria-details`), selection and expansion props go to the grid; the table takes no other building-block prop.

Implementation: `src/components/table/table.tsx`, `src/components/table/use-table-grid.ts`, `src/components/table/table-props.ts`
Verification: `src/components/table/table.test.tsx`

### UIC-TABLE-1.5 - Caller row attributes

`getRowAttributes(row)` shall return the caller's `data-*` attributes for a data row, nested rows included, which the row element carries beside its hooks so a stylesheet can mark whole rows (for example `data-change="added"` or `data-status="missing"`). They are caller hooks the caller documents: string and number values render as given, `true` renders `"true"`, and `false` or `undefined` leave the attribute out. A hook value the table or React Aria writes on the row (such as `data-selected`) wins over a caller attribute of the same name.

Implementation: `src/components/table/table.tsx`, `src/components/table/table-row.tsx`, `src/components/table/table-data-cell.tsx`, `src/components/table/use-table-grid.ts`
Verification: `src/components/table/table-row.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-1.6 - Cell wrapping

`cellWrap` shall set how the table's cells wrap their text: `nowrap` (the default) keeps one line, `wrap` breaks between words and `anywhere` also breaks inside long unspaced values such as identifiers. A column's own `cellWrap` overrides it. Every data cell, summary cell and group aggregate cell of a data column publishes its resolved mode as `data-wrap` in every row, nested rows included, whatever its content, so the stylesheet draws the mode, for example with `white-space` and `overflow-wrap`. The mode changes no value, content, selection, action, focus or editing behaviour of the cell, and columns keep their widths and resizing. A virtualized table keeps its fixed row height, so its stylesheet clips wrapped text.

Implementation: `src/components/table/table-row.tsx`, `src/components/table/table-data-cell.tsx`, `src/components/table/table-structure.ts`, `src/components/table/table-footer.tsx`, `src/components/table/table-group-row.tsx`, `src/components/table/use-table-grid.ts`
Verification: `src/components/table/table.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-1.7 - Trailing actions

`trailingContent` shall render ordinary controls in one full-width final row, after any summary, including while the body shows a notice. Its controls stay focusable without selecting, dragging or activating a data row. Summary cells keep their existing behavior and notices still hide the summary. Omitting the prop leaves the table unchanged.

Implementation: `src/components/table/table.tsx`, `src/components/table/table-footer.tsx`
Verification: `src/components/table/table.test.tsx`, `src/components/table/table-footer.test.tsx`, `e2e/table.spec.ts`

## UIC-TABLE-2 - Sorting and filtering

### UIC-TABLE-2.1 - Sort cycle

Pressing the header of a column with `allowsSorting`, by pointer or with Enter, shall cycle its sort through ascending, descending and unsorted. The sorted header carries `aria-sort="ascending"` or `"descending"` and `data-sort-direction`; other sortable headers carry `aria-sort="none"`. `onSortChange` receives each next descriptor, or `null` for unsorted.

Implementation: `src/components/table/use-table-sort.ts`, `src/components/table/table-sort.ts`
Verification: `src/components/table/table.test.tsx`, `src/components/table/table-rows.test.ts`, `e2e/table.spec.ts`, `src/components/table/table-key-identity.test.tsx`

### UIC-TABLE-2.2 - Table-owned order

Without a `sortDescriptor` prop the table shall own the sort, starting from `defaultSortDescriptor`, and order the rows itself by the sorted column's values: numbers, booleans and dates numerically, text naturally and ignoring case in the provider locale (UIC-TABLE-2.10). Rows the column cannot separate keep their given order, each value is read once per row, and the caller's array is never modified. A sort on a column that leaves `columns` is dropped and reported through `onSortChange` or `onSortDescriptorsChange`, so the column returns unsorted and no column that takes its id inherits it; a caller-owned sort on a missing column is ignored.

Implementation: `src/components/table/use-table-rows.ts`, `src/components/table/use-table-sort.ts`, `src/components/table/table-sort.ts`, `src/components/table/table-rows.ts`
Verification: `src/components/table/table.test.tsx`, `src/components/table/table-rows.test.ts`, `src/components/table/use-table-sort.test.tsx`

### UIC-TABLE-2.3 - Caller-owned order

With a `sortDescriptor` prop the table shall render `rows` in the order given and only report the descriptor on the header. The exported `sortTableRows` orders rows the same way the table does.

Implementation: `src/components/table/use-table-rows.ts`, `src/components/table/table-sort.ts`
Verification: `src/components/table/table.test.tsx`

### UIC-TABLE-2.4 - Sort indicator

Every sortable header shall show exactly one decorative provider glyph in `ui-table__sort-icon`: `sort-none` while unsorted, `sort-ascending` or `sort-descending` while sorted. The glyph is hidden from assistive technology, so the header keeps its label as its name.

Implementation: `src/components/table/table-column.tsx`
Verification: `src/components/table/table.test.tsx`

### UIC-TABLE-2.5 - Filtering

`filterable` shall draw a React Aria search field in the toolbar above the grid (`ui-table__toolbar`), named and labelled by `filterLabel` (the provider's `filterRows` string by default), that keeps the rows whose text (their string and number values in every column) contains every whitespace-separated term of the query, ignoring case. Escape or the clear button empties the query. When nothing matches, the empty notice replaces the rows. Without `filterable` a query the table owns (typed before `filterable` turned off, or from `defaultFilter`) is set aside, so it never narrows the rows unseen; it applies again when the search box comes back.

Implementation: `src/components/table/table-search.tsx`, `src/components/table/table-toolbar.tsx`, `src/components/table/table-filters.ts`, `src/components/table/use-table-rows.ts`
Verification: `src/components/table/table.test.tsx`, `src/components/table/table-rows.test.ts`, `e2e/table.spec.ts`

### UIC-TABLE-2.6 - Sorting by several columns

`sortDescriptors` (controlled) or `defaultSortDescriptors` shall turn on multiple sort, a list of sorted columns in priority order reported through `onSortDescriptorsChange`. A plain header press sorts by that column alone, stepping its direction from unsorted to ascending, descending and unsorted again; a press with Shift (pointer or Enter) keeps the other columns, adding the column last or stepping it in place, and removing it after descending. Each sorted header shows its direction glyph and `data-sort-priority` with its place from 1; React Aria's `aria-sort` and `data-sort-direction` mark the first column only, as ARIA allows one sorted header. The table orders its rows by each column in turn, a later column breaking the ties of the earlier ones, unless `sortDescriptors` is given, when the caller orders them; `sortTableRows` takes the list too.

Implementation: `src/components/table/use-table-sort.ts`, `src/components/table/table-sort.ts`, `src/components/table/table-header.tsx`, `src/components/table/table-column.tsx`
Verification: `src/components/table/use-table-sort.test.tsx`, `src/components/table/table-sort.test.ts`, `e2e/table.spec.ts`

### UIC-TABLE-2.7 - Caller-owned filtering

The search query and the column filter values shall form one filter object (`query` and `columns` by column id). With a `filter` prop the caller owns it: the table renders `rows` as given, filtered on a server or by the caller's own matcher, and its controls show the filter and report each change through `onFilterChange` with the whole object. Without one the table owns it, starting from `defaultFilter`, and filters the rows itself. The exported `filterTableRows(rows, columns, filter)` filters rows the way the table does.

Implementation: `src/components/table/use-table-rows.ts`, `src/components/table/table-filters.ts`, `src/components/table/table.tsx`
Verification: `src/components/table/table-column-filter.test.tsx`, `src/components/table/table-filters.test.ts`

### UIC-TABLE-2.8 - Column filters

A column with `filter` shall draw a filter button in its header (`ui-table__column-filter`, a `Button` with the `filter` glyph named by the provider string `filterLabel` from the column's name) that opens an anchored dialog (`ui-table__column-filter-dialog`, a [Modal](MODAL.md) with `placement`) titled the same, holding the field of the filter's type: a `text` filter's [Text Field](TEXT-FIELD.md) named by the provider's `contains` string, a `number` filter's two [Number Fields](NUMBER-FIELD.md) for its bounds (`rangeFrom` and `rangeTo`), a `date` filter's date range [Date Time Field](DATE-TIME-FIELD.md), and a `set` filter's [Checkbox Group](CHOICE-GROUP.md) of its `options`, else the distinct values of the column in `rows` and every row nested under them by `getChildRows`, expanded or not, filtered out or not, and on any page. Each change filters the rows at once and the `clearFilter` button empties the column's filter. The header publishes `data-filtered` while its column filters rows. The button is a focusable child of the header, reached with ArrowRight while the header keeps Enter for sorting.

Implementation: `src/components/table/table-column-filter.tsx`, `src/components/table/table-column.tsx`, `src/components/table/table.tsx`, `src/core/glyphs.tsx`, `src/core/strings/content.ts`
Verification: `src/components/table/table-column-filter.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-2.9 - Filter matching

The table shall match filters with small pure functions: a query term matches the text of a row's string and number values in any column; a `text` value keeps cells whose text contains it, ignoring case and composition as [Text Match](TEXT-MATCH.md) normalizes text (UIC-TEXT-MATCH-1.1), as the query's terms do; a `number` range keeps number cells within its bounds, either of which may be open; a date range keeps cells holding a date, or text starting with a `YYYY-MM-DD` date, on or between its days, a date read as its four-digit local day in years 1 to 9999 and as no day outside them or when invalid; a `set` value keeps cells whose value is one of its values. Empty text, an empty set and a range with no bound filter nothing and are dropped from the filter object.

Implementation: `src/components/table/table-filters.ts`
Verification: `src/components/table/table-filters.test.ts`

### UIC-TABLE-2.10 - Locale collation

The table shall collate text in the provider locale (React Aria's locale from [Provider](PROVIDER.md)) wherever it orders it: its own sort, its row groups and the values a `set` filter lists from the rows. Text orders by that language's alphabet, naturally for embedded numbers and ignoring case, so Swedish orders `Å`, `Ä` and `Ö` after `Z` while German orders them beside `A` and `O`. A change of locale reorders the rows, groups and filter values at once; numbers, booleans and dates still order by value, and ties keep their given order. The exported `sortTableRows(rows, { columns, sort, locale })` takes the locale, a BCP 47 tag, so a caller sorts as the table does.

Implementation: `src/components/table/table-rows.ts`, `src/components/table/table-sort.ts`, `src/components/table/table-groups.ts`, `src/components/table/table-filters.ts`, `src/components/table/use-table-rows.ts`, `src/components/table/use-table-grouping.ts`, `src/components/table/table-column-filter.tsx`, `src/utils/intl-format.ts`
Verification: `src/components/table/table-locale.test.tsx`, `src/components/table/table-rows.test.ts`, `e2e/table.spec.ts`

## UIC-TABLE-3 - Selection and row actions

### UIC-TABLE-3.1 - Selection

The table shall select rows through the selection props (`selectionMode` `none`, `single` or `multiple`, `selectionBehavior` `toggle` or `replace`, `selectedKeys`, `defaultSelectedKeys`, `disabledKeys`, `disallowEmptySelection`, and `onSelectionChange` with the new `Selection`), controlled or not; without `selectedKeys` the table holds the selection itself and hands it to React Aria's grid. Multiple selection adds a leading checkbox column whose header checkbox selects every enabled row; each checkbox draws the `check` glyph when selected, the `minus` glyph when indeterminate and nothing otherwise, and takes React Aria's localized names. Disabled rows are never selected.

Implementation: `src/components/table/table-header.tsx`, `src/components/table/table-row.tsx`, `src/components/table/table-data-cell.tsx`
Verification: `src/components/table/table.test.tsx`, `e2e/table.spec.ts`, `src/components/table/table-aria-keys.test.ts`, `src/components/table/use-table-selection.test.tsx`

### UIC-TABLE-3.2 - Row action

`onRowAction` shall receive the key of a row the reader activates (as React Aria defines activation for the selection mode); activating a notice, detail or summary row never calls it.

Implementation: `src/components/table/table.tsx`, `src/components/table/use-table-grid.ts`
Verification: `src/components/table/table.test.tsx`

### UIC-TABLE-3.3 - Row actions slot

`renderRowActions(row)` shall render its content in a trailing actions cell per row, in a column `actionsColumnWidth` pixels wide (44 by default). Controls in it perform their own action without selecting or activating the row.

Implementation: `src/components/table/table-header.tsx`, `src/components/table/table-row.tsx`, `src/components/table/table-data-cell.tsx`
Verification: `src/components/table/table.test.tsx`

### UIC-TABLE-3.4 - Focus on cell controls

A control inside a cell (a row action, a selection checkbox, a cell's own content or a detail row's content) shall keep focus when it takes it, by keyboard, pointer or `focus()`, in flat and nested rows: the cell becomes the grid's focused cell, so the grid never moves focus to another row or cell. The control keeps focus and its element while it turns pending or unavailable (`focusableWhenDisabled`) and while rows are added around it with stable row IDs, and the arrow keys move on from its cell when it is not a text control. A text control in a cell (a text input, a slider or select, a text area, editable content, or an element with role `textbox` or `combobox`) keeps every key but Tab and Escape: the arrow keys, Home, End and typed characters are its own, and neither the grid's navigation nor its typeahead take them.

A listbox picker button (a native button or an element with role `button`, with `aria-haspopup="listbox"`) shall keep these same keys, including when a child of its trigger receives the event. ArrowDown opens its own list without moving the cell or selecting a row; Escape returns focus to its trigger. Ordinary buttons and menu buttons keep the grid's existing arrow navigation.

A text control inside a column header shall keep the same editing keys, without sorting or navigating the grid. Pointer activation of a nested control shall run only the control. Control+Enter and Meta+Enter skip the collection's handlers and reach enclosing shortcuts; plain Enter remains with the field. Focusing and activating the column header directly shall still sort an enabled sortable column.

Implementation: `src/components/table/table-row.tsx`, `src/components/table/table-data-cell.tsx`, `src/components/table/table-column.tsx`, `src/utils/text-control-keys.tsx`
Verification: `src/components/table/table-cell-focus.test.tsx`, `src/components/table/table-column-controls.test.tsx`, `src/components/table/table-picker-controls.test.tsx`, `e2e/table.spec.ts`, `src/utils/text-control-keys.test.tsx`

### UIC-TABLE-3.5 - Repeated selection events

`allowDuplicateSelectionEvents` shall default to false. When enabled, a reader's pointer or keyboard selection press shall call `onSelectionChange` even when the selected keys are unchanged. Passive controlled rerenders, disabled rows and a row's nested controls shall not emit selection callbacks. Selection values, bulk selection, toggle/replace behavior and row actions retain their existing contracts.

Implementation: `src/components/table/table.tsx`, `src/components/table/table-props.ts`
Verification: `src/components/table/table-repeat-selection.test.tsx`, `e2e/table-selection.spec.ts`

## UIC-TABLE-4 - Column sizing

### UIC-TABLE-4.1 - Column widths

Each data column shall size from its `width` (pixels, a percentage, an `fr` share or `content`; `1fr` by default), `minWidth` and `maxWidth` (75 pixels when a flexible column declares no minimum), as a CSS grid track in a static table (UIC-TABLE-4.6) and through React Aria's resizable table container in a virtualized one, with a maximum never below the minimum and pixel widths kept inside the bounds. `content` fits the rendered header and cells as described in UIC-TABLE-4.5. The selection column is 44 pixels wide and the actions column `actionsColumnWidth` pixels.

Implementation: `src/components/table/column-sizing.ts`, `src/components/table/table-header.tsx`, `src/components/table/table-column.tsx`
Verification: `src/components/table/column-sizing.test.ts`, `src/components/table/table.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-4.2 - Resizing

A column with `allowsResizing` shall draw a column resizer (`ui-table__resizer`) holding a slider named `Resize <column>` (the provider's `resizeColumn` string): the table's own in a static table, React Aria's in a virtualized one. The reader resizes by dragging it, or from the keyboard by focusing the header, pressing ArrowRight to reach the resizer, Enter to start, the arrow keys to resize by 10 pixels (mirrored right to left) and Enter, Escape, Space or Tab to finish, within the column's bounds. While a keyboard resize lasts, the arrow keys resize instead of moving through the grid. A drag is measured in layout pixels, so an ancestor scale or zoom moves the edge with the pointer, and a cancelled drag returns to the width it began at. A press on the resizer neither sorts nor selects the column. The column redraws live during the gesture as a pixel track, and `onColumnWidthsChange` receives the data columns' widths once when it ends: the resized column's pixels, the other columns' kept or declared widths. The table's resizer publishes `data-hovered`, `data-resizing` and `data-focus-visible`.

Implementation: `src/components/table/use-column-widths.ts`, `src/components/table/table-column.tsx`, `src/components/table/table-column-resizer.tsx`
Verification: `src/components/table/use-column-widths.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-4.3 - Persisted widths

With `persistKey`, the widths a resize leaves shall be written through the provider's storage under that key and restored when the table mounts again. Stored widths of unknown columns, unusable values and unreadable data are ignored, and stored pixel widths are kept inside the column's bounds.

Implementation: `src/components/table/use-column-widths.ts`, `src/components/table/column-sizing.ts`
Verification: `src/components/table/use-column-widths.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-4.4 - Sizing helpers

The table shall size columns with small pure functions: a usable explicit width is a positive pixel count, percentage or `fr` share; a column's maximum is never below its minimum; pixel widths are kept inside the bounds; a column renders at its usable stored width, else its declared width (measured for `content`), else `1fr`; and only the usable explicit widths of known columns are taken from a resize report or from storage. The word `content` is a declaration, never a persisted measurement.

Implementation: `src/components/table/column-sizing.ts`
Verification: `src/components/table/column-sizing.test.ts`

### UIC-TABLE-4.5 - Content-sized columns

`width="content"` shall fit the widest rendered header or data cell in the column, including controls and the containing page's typography and spacing, using measured pixel tracks. Measurements shall update after cell or header content changes, host size changes and fonts finish loading, and may shrink as well as grow. Only the containing table's own cells shall be treated as members of a measured column; synthetic group, detail, notice and trailing rows shall not influence the measurement. A virtualized table measures its rendered cells; it does not render unseen rows to measure them. Widths are measured in layout pixels: an ancestor `transform` scale or CSS `zoom` is accounted for once, so a content track keeps the same CSS width at any scale and is only drawn larger or smaller.

Before layout is available, the column shall use its minimum, or 75 pixels without one. Measurements and explicit resizes obey numeric `minWidth` and `maxWidth`, with a maximum never below the minimum. An explicit resized or restored width takes precedence over measurements until the caller removes that stored width. Measurements alone shall neither call `onColumnWidthsChange` nor persist a width. Columns without `width` retain `1fr`; flexible columns share the remaining width and the existing scroll container handles tracks wider than the available space. Data column headers publish `data-sizing`: `content` while measured, `flex` for an `fr` track, and `fixed` for an explicit pixel or percentage track, including a restored resize.

Implementation: `src/components/table/column-sizing.ts`, `src/components/table/measure-content-widths.ts`, `src/components/table/use-content-widths.ts`, `src/components/table/table-column.tsx`, `src/components/table/table-header.tsx`, `src/components/table/table.tsx`, `labs/src/table-content-contracts.tsx`
Verification: `src/components/table/column-sizing.test.ts`, `src/components/table/use-content-widths.test.tsx`, `e2e/table-content-contracts.spec.ts`

### UIC-TABLE-4.6 - CSS column layout

A static table shall lay out its columns in CSS, so flexible and percentage columns follow the container's size in the same frame as the container changes, with no measuring pass between them. The grid publishes the measured `--ui-table-columns`, its column tracks in display order: a pixel width as pixels, a percentage clamped to the column's bounds, an `fr` share as `minmax(<minimum>, <share>)`, the selection column's 44 pixels and the actions column's `actionsColumnWidth`. The reference stylesheet draws the grid as a CSS grid whose sections and rows are subgrids sharing those tracks; spanning notice cells take every track, and a group header cell publishes the measured `--ui-table-span`, its number of columns. Flexible columns keep their declared weights until a bound stops them: a share with a `maxWidth` is drawn as its weight in units of share kept inside its bounds, where a unit is the room the fixed tracks leave split by weight, less every cap that stops a share, so an unreached cap changes nothing and a reached one leaves its room to the other shares by their weights; the uncapped shares take what remains as `fr`. A static and a virtualized table with the same columns lay out the same widths. Tracks wider than the scroll area overflow it, which scrolls sideways. A virtualized table keeps React Aria's measured layout and publishes no tracks.

Implementation: `src/components/table/table-grid-tracks.ts`, `src/components/table/table-scroll.tsx`, `src/components/table/table.tsx`, `src/components/table/table-group-header.tsx`, `labs/reference/table.css`, `labs/src/table-content-contracts.tsx`
Verification: `src/components/table/table-grid-tracks.test.ts`, `e2e/table-fluid-columns.spec.ts`

## UIC-TABLE-5 - Reordering

### UIC-TABLE-5.1 - Drag and drop

With `reorder`, the first cell of each row shall start with a [Drag Handle](DRAG-HANDLE.md) (`ui-table__drag-handle`, named `Drag <row>` by React Aria). Dragging a row by pointer from anywhere on it, the handle's cell included ([UIC-DRAG-HANDLE-2.2](DRAG-HANDLE.md#uic-drag-handle-22---dragging-from-the-handles-cell)), or from the keyboard with Enter on its handle, the arrow keys and Enter, shall report one `reorder.onMove({ keys, targetKey, position })` with `position` `before` or `after`, while a `ui-table__drop-indicator` row marks the drop position. Drop positions that would leave the order unchanged are refused. A dragged row carries its `id` as text (`text/plain`) to other drop targets. The table never reorders its rows itself. Reordering moves the top-level rows of the current page; nested, detail and summary rows never move and nothing lands beside them. While the table reorders, which `reorder` turns on and grouping suspends unless UIC-TABLE-5.7 is selected, its root publishes `data-reordering`. Turning `reorder` on or off keeps every row mounted with its focus, scroll position, selection and expansion, and grouping or ungrouping a reorderable table keeps the grid mounted with its selection and scroll position while its rows move under their group rows: React Aria's drag and drop stays wired and is disabled while the table does not reorder, so `data-allows-dragging` stays on the grid and stylesheets key reordering styles off `data-reordering`. The grid keeps the caller's `aria-describedby`, which React Aria would clear from a grid that takes drops.

Implementation: `src/components/table/use-table-reorder.tsx`, `src/utils/use-reorder-drag-and-drop.ts`, `src/components/table/table-row.tsx`, `src/components/table/table-data-cell.tsx`
Verification: `src/components/table/use-table-reorder.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-5.2 - Fixed rows

A row for which `reorder.canMove` returns false shall not move: its handle is disabled in ordinary reordering (omitted in UIC-TABLE-5.7), drags starting on it are refused and Alt+Arrow keys leave it in place. Disabled rows are never dragged. Other rows may still be dropped beside it. A drop is checked against the rows as they are when it lands: of the dragged rows, only those still shown, enabled and accepted by `canMove` move, and a drop with none of them reports nothing.

Implementation: `src/components/table/use-table-reorder.tsx`, `src/components/table/table-row.tsx`, `src/components/table/table-data-cell.tsx`
Verification: `src/components/table/use-table-reorder.test.tsx`

### UIC-TABLE-5.3 - Keyboard moves

Alt+ArrowUp and Alt+ArrowDown with focus on a movable row, or inside it except in a text control (a field, editable content such as the cell editor), shall report a move of that row before the previous row or after the next one. At either end the keys are claimed and nothing moves.

Implementation: `src/components/table/use-table-reorder.tsx`, `src/utils/use-reorder-drag-and-drop.ts`
Verification: `src/components/table/use-table-reorder.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-5.4 - Move helper

`applyTableMove(rows, move)` shall return a copy of `rows` with the moved rows, in their current order, placed before or after the target, leaving the input unchanged.

Implementation: `src/components/table/table-rows.ts`
Verification: `src/components/table/table-rows.test.ts`

### UIC-TABLE-5.5 - Dragging by the handle only

`reorder.dragTrigger="handle"` shall let only a row's enabled drag handle start its pointer drag: rows render without `draggable`, and a primary press on the handle makes its row draggable until the press or the drag ends ([UIC-DRAG-HANDLE-2.1](DRAG-HANDLE.md#uic-drag-handle-21---dragging-by-the-handle-only)), so a press elsewhere in the row selects, activates or does what the browser does with it, without dragging. `row`, the default, drags from anywhere on the row. Keyboard drags start from the handle either way.

Implementation: `src/components/table/use-table-reorder.tsx`, `src/components/table/table-row.tsx`, `src/components/table/table-data-cell.tsx`, `src/components/drag-handle/drag-handle.tsx`
Verification: `src/components/table/use-table-reorder.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-5.6 - Drag preview

`reorder.renderDragPreview(rows)` shall draw the image that follows the pointer during a drag, such as a count of several dragged rows, from the dragged rows in their current order, inside `ui-table__drag-preview` with `data-count` holding their number, instead of the browser's picture of the row.

Implementation: `src/components/table/use-table-reorder.tsx`, `src/utils/use-reorder-drag-and-drop.ts`
Verification: `src/components/table/use-table-reorder.test.tsx`

### UIC-TABLE-5.7 - Moves within a group

`reorder.grouped="within-group"` shall explicitly allow controlled moves of visible top-level data rows inside their current leaf group. The default shall continue to suppress grouped reordering. The table shall keep reporting `onMove({ keys, targetKey, position })`; it never changes row order or group values itself. Every moved row and target shall belong to the same expanded leaf group on the current page. Cross-group requests, synthetic group headers, collapsed-group rows, nested data rows and detail or summary rows shall not be targets or move sources. A selection spanning groups shall not move across those boundaries. An active sort shall suspend grouped moves.

`canMove` and disabled-row checks shall still decide which data rows may move. Group-constrained moves shall draw handles only for eligible rows; group headers and fixed rows draw none. Other rows may land beside a fixed data row in the same group, preserving the ordinary fixed-row rule. Pointer dragging, keyboard dragging and Alt+Arrow moves shall share the same live validation; Alt+Arrow stops at a leaf-group boundary, and Escape cancels a keyboard drag without reporting a move. Row keys and caller attributes remain unchanged after a controlled move.

Implementation: `src/components/table/table-reorder-groups.ts`, `src/components/table/use-table-reorder.tsx`, `src/components/table/use-table-grid.ts`, `src/components/table/use-table-model.ts`, `src/components/table/table-data-cell.tsx`, `labs/src/table-content-contracts.tsx`
Verification: `src/components/table/table-reorder-groups.test.ts`, `src/components/table/table-group-reorder.test.tsx`, `src/components/table/use-table-reorder.test.tsx`, `e2e/table-content-contracts.spec.ts`

## UIC-TABLE-6 - Notices

### UIC-TABLE-6.1 - Notice row

While loading, empty or failed, the table shall replace its rows with one full-width row (`ui-table__state-row` with `data-variant`) whose cell spans every column, including the selection and actions columns, while the headers and the table's name stay. An error wins over loading, and loading over empty. The notice row is named by its spanning cell, so assistive technology reads the notice as the row's name and no reference points at a missing row header. It can take focus, so its controls stay reachable, but it is never selected, dragged or passed to `onRowAction`. A table without data columns draws no selection or actions column and no rows, rather than failing.

Implementation: `src/components/table/table-body.tsx`, `src/components/table/table-spanning-row.tsx`, `src/components/table/use-table-grid.ts`
Verification: `src/components/table/table-body.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-6.2 - Loading

`isPending` shall show the library's loading `EmptyState` (a polite status) reading `loadingMessage`, the provider's `loading` string by default, and mark the table root `aria-busy`.

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

### UIC-TABLE-7.1 - Size

`size` (`md` by default, or `sm`) shall publish `data-size` on the root, from which the stylesheet sets the row height.

Implementation: `src/components/table/table.tsx`
Verification: `src/components/table/table.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-7.2 - Sticky header

`stickyHeader` shall publish `data-sticky-header` on the root, from which the stylesheet keeps the header in view while a bounded scroll area scrolls. Inside an overlay [Scroll Region](SCROLL-REGION.md) with `scrollbarInset="header"`, Table shall register its actual header through `useScrollRegionHeaderRef`, including both rows of grouped column headers. The region shall measure the full header without caller registration or DOM queries; changing or removing the header releases its registration. Without a header inset, Table shall register no header.

Implementation: `src/components/table/table.tsx`, `src/components/table/table-header.tsx`, `src/components/table/table-group-header.tsx`
Verification: `src/components/table/table.test.tsx`, `src/components/scroll-region/scroll-region.test.tsx`, `e2e/table.spec.ts`, `e2e/scroll-region.spec.ts`

### UIC-TABLE-7.3 - Virtualization

`virtualized` shall render the grid through React Aria's `Virtualizer` with its table layout and publish `data-virtualized` on the root: only the rows in view of the scroll area, plus a small buffer and the summary row ([UIC-TABLE-12.1](#uic-table-121---summary-row)), are in the document, at `rowHeight` pixels each (40 by default, 32 at size `sm`), and scrolling reaches the last row. The stylesheet bounds the scroll area's height. Its cells are not table cells, so the reference stylesheet centres their content in the row and places it by the column's `align`, controls included.

Implementation: `src/components/table/table.tsx`, `src/components/table/table-virtualizer.tsx`, `src/components/table/use-table-grid.ts`
Verification: `src/components/table/table.test.tsx`, `e2e/table.spec.ts`

## UIC-TABLE-8 - Column layout

### UIC-TABLE-8.1 - Hiding columns

When a column has `allowsHiding`, the toolbar shall draw a columns menu (`ui-table__columns-menu`, a [Dropdown Menu](DROPDOWN-MENU.md) labelled by the provider's `columns` string) with one checkable item per such column, in display order, ticked while it is shown. Toggling an item hides or shows its column at once and the menu stays open. Hidden columns draw no header or cells; a column hidden by the layout that does not allow hiding stays hidden.

Implementation: `src/components/table/table-columns-menu.tsx`, `src/components/table/table-toolbar.tsx`, `src/components/table/use-column-layout.ts`, `src/core/strings/content.ts`
Verification: `src/components/table/use-column-layout.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-8.2 - Column layout

The order and the hidden columns shall form the column layout (`order`, a list of column ids, and `hidden`). `columnLayout` controls it; otherwise the table owns it, starting from `defaultColumnLayout`, and `onColumnLayoutChange` receives the whole layout after each change. Columns the order does not list follow the listed ones in their declared order.

Implementation: `src/components/table/use-column-layout.ts`, `src/components/table/table-columns.ts`
Verification: `src/components/table/use-column-layout.test.tsx`

### UIC-TABLE-8.3 - Persisted layout

With `persistKey`, the layout the table owns shall be written through the provider's storage under `<persistKey>:layout` and restored when the table mounts again; ids of unknown columns and unusable stored data are ignored. Resized widths keep persisting under `persistKey` itself.

Implementation: `src/components/table/use-column-layout.ts`, `src/components/table/table-columns.ts`
Verification: `src/components/table/use-column-layout.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-8.4 - Moving columns by dragging

The label of a column with `allowsReordering` shall drag its column, and dropping it on the content of another column header (`ui-table__column-content`, which holds the label, the sort glyph and the filter button and which the stylesheet stretches over the header) places it before or after that column, by the half of the content under the pointer in reading order. Column drags use the shared item drag ([UIC-DRAG-INTERACTIONS-2.3](DRAG-INTERACTIONS.md#uic-drag-interactions-23---item-moves)) with a drag type of their own table, so a column lands only in its table and other drop targets read the column's name as text. While the column drags, its header publishes `data-dragging` and the header it would land beside publishes `data-drop-position` (`before` or `after`). Columns move only among those pinned to the same edge. A column drag never reaches the grid's row drag and drop, and never sorts.

Implementation: `src/components/table/use-column-drag.ts`, `src/components/table/use-column-reorder.ts`, `src/components/table/table-column.tsx`, `src/components/table/table-columns.ts`
Verification: `src/components/table/use-column-reorder.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-8.5 - Moving columns by keyboard

Alt+ArrowLeft and Alt+ArrowRight with focus on the header of a column with `allowsReordering`, outside a text control in the header, shall move it one column towards the start or the end of the line, mirrored in a right-to-left locale, and keep focus on its header. At the edge of its pinned group the keys are claimed and nothing moves. Reorderable headers publish `data-allows-reordering`.

Implementation: `src/components/table/use-column-reorder.ts`, `src/components/table/table-columns.ts`
Verification: `src/components/table/use-column-reorder.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-8.6 - Pinned columns

A column with `pin` (`start` or `end`) shall be drawn among the first or last columns, keeping their order, and stay at its edge while the scroll area scrolls sideways: its header, cells and summary cell publish `data-pinned` and the measured `--ui-table-pin-offset`, the width of the pinned columns between it and its edge, measured from the drawn header cells in a static table, from which the stylesheet makes it sticky. The selection column pins with the start columns and the actions column with the end columns. Offsets follow every drawn width, live during a resize and as the container's CSS sizing changes. A virtualized table positions every cell itself and pins nothing. Column ids are keys like any other: an id such as `__proto__`, `constructor` or `valueOf` keeps its pin, offset, width and filter.

Implementation: `src/components/table/table-columns.ts`, `src/components/table/use-pinned-offsets.ts`, `src/components/table/table-header.tsx`, `src/components/table/table-structure.ts`, `src/components/table/table-column.tsx`, `src/components/table/table-row.tsx`, `src/components/table/table-data-cell.tsx`
Verification: `src/components/table/use-pinned-offsets.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-8.7 - Column groups

`columnGroups` (an id, a header and the ids of its columns each) shall draw a row of group headers above the column headers: one `ui-table__column-group` header cell (`scope="colgroup"`) spanning each run of neighbouring drawn columns of one group, and a cell hidden from assistive technology over ungrouped columns and the selection and actions columns, which publishes `data-ungrouped`. A group whose columns are moved apart draws over each run. The grid then lists React Aria's column widths as column tracks first, so the fixed table layout takes them rather than the group row's. A virtualized table draws the same row with the same hooks, one row height tall: its layout lowers the column headers and the rows below them by that height, and each group cell, a `columnheader` with `aria-colindex` and `aria-colspan`, sits over its columns' widths.

Implementation: `src/components/table/table-header.tsx`, `src/components/table/table-group-header.tsx`, `src/components/table/table-virtualizer.tsx`, `src/components/table/table.tsx`, `src/components/table/table-columns.ts`
Verification: `src/components/table/table-header.test.tsx`, `e2e/table.spec.ts`, `e2e/pivot-table.spec.ts`

### UIC-TABLE-8.8 - Layout helpers

The table shall arrange columns with small pure functions: the layout's order puts listed columns first and the others after in declared order; arranging drops hidden columns and puts start-pinned columns first and end-pinned columns last; a move lands a column before or after another of the same pinned group and is refused across groups; a step moves a column one drawn column along within its pinned group; a stored layout keeps only lists of known ids, each once; and group cells cover runs of one group, merging the gaps between them.

Implementation: `src/components/table/table-columns.ts`
Verification: `src/components/table/table-columns.test.ts`

## UIC-TABLE-9 - Nested and detail rows

### UIC-TABLE-9.1 - Nested rows

With `getChildRows`, each row's child rows shall be drawn under it while it is expanded, through React Aria's expandable rows: the grid becomes a `treegrid`, rows carry `aria-level` and, with children, `aria-expanded`, and ArrowRight and ArrowLeft on a focused row expand and collapse it. The tree column (the column whose id is `treeColumn` when it is drawn, else the first drawn data column) holds an expand button (`ui-table__expand`, React Aria's `chevron` slot, which names it `Expand <row>` or `Collapse <row>`, drawing the expand toggle's chevron) for rows with children and a spacer (`ui-table__expand-spacer`) for the others, and its cells publish the measured `--ui-table-level` from 1. `expandedKeys` (controlled) or `defaultExpandedKeys` choose the expanded rows, and `onExpandedChange` receives the expanded keys after each change.

Implementation: `src/components/table/table-row.tsx`, `src/components/table/table-data-cell.tsx`, `src/components/table/use-table-grid.ts`, `src/components/table/table-tree.ts`
Verification: `src/components/table/table-row.test.tsx`, `e2e/table.spec.ts`, `src/components/table/table-key-identity.test.tsx`, `src/components/table/table-aria-keys.test.ts`

### UIC-TABLE-9.2 - Detail rows

`renderRowDetail(row)` shall make each row with content expandable, drawing that content in a full-width detail row (`ui-table__detail-row`, whose `ui-table__detail-cell` spans every column) under the row while it is expanded, before its child rows. A detail row is named by its spanning cell, like the notice row ([UIC-TABLE-6.1](#uic-table-61---notice-row)). It can take focus, so its controls stay reachable, but it is never selected, dragged or passed to `onRowAction`.

Implementation: `src/components/table/table-row.tsx`, `src/components/table/table-data-cell.tsx`, `src/components/table/table-spanning-row.tsx`, `src/components/table/use-table-grid.ts`
Verification: `src/components/table/table-row.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-9.3 - Sorting and filtering nested rows

The table shall sort child rows among their siblings with the table's sort, and keep a row while it, or any row nested under it, passes the filter, keeping only its child rows that pass. Building, filtering and sorting nested row data shall preserve reading order without depending on the JavaScript call-stack depth.

Implementation: `src/components/table/table-tree.ts`, `src/components/table/use-table-rows.ts`, `src/utils/map-tree.ts`
Verification: `src/components/table/table-tree.test.ts`, `src/components/table/table-row.test.tsx`, `src/utils/map-tree.test.ts`

## UIC-TABLE-10 - Pagination

### UIC-TABLE-10.1 - Pages

`pagination` shall show the top-level rows one page of `pageSize` at a time, after filtering and sorting, under a [Pagination](PAGINATION.md) (`ui-table__pagination`) named by the provider string `paginationOf` from the table's `aria-label`. `page` controls the page, else the table owns it starting at `defaultPage`, and `onPageChange` receives each page the reader moves to. A page beyond the last shows the last.

Implementation: `src/components/table/use-table-rows.ts`, `src/components/table/table.tsx`, `src/core/strings/content.ts`
Verification: `src/components/table/use-table-rows.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-10.2 - Pages from the caller

With `pagination.rowCount`, the rows shall be paged by the caller: the table shows `rows` as given as the current page and counts the pages from `rowCount`.

Implementation: `src/components/table/use-table-rows.ts`
Verification: `src/components/table/use-table-rows.test.tsx`

### UIC-TABLE-10.3 - Back to the first page

A change of the sort or the filter through the table's controls shall return the table to the first page, through `onPageChange(1)` when the caller controls the page.

Implementation: `src/components/table/use-table-rows.ts`, `src/components/table/use-table-sort.ts`
Verification: `src/components/table/use-table-rows.test.tsx`

## UIC-TABLE-11 - Editing

### UIC-TABLE-11.1 - Opening an editor

A cell of a column with `allowsEditing` in an enabled row (UIC-TABLE-11.4) shall open its editor on F2 or Enter while the cell has focus, or on a double click, and publish `data-editing` while it is open. One cell is edited at a time. While the editor is open the grid's arrow-key navigation and type-ahead are off, so the editor keeps its keys.

Implementation: `src/components/table/use-cell-editing.ts`, `src/components/table/table-row.tsx`, `src/components/table/table-data-cell.tsx`, `src/components/table/table-cell-editor.tsx`
Verification: `src/components/table/use-cell-editing.test.tsx`, `e2e/table.spec.ts`, `src/components/table/table-key-identity.test.tsx`

### UIC-TABLE-11.2 - Default editor

Without `renderEditor` the editor shall be a text input (`ui-table__editor`) named by the column's name, holding the cell's text and focused. Enter commits; focus leaving it commits; Escape cancels. A commit calls `onCellEdit({ row, columnId, value })` with the text, or a number when the cell held a number and the text is plain decimal text (a sign, digits and a fraction) no larger than `Number.MAX_SAFE_INTEGER`; hexadecimal, binary, octal and exponent forms, and larger integers, stay text so no digit is lost. The input starts with `true` or `false` for a boolean, the ISO string for a date, and nothing for an empty cell; a commit whose text is still that starting text reports the cell's own value, with its type. After Enter or Escape focus returns to the cell. An Enter or Escape that an input method composition owns (pressed while it composes, or the Enter reported with key code 229 as it ends) is left to the input method and neither commits nor cancels, in the default editor and in a custom one. The table never changes its rows itself.

Implementation: `src/components/table/table-cell-editor.tsx`, `src/components/table/use-cell-editing.ts`, `src/utils/is-composing-key.ts`
Verification: `src/components/table/use-cell-editing.test.tsx`, `src/utils/is-composing-key.test.ts`, `e2e/table.spec.ts`

### UIC-TABLE-11.3 - Custom editors

`renderEditor(row, editor)` shall draw the cell's editor instead, given the cell's `value`, the column's `label`, `commit(value)` and `cancel()`; Escape inside it cancels, unless the editor's own control handled that Escape (`preventDefault`, such as closing its own popover): then the edit stays open. Focus returns to the cell when the edit ends, unless it has moved elsewhere.

Implementation: `src/components/table/table-cell-editor.tsx`, `src/components/table/use-cell-editing.ts`
Verification: `src/components/table/use-cell-editing.test.tsx`

### UIC-TABLE-11.4 - Disabled rows

A row in `disabledKeys` shall never be edited: F2, Enter, a double click and spreadsheet type-to-edit open no editor on its cells, whatever their column's `allowsEditing`, and no commit, focus loss or custom editor reports an `onCellEdit` for it. A row that becomes disabled while one of its cells is being edited closes the editor, discarding its draft without an edit, and focus returns to the cell. Pasting, filling and clearing cells skip disabled rows the same way (UIC-TABLE-14.3).

Implementation: `src/components/table/use-cell-editing.ts`
Verification: `src/components/table/use-cell-editing.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-11.5 - Revoked edits

An open editor whose row leaves the presented rows (removed, filtered out, paged away or collapsed under a group) or whose column stops allowing edits or is hidden shall close the same way: it discards its draft without an `onCellEdit`, and focus it held moves to the cell when it is still drawn, else to the cell's row, else to the grid. Any cell can then open an editor, and the row or column coming back does not reopen the closed one.

Implementation: `src/components/table/use-cell-editing.ts`, `src/components/table/use-table-grid.ts`
Verification: `src/components/table/use-cell-editing.test.tsx`

## UIC-TABLE-12 - Summary and loading more

### UIC-TABLE-12.1 - Summary row

When a drawn column has `renderFooter`, a summary row shall follow the rows in React Aria's table footer (`ui-table__footer`, `ui-table__footer-row`): one `ui-table__footer-cell` per column with the column's kind, alignment, id and pin hooks, holding `renderFooter(rows)` from every row the table presents across pages, and empty under the other columns. The row can take focus but is never selected, dragged or passed to `onRowAction`, takes no position among nested rows (`aria-posinset`, `aria-setsize`), and a notice hides it. A virtualized table keeps the summary row in the document wherever it is scrolled, so its row group always holds the row. The row is named by the provider string `summary`, whichever column has a footer or is a row header.

Implementation: `src/components/table/table-footer.tsx`, `src/components/table/table.tsx`, `src/components/table/table-virtualizer.tsx`, `src/core/strings/content.ts`
Verification: `src/components/table/table-footer.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-12.2 - Loading more

`onLoadMore` shall be called when the end of the rows scrolls into the scroll area's view while `isLoading` is false, through React Aria's `TableLoadMoreItem` after the rows (`ui-table__loader`), virtualized or not. While `isLoading`, the loader row shows the library's loading `EmptyState` (a polite status) reading `loadingMessage` as given, text or other content, the provider's `loading` string by default, below the rows it keeps, so a table announces the same message whether it loads its first rows or more of them.

Implementation: `src/components/table/table-body.tsx`
Verification: `src/components/table/table-body.test.tsx`, `e2e/table.spec.ts`

## UIC-TABLE-13 - Row groups

### UIC-TABLE-13.1 - Grouping

`groupBy` shall draw the rows of the current page, once filtered and sorted, under group header rows: one per value of its first entry, holding the groups of its next entry, and so on. An entry is a column id, grouping by the column's values (a hidden column included), or a computed grouping (`id`, `label`, `getValue(row)` and optionally `compareValues(left, right)`, which orders its groups in place of their values, as for groups identified by an id but ordered by the caller); unknown column ids are skipped. Rows keep their order inside a group, so the table's sort orders them. Values group by kind as well as value, so the number `1`, the text `"1"`, `true` and `"true"` make four groups; all empty values (absent, null, empty text or an invalid date) make one group, and dates make one group per day, the local day the date filter reads (a year outside 1 to 9999 groups by its UTC day in ISO 8601's expanded form). Groups are ordered by value, descending when the table sorts their column descending and ascending otherwise, values that order alike by text first, then number, boolean and date, with the group of empty values last. Each group has a key unique in the table, the path of grouping ids and values under `ui-table-group:` (`ui-table-group:kind=Fruit/city=Oslo`), and the grid becomes a `treegrid` whose group rows and rows carry `aria-level`. Nested rows stay under their row.

Generated group keys shall escape `%`, `/`, `=` and `:` inside grouping ids and values, keeping logical paths stable when group sorting or source row order changes. They avoid every source row id and every other generated group key; a collision receives the first unused numeric suffix. Of values of different kinds with the same text, the text keeps the plain key and the others take suffixes in the order number, boolean, date, whatever order the rows come in. Ordinary keys keep their existing value. Treat group keys as opaque values from `renderGroupLabel(group)`, since a group and a similarly named data row expand and collapse independently.

Implementation: `src/components/table/table-groups.ts`, `src/components/table/use-table-grouping.ts`, `src/components/table/use-table-grid.ts`
Verification: `src/components/table/table-group-row.test.tsx`, `src/components/table/table-groups.test.ts`, `e2e/table.spec.ts`, `src/components/table/table-key-identity.test.tsx`

### UIC-TABLE-13.2 - Group header rows

A group header row (`ui-table__group-row`) shall draw one cell per column: after an empty selection cell, a `ui-table__group-cell` under the first data column, with its id and pin hooks and the measured `--ui-table-level` of its group, from which the label may spill over the empty cells beside it. It holds React Aria's expand button (`ui-table__expand`), the label (`ui-table__group-label`): `renderGroupLabel(group)`, else the provider's `groupHeading` from the grouping's name and the group's value (the provider's `emptyValue` for empty values, a date as its day), and the number of rows (`ui-table__group-count`) in the provider locale, hidden from assistive technology, which reads the provider's `itemCount` instead. The row's text value is the heading with its count, and the row is named by its label and the count's words, whichever columns are row headers. A group row can take focus but is never selected, dragged or passed to `onRowAction`, and grouping suppresses data-row handles and reordering unless the caller opts into UIC-TABLE-5.7.

Implementation: `src/components/table/table-group-row.tsx`, `src/components/table/use-table-grid.ts`, `src/core/strings/table.ts`
Verification: `src/components/table/table-group-row.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-13.3 - Aggregates

The `aggregate` of a column after the first shall fill its cell in each group header row (`ui-table__aggregate-cell`, with the column's kind, alignment, id and pin hooks) from the group's rows: `count` counts the values that are not empty, `sum`, `min` and `max` take the finite numbers and show nothing without any, each formatted for the provider locale; a function returns the cell's content. The selection and actions columns get empty aggregate cells.

Implementation: `src/components/table/table-group-row.tsx`, `src/components/table/table-groups.ts`
Verification: `src/components/table/table-group-row.test.tsx`, `src/components/table/table-groups.test.ts`, `e2e/table.spec.ts`

### UIC-TABLE-13.4 - Collapsing groups

Groups shall be expanded until collapsed: the expand button, or ArrowLeft and ArrowRight on a focused group row, collapses and expands it. `collapsedGroups` (controlled) or `defaultCollapsedGroups` name the collapsed group keys, and `onCollapsedGroupsChange` receives them after each change, keeping the keys of groups not drawn now, such as those of another page. Expanding nested rows still reports only through `onExpandedChange`. Groups work in a virtualized table.

Implementation: `src/components/table/use-table-expansion.ts`, `src/components/table/use-table-grouping.ts`, `src/components/table/table-group-row.tsx`
Verification: `src/components/table/table-group-row.test.tsx`, `e2e/table.spec.ts`, `src/components/table/table-key-identity.test.tsx`

### UIC-TABLE-13.5 - Grouping helpers

The table shall group with small pure functions: resolving `groupBy` against the columns and the sort, grouping nodes level by level under unique keys with empty values last, listing group keys, listing the rows a reader sees inside expanded groups and rows, and computing the built-in aggregates.

Built-in aggregates shall handle groups larger than the runtime limit on function arguments, retaining the same finite-number and empty-value rules.

Collecting visible rows and group keys shall preserve reading order without call-stack depth limits or repeatedly copying descendant arrays.

Implementation: `src/utils/summarize-numbers.ts`, `src/components/table/table-groups.ts`
Verification: `src/components/table/table-groups.test.ts`

## UIC-TABLE-14 - Spreadsheet mode

### UIC-TABLE-14.1 - Cell selection

`cellSelection` (`none` by default) shall turn on spreadsheet mode over the data cells of the rows a reader sees: `cell` selects the focused cell, and `range` also selects rectangles of cells. A press on a data cell selects and focuses it; with `range`, Shift with a press or with an arrow key (mirrored right to left) extends the selection from its anchor, and dragging over cells extends it to the cell under the pointer. Focus reaching a cell selects it unless it returns to the anchor, and focus reaching a data row moves on to its cell in the selected column, else its first data cell. Presses on data cells select cells, not rows; controls, editable content and focusable elements inside a cell (links, labels, `summary`, form fields, any non-false `contenteditable`, elements with a `tabindex`, and the `button`, `link`, `checkbox`, `radio`, `switch`, `slider`, `spinbutton`, `scrollbar`, `textbox`, `searchbox`, `combobox`, `menuitem`, `menuitemcheckbox`, `menuitemradio`, `option`, `tab` and `treeitem` roles), the library's gesture surfaces that carry no role (a `NumberField` slider track and thumbs and its scrub handle, a `ScrollRegion` overlay track and a `SignaturePad` surface), and presses whose default a handler already prevented, keep their presses: the slider moves, the scrub starts or the track pages, and the cell is not selected or focused. `selectedRange` (controlled, `null` for none) or `defaultSelectedRange` hold the selection as an anchor and a focus (`rowKey`, `columnId`), reported through `onSelectedRangeChange`. Selected cells publish `data-in-range`, `aria-selected="true"` and, on its edges, `data-range-top`, `data-range-bottom`, `data-range-start` and `data-range-end`.

Implementation: `src/components/table/use-cell-selection.ts`, `src/components/table/use-cell-pointer.ts`, `src/utils/is-interactive-target.ts`, `src/components/table/table-row.tsx`, `src/components/table/table-data-cell.tsx`, `src/components/table/use-table-model.ts`
Verification: `src/components/table/use-cell-selection.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-14.2 - Copying

Copying while a data cell has focus shall write the selected cells, or the focused cell, to the clipboard as tab-separated text and as an HTML table: values as text, dates in ISO 8601 and nothing or an invalid date as empty text.

Implementation: `src/components/table/use-cell-selection.ts`, `src/components/table/table-cell-writes.ts`
Verification: `src/components/table/use-cell-selection.test.tsx`, `src/components/table/table-cell-writes.test.ts`, `e2e/table.spec.ts`

### UIC-TABLE-14.3 - Pasting

Pasting tab-separated text while a data cell has focus shall write it into the selected cells: one value into every selected cell, more values from the top start cell as far as the grid reaches, then select the cells the paste covers. Each text is read by the column's `parseValue` and checked by its `validateValue`; only cells of columns with `allowsEditing` in enabled rows whose value the column accepts and that change are written, and `onCellsChange` receives them in one batch. The table never changes its rows itself.

Pastes shall measure the widest source row without a function-argument limit and clip writes to the grid.

Implementation: `src/components/table/use-cell-selection.ts`, `src/components/table/table-cell-writes.ts`, `src/utils/tsv.ts`
Verification: `src/components/table/use-cell-selection.test.tsx`, `src/components/table/table-cell-writes.test.ts`, `e2e/table.spec.ts`

### UIC-TABLE-14.4 - Clearing

Delete or Backspace on a data cell shall write empty text into the selected cells, reported like a paste.

Implementation: `src/components/table/use-cell-selection.ts`, `src/components/table/table-cell-writes.ts`
Verification: `src/components/table/use-cell-selection.test.tsx`, `src/components/table/table-cell-writes.test.ts`, `e2e/table.spec.ts`

### UIC-TABLE-14.5 - Filling

In `range` mode, the bottom end cell of a selection holding an editable cell shall draw a fill handle (`ui-table__fill-handle`, hidden from assistive technology). Dragging it down or towards the end, whichever reaches further, marks the cells it would fill with `data-fill-target` and, on release, fills them from the selected cells: each column, or each row, continues an evenly spaced run of numbers by its step and repeats anything else, then the filled cells are selected. Control or Command with D fills the selection down from its first row, and with R towards the end from its first column; on a non-Latin layout, the keys in the D and R keys' places do ([UIC-SHORTCUT-1.8](SHORTCUT.md)). Fills are reported like a paste. Cancelling a fill shall clear its preview without writing cells; extension, release and cancellation follow only the pointer that started it, in the table's own document, so another finger or pen passing over a cell moves neither the fill target nor a range drag's end. A fill or range drag whose table changes before release (spreadsheet mode changes, the rows or drawn columns change, or a fill's source range is replaced) ends there: it clears its preview and writes and selects nothing.

Numeric runs shall be checked within floating-point precision and retain the decimals of scientific-notation values. Tiny uneven values repeat rather than being mistaken for a progression. Reading a source series shall not allocate a filtered numeric copy or spread its precisions into arguments.

Implementation: `src/components/table/use-cell-pointer.ts`, `src/components/table/use-cell-selection.ts`, `src/components/table/table-cell-writes.ts`, `src/components/table/table-row.tsx`, `src/components/table/table-data-cell.tsx`
Verification: `src/components/table/use-cell-selection.test.tsx`, `src/components/table/table-cell-writes.test.ts`, `e2e/table.spec.ts`

### UIC-TABLE-14.6 - Typing and moving

In spreadsheet mode, typing a character other than Space on an editable cell of an enabled row shall open its editor holding that character. In the default editor Enter commits and moves focus to the cell below, Tab to the next cell along the row, and Shift with either moves back; at the edge of the rows or cells focus stays on the cell. Without spreadsheet mode Enter returns focus to the cell and Tab leaves the editor as the browser does.

Implementation: `src/components/table/use-cell-editing.ts`, `src/components/table/table-cell-editor.tsx`
Verification: `src/components/table/use-cell-selection.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-14.7 - Reading and checking values

A column's `parseValue(text, row)` shall read typed, pasted and filled text as the cell's value; without it the text stays text, or becomes a number when the cell holds a number and the text reads as one by the default editor's rule (UIC-TABLE-11.2). Its `validateValue(value, row)` returns a message that refuses the value. A refused value in the default editor keeps it open, marks the input `aria-invalid` and `data-invalid`, and shows the message in a `ui-table__editor-message` alert; leaving the editor then drops the text.

Implementation: `src/components/table/table-cell-writes.ts`, `src/components/table/table-cell-editor.tsx`
Verification: `src/components/table/use-cell-selection.test.tsx`, `src/components/table/table-cell-writes.test.ts`, `e2e/table.spec.ts`

### UIC-TABLE-14.8 - Cell helpers

The table shall select and write cells with small pure functions: a grid of the visible rows and drawn columns locates cells by typed row key and column id, bounds a range from either corner, steps a cell inside the grid and places a cell on the edges of bounds; writes format values as text, read text through the column, keep only accepted changes of editable cells in enabled rows, copy, plan pastes, clears and fills, continue series and pick the direction of a dragged fill.

Implementation: `src/components/table/table-cell-range.ts`, `src/components/table/table-cell-writes.ts`
Verification: `src/components/table/table-cell-range.test.ts`, `src/components/table/table-cell-writes.test.ts`

### UIC-TABLE-14.9 - Tab-separated text

`formatTsv(rows)` shall join cells with tabs and rows with line breaks, quoting a cell that holds a tab, a line break or a quote and doubling its quotes; `parseTsv(text)` reads such text back, accepting Windows line breaks and a final line break, and reads empty text as no rows.

Implementation: `src/utils/tsv.ts`
Verification: `src/utils/tsv.test.ts`

## UIC-TABLE-15 - Selection bar and bulk edit

### UIC-TABLE-15.1 - Selection bar

In multiple selection, `selectionActions`, or a drawn column with `bulkEdit`, shall draw a selection bar (`ui-table__selection-bar`, an [Action Row](ACTION-ROW.md) selection bar of size `sm`) between the toolbar and the grid while rows are selected: the number of selected rows the table presents (every enabled one for `all`), a button and Escape that clear the selection, and the caller's actions.

Selection collection shall traverse nested rows once in reading order without constructing a separate descendant list for every parent, and skip traversal for an empty selection.

Implementation: `src/components/table/table-bulk-edit.tsx`, `src/components/table/use-table-selection.ts`, `src/components/table/use-table-model.ts`, `src/components/table/table.tsx`
Verification: `src/components/table/table-bulk-edit.test.tsx`, `src/components/table/use-table-selection.test.tsx`, `e2e/table.spec.ts`

### UIC-TABLE-15.2 - Bulk edit

When a drawn column has `bulkEdit`, the selection bar shall end with an `edit` action named by the provider's `editSelected` that opens a dialog (`ui-table__bulk-edit`, a [Modal](MODAL.md)) titled by the provider's `editRows` with the count. It holds a [Select Field](SELECT-FIELD.md) named by the provider's `field` that chooses among those columns, the first by default, and the field of the chosen column's type named by the column: a [Text Field](TEXT-FIELD.md) for `text`, a [Number Field](NUMBER-FIELD.md) for `number`, a date [Date Time Field](DATE-TIME-FIELD.md) for `date` (`YYYY-MM-DD`), a [Boolean Field](BOOLEAN-FIELD.md) for `boolean` and a Select Field of `options` for `choice`. Its `apply` button sets the value in that column of every selected row, skipping values the column's `validateValue` refuses and cells that already hold the value, reports the edits in one `onCellsChange` batch and closes the dialog; each opening starts afresh. The fields sit in a [Form](FORM.md): Apply first checks them as a submit does, so a draft the field cannot read, such as a partly entered date, shows its error and keeps the dialog open without an edit, while an empty field still clears the cells.

Implementation: `src/components/table/table-bulk-edit.tsx`, `src/core/strings/table.ts`
Verification: `src/components/table/table-bulk-edit.test.tsx`, `e2e/table.spec.ts`

## Hooks

| Hook                             | Kind      | Values                         | Description                                                                    |
| -------------------------------- | --------- | ------------------------------ | ------------------------------------------------------------------------------ |
| `ui-table`                       | root      |                                | The element holding the toolbar, the scroll area and the page navigation.      |
| `ui-table__toolbar`              | slot      |                                | The controls above the grid: the search field and the columns menu.            |
| `ui-table__filter`               | slot      |                                | The search field of a filterable table.                                        |
| `ui-table__filter-icon`          | slot      |                                | The search field's leading glyph (also `ui-icon`).                             |
| `ui-table__filter-input`         | slot      |                                | The search field's input.                                                      |
| `ui-table__filter-clear`         | slot      |                                | The search field's clear button.                                               |
| `ui-table__columns-menu`         | slot      |                                | The columns menu's trigger (also `ui-dropdown-menu`).                          |
| `ui-table__scroll`               | slot      |                                | React Aria's resizable container; the scroll area.                             |
| `ui-table__grid`                 | slot      |                                | The grid (`<table>`, or a `div` when virtualized).                             |
| `ui-table__header`               | slot      |                                | The header row group.                                                          |
| `ui-table__column-group`         | slot      |                                | A group header cell, or a gap over ungrouped columns.                          |
| `ui-table__column`               | slot      |                                | One column header.                                                             |
| `ui-table__column-content`       | slot      |                                | A data column header's label, sort glyph and filter; it takes dropped columns. |
| `ui-table__column-label`         | slot      |                                | A column header's content; it drags a reorderable column.                      |
| `ui-table__sort-icon`            | slot      |                                | A sortable header's sort glyph (also `ui-icon`).                               |
| `ui-table__column-filter`        | slot      |                                | A filterable header's filter button (also `ui-button`).                        |
| `ui-table__column-filter-dialog` | slot      |                                | A column filter's anchored dialog (also `ui-modal`).                           |
| `ui-table__resizer`              | slot      |                                | A resizable column's resizer.                                                  |
| `ui-table__body`                 | slot      |                                | The body row group.                                                            |
| `ui-table__row`                  | slot      |                                | One data row; it also carries the caller's `getRowAttributes`.                 |
| `ui-table__cell`                 | slot      |                                | One data row cell.                                                             |
| `ui-table__expand`               | slot      |                                | A row's expand button in the tree column (also `ui-icon` inside).              |
| `ui-table__expand-spacer`        | slot      |                                | Holds the expand button's place on a row without nested rows.                  |
| `ui-table__editor`               | slot      |                                | The default cell editor's input.                                               |
| `ui-table__editor-message`       | slot      |                                | The default editor's message for a refused value (`role="alert"`).             |
| `ui-table__fill-handle`          | slot      |                                | The handle at the bottom end corner of the selected cells.                     |
| `ui-table__detail-row`           | slot      |                                | A full-width row holding a row's detail.                                       |
| `ui-table__detail-cell`          | slot      |                                | The detail row's spanning cell.                                                |
| `ui-table__group-row`            | slot      |                                | A group header row.                                                            |
| `ui-table__group-cell`           | slot      |                                | A group header's first data cell: expand button, label and count.              |
| `ui-table__group-label`          | slot      |                                | A group header's label.                                                        |
| `ui-table__group-count`          | slot      |                                | A group header's number of rows.                                               |
| `ui-table__aggregate-cell`       | slot      |                                | A group header's cell under a column: its aggregate, or empty.                 |
| `ui-table__checkbox`             | slot      |                                | A selection checkbox (`<label>` around a visually hidden input).               |
| `ui-table__checkbox-box`         | slot      |                                | The checkbox's box, holding the check or minus glyph.                          |
| `ui-table__drag-handle`          | slot      |                                | A row's drag handle (also `ui-drag-handle`).                                   |
| `ui-table__drag-preview`         | slot      |                                | The custom image that follows the pointer during a row drag.                   |
| `ui-table__drop-indicator`       | slot      |                                | The row marking a drop position while dragging.                                |
| `ui-table__state-row`            | slot      |                                | The full-width notice row.                                                     |
| `ui-table__state-cell`           | slot      |                                | The notice row's spanning cell.                                                |
| `ui-table__loader`               | slot      |                                | The loading row after the rows while more load.                                |
| `ui-table__footer`               | slot      |                                | The summary row group (React Aria's table footer).                             |
| `ui-table__footer-row`           | slot      |                                | The summary row.                                                               |
| `ui-table__footer-cell`          | slot      |                                | One summary cell.                                                              |
| `ui-table__action-row`           | slot      |                                | The final nonselectable ordinary-content row.                                  |
| `ui-table__action-cell`          | slot      |                                | Its full-width content cell.                                                   |
| `ui-table__pagination`           | slot      |                                | The page navigation under a paginated grid (also `ui-pagination`).             |
| `ui-table__selection-bar`        | slot      |                                | The bar above the grid while rows are selected (also `ui-action-row`).         |
| `ui-table__bulk-edit`            | slot      |                                | The bulk edit dialog (also `ui-modal`).                                        |
| `data-size`                      | attribute | `sm`, `md`                     | Row height, on the root.                                                       |
| `data-kind`                      | attribute | `data`, `selection`, `actions` | What a column header, cell or summary cell holds.                              |
| `data-align`                     | attribute | `start`, `center`, `end`       | A data column's alignment, on its header and cells.                            |
| `data-column`                    | attribute |                                | A data column's id, on its header and cells.                                   |
| `data-sizing`                    | attribute | `content`, `flex`, `fixed`     | The effective sizing mode of a data column header.                             |
| `data-pinned`                    | attribute | `start`, `end`                 | The edge a pinned column's header and cells stay at.                           |
| `data-wrap`                      | attribute | `nowrap`, `wrap`, `anywhere`   | How a data column's cells, summary and aggregate cells wrap their text.        |
| `data-sort-priority`             | attribute |                                | A sorted header's place in a sort by several columns, from 1.                  |
| `data-count`                     | attribute |                                | The number of dragged rows, on the drag preview.                               |
| `data-variant`                   | attribute | `loading`, `empty`, `error`    | Which notice the notice row shows.                                             |
| `data-sort-direction`            | attribute | `ascending`, `descending`      | The sorted column's direction (React Aria).                                    |
| `data-resizable-direction`       | attribute | `left`, `right`, `both`        | Which ways a column can still be resized (React Aria).                         |
| `data-selection-mode`            | attribute | `single`, `multiple`           | The table's selection mode, on rows (React Aria).                              |
| `data-key`                       | attribute |                                | Opaque collection key (React Aria): not the `id`, not for styling.             |
| `data-collection`                | attribute |                                | React Aria's collection identifier; not for styling.                           |
| `data-column-index`              | attribute |                                | A cell's column index (React Aria).                                            |
| `data-level`                     | attribute |                                | A row's or cell's nesting level, from 1 (React Aria).                          |
| `data-sticky-header`             | state     | `true`                         | The header stays in view, on the root.                                         |
| `data-virtualized`               | state     | `true`                         | Only the rows in view render, on the root.                                     |
| `data-reordering`                | state     | `true`                         | The table reorders its rows now, on the root.                                  |
| `data-empty`                     | state     | `true`                         | The search field has no query (React Aria).                                    |
| `data-allows-sorting`            | state     | `true`                         | A sortable column header (React Aria).                                         |
| `data-allows-reordering`         | state     | `true`                         | A column header whose column can move.                                         |
| `data-drop-position`             | state     | `before`, `after`              | The header a dragged column would land beside, and on which side.              |
| `data-filtered`                  | state     | `true`                         | A header whose column filters the rows.                                        |
| `data-ungrouped`                 | state     | `true`                         | A group row cell over columns without a group.                                 |
| `data-editing`                   | state     | `true`                         | The cell whose editor is open.                                                 |
| `data-invalid`                   | state     | `true`                         | The default editor while the column refuses its value.                         |
| `data-in-range`                  | state     | `true`                         | A selected cell in spreadsheet mode.                                           |
| `data-range-top`                 | state     | `true`                         | A selected cell on the top edge of the selection.                              |
| `data-range-bottom`              | state     | `true`                         | A selected cell on the bottom edge of the selection.                           |
| `data-range-start`               | state     | `true`                         | A selected cell on the start edge of the selection.                            |
| `data-range-end`                 | state     | `true`                         | A selected cell on the end edge of the selection.                              |
| `data-fill-target`               | state     | `true`                         | A cell a dragged fill handle would fill.                                       |
| `data-tree-column`               | state     | `true`                         | A cell of the tree column (React Aria).                                        |
| `data-has-child-items`           | state     | `true`                         | A row with nested or detail rows, and its cells (React Aria).                  |
| `data-expanded`                  | state     | `true`                         | An expanded row and its cells (React Aria).                                    |
| `data-allows-dragging`           | state     | `true`                         | React Aria's drag support, on every grid: use `data-reordering`.               |
| `data-dragging`                  | state     | `true`                         | A row being dragged (React Aria), or a column header whose column drags.       |
| `data-drop-target`               | state     | `true`                         | The drop indicator or grid targeted by a drag (React Aria).                    |
| `data-resizing`                  | state     | `true`                         | A resizer being resized, or a virtualized column (React Aria).                 |
| `data-selected`                  | state     | `true`                         | A selected row or checked checkbox (React Aria).                               |
| `data-indeterminate`             | state     | `true`                         | The header checkbox while some rows are selected (React Aria).                 |
| `data-disabled`                  | state     | `true`                         | A disabled row, checkbox or drag handle (React Aria).                          |
| `data-hovered`                   | state     | `true`                         | Pointer over a row, header, resizer or control (React Aria).                   |
| `data-pressed`                   | state     | `true`                         | A row, header or control being pressed (React Aria).                           |
| `data-focused`                   | state     | `true`                         | A focused grid, header, row, cell or control (React Aria).                     |
| `data-focus-visible`             | state     | `true`                         | Keyboard focus on a grid, header, row, cell or control (React Aria).           |
| `data-focus-visible-within`      | state     | `true`                         | Keyboard focus inside a row (React Aria).                                      |
| `data-focus-visible-within-row`  | state     | `true`                         | Keyboard focus inside a cell's row, on the cell (React Aria).                  |
| `--ui-table-pin-offset`          | property  |                                | A pinned header's or cell's distance from its edge, in pixels.                 |
| `--ui-table-columns`             | property  |                                | A static table grid's column tracks, for `grid-template-columns`.              |
| `--ui-table-span`                | property  |                                | A group header cell's number of columns.                                       |
| `--ui-table-level`               | property  |                                | A tree column or group header cell's nesting level, from 1.                    |
