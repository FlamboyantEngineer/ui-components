# Grid Size Picker

`GridSizePicker` chooses a number of rows and columns, as for a new table, from a grid of cells: hovering or focusing a cell previews its size, a readout such as `3 × 4` repeats it, and the grid grows one row and one column past the preview up to its maximum. It is meant to sit in a [Popover](POPOVER.md) or a menu panel, from an insert command. A number typed by the reader belongs in a [Number Field](NUMBER-FIELD.md).

## UIC-GRID-SIZE-PICKER-1 - Grid and choice

### UIC-GRID-SIZE-PICKER-1.1 - Structure

`GridSizePicker` shall render a root `<div>` (`ui-grid-size-picker`) holding a `role="grid"` element (`ui-grid-size-picker__grid`) of `role="row"` elements (`ui-grid-size-picker__row`), each holding one `role="gridcell"` (`ui-grid-size-picker__cell`) per shown column, followed by the readout (`ui-grid-size-picker__readout`). The grid is named by `aria-label`, `aria-labelledby` or, without either, the provider's `gridSizePicker` string; it also takes `aria-describedby` and `aria-details`. Each cell is named by the provider's `gridSizeCell` string from the size it chooses (`3 rows by 4 columns`). The readout is hidden from assistive technology, since the focused cell already announces the size.

Implementation: `src/components/grid-size-picker/grid-size-picker.tsx`, `src/core/picker-strings.ts`
Verification: `src/components/grid-size-picker/grid-size-picker.test.tsx`, `e2e/grid-size-picker.spec.ts`

### UIC-GRID-SIZE-PICKER-1.2 - Preview and readout

The picker shall preview one size, 1 × 1 at first. Hovering a cell with a pointer, or focusing it, previews its size. Every cell within the previewed size publishes `data-in-range`, the cell at the previewed size publishes `data-active` and holds the grid's single tab stop, and the readout shows the provider's `gridSize` string for the preview (`3 × 4`). The preview stays when the pointer leaves the grid.

Implementation: `src/components/grid-size-picker/grid-size-picker.tsx`
Verification: `src/components/grid-size-picker/grid-size-picker.test.tsx`, `e2e/grid-size-picker.spec.ts`

### UIC-GRID-SIZE-PICKER-1.3 - Growth

The grid shall show one row more than the previewed rows and one column more than the previewed columns, at least `minRows` rows and `minColumns` columns (5 each by default) and at most `maxRows` rows and `maxColumns` columns (10 each by default). Setting the minimums to the maximums shows a fixed grid.

Implementation: `src/components/grid-size-picker/grid-size-picker.tsx`, `src/components/grid-size-picker/grid-size.ts`
Verification: `src/components/grid-size-picker/grid-size.test.ts`, `src/components/grid-size-picker/grid-size-picker.test.tsx`, `e2e/grid-size-picker.spec.ts`

### UIC-GRID-SIZE-PICKER-1.4 - Choosing

A press on a cell shall call `onSelect` with its size as `{ rows, columns }`; Enter or Space calls it with the size of the focused cell, which is the cell a screen reader announced even when the pointer previews another one. Cells take React Aria's press and hover interactions: a pointer press focuses the pressed cell, a touch that moves off the cell before it lifts or is cancelled chooses nothing, a screen reader's virtual click chooses the cell, and a touch does not preview by hovering.

Implementation: `src/components/grid-size-picker/grid-size-picker.tsx`
Verification: `src/components/grid-size-picker/grid-size-picker.test.tsx`, `e2e/grid-size-picker.spec.ts`

## UIC-GRID-SIZE-PICKER-2 - Keyboard, states and hooks

### UIC-GRID-SIZE-PICKER-2.1 - Keyboard

In the grid, the arrow keys shall move the preview one cell, left and right following the reading direction of the provider locale; Home and End move it to the first and last column of its row (the last allowed by `maxColumns`), and with Ctrl or Cmd to the first cell and to the cell at the maximum size. The preview never leaves 1 to the maximum on either axis. Focus follows the preview to its cell once the grid has grown to show it, and the grid keeps the keys it handles from the surface around it.

Implementation: `src/components/grid-size-picker/grid-size-picker.tsx`, `src/components/grid-size-picker/grid-size.ts`
Verification: `src/components/grid-size-picker/grid-size.test.ts`, `src/components/grid-size-picker/grid-size-picker.test.tsx`, `e2e/grid-size-picker.spec.ts`

### UIC-GRID-SIZE-PICKER-2.2 - Disabled

With `isDisabled`, the root shall publish `data-disabled`, the grid `aria-disabled`, no cell is in the tab order, and hovering, clicks and keys neither preview nor choose.

Implementation: `src/components/grid-size-picker/grid-size-picker.tsx`
Verification: `src/components/grid-size-picker/grid-size-picker.test.tsx`

### UIC-GRID-SIZE-PICKER-2.3 - Auto focus

With `autoFocus`, the picker shall focus the previewed cell when it mounts, so a popover that opens it can be used from the keyboard at once.

Implementation: `src/components/grid-size-picker/grid-size-picker.tsx`
Verification: `src/components/grid-size-picker/grid-size-picker.test.tsx`, `e2e/grid-size-picker.spec.ts`

### UIC-GRID-SIZE-PICKER-2.4 - Hooks and caller attributes

`GridSizePicker` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/grid-size-picker/grid-size-picker.tsx`, `labs/reference/grid-size-picker.css`
Verification: `src/components/grid-size-picker/grid-size-picker.test.tsx`

### UIC-GRID-SIZE-PICKER-2.5 - Changing bounds

When `maxRows` or `maxColumns` drops below the preview, the picker shall clamp the preview to the new bounds and keep it clamped when they grow again. When a bounds change, or a preview that shrinks the grid, removes the focused cell, focus moves to the cell at the preview, also while the picker is disabled; a picker that did not hold focus does not take it.

Implementation: `src/components/grid-size-picker/grid-size-picker.tsx`
Verification: `src/components/grid-size-picker/grid-size-picker.test.tsx`

## Hooks

| Hook                           | Kind  | Values | Description                                     |
| ------------------------------ | ----- | ------ | ----------------------------------------------- |
| `ui-grid-size-picker`          | root  |        | The picker's `<div>`.                           |
| `ui-grid-size-picker__grid`    | slot  |        | The grid (`role="grid"`).                       |
| `ui-grid-size-picker__row`     | slot  |        | One row of cells (`role="row"`).                |
| `ui-grid-size-picker__cell`    | slot  |        | One cell (`role="gridcell"`).                   |
| `ui-grid-size-picker__readout` | slot  |        | The previewed size as text, such as `3 × 4`.    |
| `data-disabled`                | state | `true` | On the root: the picker is disabled.            |
| `data-in-range`                | state | `true` | On a cell: within the previewed size.           |
| `data-active`                  | state | `true` | On a cell: at the previewed size; the tab stop. |
