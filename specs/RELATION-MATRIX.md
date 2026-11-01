# Relation Matrix

`RelationMatrix` shows how two sets of items relate, such as requirements against the tests that verify them: a grid with the row items down the start and the column items across the top, and a mark in each cell whose row and column items are related, drawn by the relation's kind. Each row and column header counts its relations, so rows and columns without any (the gaps in coverage) stand out. The reader moves between cells with the keyboard, and an owner that takes cell actions adds or removes relations, the matrix reporting each action as plain data. Large matrices window both axes. The grid is the library's own (`role="grid"`) rather than React Aria's table, which renders every column of each row and so cannot window columns.

## UIC-RELATION-MATRIX-1 - Layout

### UIC-RELATION-MATRIX-1.1 - Headers and cells

`RelationMatrix` shall render a grid named by its `aria-label` or `aria-labelledby` holding a header row (`ui-relation-matrix__header`) and a body (`ui-relation-matrix__body`) of one row (`ui-relation-matrix__row`) per entry of `rows`, in order. A matrix without rows has no body, since a row group must hold a row: the header row alone, which then holds the tab stop. The header row starts with a corner header (`ui-relation-matrix__corner`) reading `rowsLabel` (the provider's `relationItems` by default) and holds one column header (`ui-relation-matrix__column`) per entry of `columns` with its `label` in a `ui-relation-matrix__column-label` slot. Each row starts with its row header (`ui-relation-matrix__row-header`), its `label` in a `ui-relation-matrix__row-label` slot, followed by one cell (`ui-relation-matrix__cell`) per column. The header row is pinned to the top of the matrix and the corner and row headers to its start with functional sticky positions, and the rows and header carry a grid template (`auto` for the row headers, then `columnWidth` pixels, 32 by default, per column) for the stylesheet's grid layout.

Implementation: `src/components/relation-matrix/relation-matrix.tsx`, `src/components/relation-matrix/relation-matrix-header.tsx`, `src/components/relation-matrix/relation-matrix-row.tsx`
Verification: `src/components/relation-matrix/relation-matrix.test.tsx`, `e2e/relation-matrix.spec.ts`

### UIC-RELATION-MATRIX-1.2 - Coverage counts

Each row header and column header shall show how many of its cells are related in a `ui-relation-matrix__row-count` or `ui-relation-matrix__column-count` slot, as digits in the provider locale ([COUNT.md](COUNT.md)) hidden from assistive technology, which reads the provider's `relationCount` text instead (`No relations`, `1 relation`, `3 relations`). A row or column without relations publishes `data-uncovered` (on the row, its row header and the column header). Relations are indexed by cell from `relations`: the first relation of a cell counts, and relations whose row or column is not on the matrix are left out.

Implementation: `src/components/relation-matrix/relation-matrix-model.ts`, `src/components/relation-matrix/relation-matrix-header.tsx`, `src/components/relation-matrix/relation-matrix-row.tsx`, `src/core/strings/relation.ts`
Verification: `src/components/relation-matrix/relation-matrix-model.test.ts`, `src/components/relation-matrix/relation-matrix.test.tsx`, `e2e/relation-matrix.spec.ts`

### UIC-RELATION-MATRIX-1.3 - Relation marks

A related cell shall publish `data-related`, `data-kind` with its relation's `kind` (when it has one) and `data-tone` with the `tone` of that kind in `kinds` (`neutral` by default), and hold a mark (`ui-relation-matrix__mark`): the `check` glyph, hidden from assistive technology, and the kind's `label` as hidden text, or the provider's `related` text for a relation without a known kind. A cell without a relation is empty.

Implementation: `src/components/relation-matrix/relation-matrix-row.tsx`
Verification: `src/components/relation-matrix/relation-matrix.test.tsx`, `e2e/relation-matrix.spec.ts`

### UIC-RELATION-MATRIX-1.4 - Long column labels

`columnLabels` shall publish on the root as `data-column-labels`: `rotated` (the default) asks the stylesheet to turn column labels on their side, `truncated` to cut them. Each column label is a [Truncation Tooltip](TRUNCATION-TOOLTIP.md), which shows a cut label whole while its header is hovered or focused.

Implementation: `src/components/relation-matrix/relation-matrix.tsx`, `src/components/relation-matrix/relation-matrix-header.tsx`, `labs/reference/relation-matrix.css`
Verification: `src/components/relation-matrix/relation-matrix.test.tsx`, `e2e/relation-matrix.spec.ts`

### UIC-RELATION-MATRIX-1.5 - Hooks and caller attributes

`RelationMatrix` shall carry the hooks below, append the caller's `className` to the root and forward `id`, `ref`, the ARIA labelling attributes and caller `data-*` attributes to it; caller attributes never replace a hook attribute.

Implementation: `src/components/relation-matrix/relation-matrix.tsx`, `src/components/relation-matrix/relation-matrix-hooks.ts`
Verification: `src/components/relation-matrix/relation-matrix.test.tsx`

## UIC-RELATION-MATRIX-2 - Interaction

### UIC-RELATION-MATRIX-2.1 - Keyboard grid navigation

The grid shall hold one tab stop, on its focused cell (the first body cell at first). ArrowUp, ArrowDown, ArrowLeft and ArrowRight move it one cell (left and right swap in right-to-left text) through the body cells, the row headers and the header row; PageUp and PageDown move it by the rows a page of the matrix shows; Home and End move it to the row header or the last cell of its row, and with Control or Command to the corner header or the last cell of the last row. The moved-to cell takes focus and scrolls into view clear of the pinned headers. Positions are read in the scroller's own pixels, so this holds under an ancestor `transform: scale()` as without one. A cell focused by pointer becomes the focused cell. While focus is in the grid, the row header of the focused cell's row and the header of its column publish `data-current`, for a crosshair highlight.

Implementation: `src/components/relation-matrix/use-matrix-navigation.ts`, `src/components/relation-matrix/matrix-navigation.ts`
Verification: `src/components/relation-matrix/matrix-navigation.test.ts`, `src/components/relation-matrix/relation-matrix.test.tsx`, `e2e/relation-matrix.spec.ts`

### UIC-RELATION-MATRIX-2.2 - Cell actions

With `onCellAction`, a press on a body cell, or Enter or Space while it has focus, shall call `onCellAction({ row, column, relation })` with the cell's row and column keys and its relation (`null` for an empty cell), and the root publishes `data-actionable`. The matrix never changes its relations itself: the owner adds or removes the relation and renders the matrix again; `toggleRelation(relations, { row, column, kind })` returns the relations with that cell's relation removed, or added with `kind` when it had none. Without `onCellAction` a press only moves focus.

Numeric and text keys with the same characters shall remain separate row and column identities during rendering, navigation and actions.

Implementation: `src/components/relation-matrix/relation-matrix.tsx`, `src/components/relation-matrix/relation-matrix-row.tsx`, `src/components/relation-matrix/use-matrix-navigation.ts`, `src/components/relation-matrix/relation-matrix-model.ts`
Verification: `src/components/relation-matrix/relation-matrix.test.tsx`, `src/components/relation-matrix/relation-matrix-model.test.ts`, `e2e/relation-matrix.spec.ts`

### UIC-RELATION-MATRIX-2.3 - Focus across row and column changes

The focused cell shall belong to its row and column items, not to their places: when `rows` or `columns` reorder, grow or are filtered, the tab stop and the `data-current` headers follow those items, and DOM focus stays on their cell. Keys act from the cell that holds focus: Enter and Space report its row and column, and arrows and the other movement keys start from it. When the focused cell's row or column item goes away, the cell now at its place takes the tab stop (the last one when the axis got shorter, the header when the axis is empty), and takes focus when the cell that went held it. A matrix that had no rows or columns when it mounted binds its focused cell to the items at its place once they arrive, so it follows them in the same way. Virtualized matrices keep the focused cell rendered at its item's new place.

Implementation: `src/components/relation-matrix/use-matrix-navigation.ts`, `src/components/relation-matrix/matrix-navigation.ts`, `src/components/relation-matrix/relation-matrix.tsx`
Verification: `src/components/relation-matrix/matrix-navigation.test.ts`, `src/components/relation-matrix/relation-matrix-focus.test.tsx`, `e2e/relation-matrix.spec.ts`

## UIC-RELATION-MATRIX-3 - Large matrices

### UIC-RELATION-MATRIX-3.1 - Windowing both axes

`virtualized` shall render only the rows and columns in view of the matrix's scroll container, plus two on each side and the focused cell's row and column, from its scroll offsets (read from the container when `virtualized` turns on, so the first window covers where it already stands), its measured size, the measured header row and corner header, `rowHeight` (32 pixels by default) and `columnWidth`. The body takes the height of every row, each rendered row is positioned at its offset with a functional absolute position and height, and the grid template stands one track in for each run of columns left out, so rendered columns keep their place. The root publishes `data-virtualized`, and the stylesheet bounds the matrix's size and makes it scroll. Rows and columns keep `aria-rowindex` and `aria-colindex` in the whole matrix, and the grid its `aria-rowcount` and `aria-colcount`.

Implementation: `src/components/relation-matrix/use-matrix-window.ts`, `src/components/relation-matrix/matrix-window.ts`, `src/components/relation-matrix/relation-matrix.tsx`, `src/components/relation-matrix/relation-matrix-row.tsx`
Verification: `src/components/relation-matrix/matrix-window.test.ts`, `src/components/relation-matrix/relation-matrix.test.tsx`, `e2e/relation-matrix.spec.ts`

## UIC-RELATION-MATRIX-4 - Accessibility

### UIC-RELATION-MATRIX-4.1 - Grid semantics

The matrix shall be a `grid` with `aria-rowcount` and `aria-colcount` counting the header row and the row header column; the header row and each body row are `row`s with `aria-rowindex`, the corner and column headers `columnheader`s, the row headers `rowheader`s and the cells `gridcell`s, each with `aria-colindex`, so a screen reader names a cell by its row and column. Counts and marks are read as text, never as bare numbers or glyphs.

Implementation: `src/components/relation-matrix/relation-matrix.tsx`, `src/components/relation-matrix/relation-matrix-header.tsx`, `src/components/relation-matrix/relation-matrix-row.tsx`
Verification: `src/components/relation-matrix/relation-matrix.test.tsx`, `e2e/relation-matrix.spec.ts`

### UIC-RELATION-MATRIX-4.2 - The library's own grid

The matrix shall render its own grid rather than React Aria's `Table` or `GridList` (UIC-COLLECTIONS-1.5): React Aria's table renders every column of each row, so it cannot window columns (UIC-RELATION-MATRIX-3.1). The grid therefore writes its roles, `aria-rowindex`, `aria-colindex`, counts and a roving `tabIndex` itself, and keeps this keyboard contract, which differs from the library's tables on purpose:

- One tab stop: Tab and Shift+Tab leave the grid from the focused cell and return to it.
- Movement by UIC-RELATION-MATRIX-2.1 only, through the headers too. Typed characters do not move focus: there is no typeahead.
- No selection: no cell, row or column is selected, nothing publishes `aria-selected` or `data-selected`, and Shift with a movement key only moves.
- Enter and Space act on a body cell (UIC-RELATION-MATRIX-2.2) and do nothing on a header.

The provider's `related` text is looked up once per row, not per cell.

Implementation: `src/components/relation-matrix/relation-matrix.tsx`, `src/components/relation-matrix/relation-matrix-row.tsx`, `src/components/relation-matrix/use-matrix-navigation.ts`
Verification: `src/components/relation-matrix/relation-matrix.test.tsx`

## Hooks

| Hook                               | Kind      | Values                                            | Description                                                           |
| ---------------------------------- | --------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| `ui-relation-matrix`               | root      |                                                   | The grid (`role="grid"`) and its scroll container.                    |
| `ui-relation-matrix__header`       | slot      |                                                   | The header row, pinned to the top.                                    |
| `ui-relation-matrix__corner`       | slot      |                                                   | The corner header naming the row headers, pinned to the start.        |
| `ui-relation-matrix__column`       | slot      |                                                   | A column header.                                                      |
| `ui-relation-matrix__column-label` | slot      |                                                   | A column's label (also `ui-truncation-tooltip`).                      |
| `ui-relation-matrix__column-count` | slot      |                                                   | A column's relation count.                                            |
| `ui-relation-matrix__body`         | slot      |                                                   | The body rows (`role="rowgroup"`), absent without rows.               |
| `ui-relation-matrix__row`          | slot      |                                                   | A body row.                                                           |
| `ui-relation-matrix__row-header`   | slot      |                                                   | A row's header, pinned to the start.                                  |
| `ui-relation-matrix__row-label`    | slot      |                                                   | A row's label.                                                        |
| `ui-relation-matrix__row-count`    | slot      |                                                   | A row's relation count.                                               |
| `ui-relation-matrix__cell`         | slot      |                                                   | A body cell.                                                          |
| `ui-relation-matrix__mark`         | slot      |                                                   | A related cell's mark.                                                |
| `data-column-labels`               | attribute | `rotated`, `truncated`                            | How the stylesheet fits long column labels.                           |
| `data-virtualized`                 | state     | `true`                                            | Only the rows and columns in view render.                             |
| `data-actionable`                  | state     | `true`                                            | Cells take actions.                                                   |
| `data-uncovered`                   | state     | `true`                                            | A row (and its row header) or column header without relations.        |
| `data-current`                     | state     | `true`                                            | The row header and column header of the focused cell, while in focus. |
| `data-related`                     | state     | `true`                                            | A cell holding a relation.                                            |
| `data-kind`                        | state     |                                                   | A related cell's relation kind.                                       |
| `data-tone`                        | state     | `neutral`, `info`, `success`, `warning`, `danger` | A related cell's tone, from its kind.                                 |
