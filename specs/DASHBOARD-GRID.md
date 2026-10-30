# Dashboard Grid

`DashboardGrid` lays tiles out on a grid of whole columns and rows, each tile placed by plain `{ id, x, y, w, h }` data, as dashboards of cards and charts are. In edit mode each `DashboardTile` shows a move handle and a resize handle that work by pointer drag and by the arrow keys, with React Aria's move interaction; a tile moved or grown onto others pushes them down. A narrow grid reflows its tiles onto fewer columns.

## UIC-DASHBOARD-GRID-1 - Grid

### UIC-DASHBOARD-GRID-1.1 - Parts and placement

`DashboardGrid` shall render a `ui-dashboard-grid` element whose inline grid tracks are `columns` equal columns (12 by default) and as many rows of `rowHeight` pixels (80 by default) as the lowest tile reaches, and render `children(item)` for each item of its layout, in reading order (by row, then column). `DashboardTile` renders a `ui-dashboard-grid__tile` element placed inline on the columns and rows of its item (`grid-column: x + 1 / span w`, `grid-row: y + 1 / span h`), holding its `children` in a `ui-dashboard-grid__tile-content` slot. The reference sheet draws the root as a CSS grid.

Implementation: `src/components/dashboard-grid/dashboard-grid.tsx`, `src/components/dashboard-grid/dashboard-tile.tsx`
Verification: `src/components/dashboard-grid/dashboard-grid.test.tsx`, `e2e/dashboard-grid.spec.ts`

### UIC-DASHBOARD-GRID-1.2 - Layout data

The layout shall be controlled with `layout` and `onLayoutChange` or uncontrolled from `defaultLayout`; with `persistKey`, the uncontrolled layout is remembered through the provider storage adapter ([PROVIDER.md](PROVIDER.md)) under that key. A stored layout that is not a list of items, each with a numeric or text `id` and finite numbers for `x`, `y`, `w` and `h`, is refused whole, and the grid starts from `defaultLayout` and stores its next change as usual. `onLayoutChange` receives the whole layout after each move or resize. Numeric and text item IDs with the same spelling identify distinct tiles; a reading-order change preserves their content and handles. The grid shows the layout normalised: coordinates rounded to whole cells, each tile at least one cell and kept inside the columns, the first of repeated ids kept, and overlapping tiles settled in reading order, each moving down just below a tile settled before it.

Implementation: `src/components/dashboard-grid/dashboard-grid.tsx`, `src/components/dashboard-grid/dashboard-layout.ts`
Verification: `src/components/dashboard-grid/dashboard-layout.test.ts`, `src/components/dashboard-grid/dashboard-grid.test.tsx`

### UIC-DASHBOARD-GRID-1.3 - Hooks and caller attributes

`DashboardGrid` and `DashboardTile` shall carry the hooks below, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to their elements; caller attributes never replace a hook attribute.

Implementation: `src/components/dashboard-grid/dashboard-grid.tsx`, `src/components/dashboard-grid/dashboard-tile.tsx`
Verification: `src/components/dashboard-grid/dashboard-grid.test.tsx`

## UIC-DASHBOARD-GRID-2 - Editing

### UIC-DASHBOARD-GRID-2.1 - Edit mode

With `isEditing`, the root shall publish `data-editing` and each tile shall show a `ui-dashboard-grid__move` button before its content, holding the decorative built-in `drag-handle` glyph, and a `ui-dashboard-grid__resize` button after it, holding the `resize` glyph. Without it the tiles show no handles. Leaving edit mode or entering a responsive read-only layout shall discard any unfinished pointer move or resize, restore the committed geometry, clear the moving state and report no layout change. Returning to edit mode starts from the committed layout.

Implementation: `src/components/dashboard-grid/dashboard-grid.tsx`, `src/components/dashboard-grid/dashboard-tile.tsx`
Verification: `src/components/dashboard-grid/dashboard-grid.test.tsx`, `e2e/dashboard-grid.spec.ts`

### UIC-DASHBOARD-GRID-2.2 - Moving

Dragging a move handle with a pointer shall move its tile by whole cells, to the cell nearest the pointer's travel (one column step being the grid's width plus its column gap divided by the columns, and one row step the row height plus the row gap), and each arrow key press on it moves the tile one cell; the right arrow moves toward the inline end in left-to-right text and the left arrow in right-to-left text. While a pointer drag lasts, the tile publishes `data-moving` and the grid shows where every tile would go, drawing the tiles again only when the drag reaches another cell; when it ends, or after each key press, the layout changes. A move or resize that leaves every tile where it was, such as an arrow key pressed against an edge, reports no layout change and announces nothing.

Implementation: `src/components/dashboard-grid/dashboard-tile.tsx`, `src/components/dashboard-grid/use-tile-move.ts`, `src/components/dashboard-grid/dashboard-grid.tsx`, `src/primitives/drag-and-drop.ts`
Verification: `src/components/dashboard-grid/dashboard-grid.test.tsx`, `e2e/dashboard-grid.spec.ts`

### UIC-DASHBOARD-GRID-2.3 - Resizing

The resize handle shall change its tile's span from its bottom end corner in the same way, by pointer drag and arrow keys (the arrow toward the inline end, ArrowRight left to right and ArrowLeft right to left, and ArrowDown grow it), never below `minColumnSpan` columns or `minRowSpan` rows (1 by default) nor past the last column: a resize keeps the tile's start column, so at the last column it stops growing; the tile publishes `data-resizing` while a pointer drag lasts.

Implementation: `src/components/dashboard-grid/dashboard-tile.tsx`, `src/components/dashboard-grid/use-tile-move.ts`
Verification: `src/components/dashboard-grid/dashboard-grid.test.tsx`, `e2e/dashboard-grid.spec.ts`

### UIC-DASHBOARD-GRID-2.4 - Pushing tiles down

A tile moved or resized shall stay where it is put, kept inside the columns, and every tile it then overlaps moves down just below it, pushing the tiles below that one in turn; tiles it does not reach stay where they are.

Implementation: `src/components/dashboard-grid/dashboard-layout.ts`
Verification: `src/components/dashboard-grid/dashboard-layout.test.ts`, `src/components/dashboard-grid/dashboard-grid.test.tsx`, `e2e/dashboard-grid.spec.ts`

### UIC-DASHBOARD-GRID-2.5 - Announcements

After a move or resize that changes the layout, a polite live region (`role="status"`, the visually hidden `ui-dashboard-grid__status`) shall announce the tile's new place through the provider's `tileMoved` string (`Visitors moved to column 2, row 1`) or its new span through `tileResized` (`Visitors resized to 6 columns by 3 rows`).

Implementation: `src/components/dashboard-grid/dashboard-grid.tsx`, `src/components/dashboard-grid/dashboard-tile.tsx`, `src/core/dashboard-strings.ts`
Verification: `src/components/dashboard-grid/dashboard-grid.test.tsx`, `e2e/dashboard-grid.spec.ts`

### UIC-DASHBOARD-GRID-2.6 - Focus stays on the handle

A keyboard move or resize that reorders the tiles shall leave focus on the handle that made it.

Implementation: `src/components/dashboard-grid/dashboard-tile.tsx`
Verification: `src/components/dashboard-grid/dashboard-grid.test.tsx`, `e2e/dashboard-grid.spec.ts`

### UIC-DASHBOARD-GRID-2.7 - Layout changes during a gesture

A pointer move or resize shall belong to the layout its tile had when it started. When `layout` or `columns` change before it ends, the gesture is placed again on the current layout: tiles added, removed or moved meanwhile keep their current data in the preview and in the layout `onLayoutChange` reports, and a new layout array equal to the last one changes nothing. When the gesture's own tile was removed, or its cells changed (including by fitting fewer columns), the gesture is cancelled: the grid shows the current layout, clears the moving state, and the rest of that drag reports no layout change and announces nothing.

Implementation: `src/components/dashboard-grid/dashboard-grid.tsx`, `src/components/dashboard-grid/use-tile-move.ts`
Verification: `src/components/dashboard-grid/dashboard-grid-external.test.tsx`, `e2e/dashboard-grid.spec.ts`

## UIC-DASHBOARD-GRID-3 - Responsive columns

### UIC-DASHBOARD-GRID-3.1 - Fewer columns when narrow

With `minColumnWidth`, a grid whose measured width holds fewer than `columns` columns of that width shall show as many as fit (at least one) and publish `data-reflowed`: each tile's column and span scale in proportion to the new count (spanning at least one column) and the tiles settle in reading order. A reflowed grid is read only: it shows no handles and reports no layout changes, so the layout keeps its full column count.

Implementation: `src/components/dashboard-grid/dashboard-grid.tsx`, `src/components/dashboard-grid/dashboard-layout.ts`
Verification: `src/components/dashboard-grid/dashboard-layout.test.ts`, `src/components/dashboard-grid/dashboard-grid.test.tsx`, `e2e/dashboard-grid.spec.ts`

## UIC-DASHBOARD-GRID-4 - Accessibility

### UIC-DASHBOARD-GRID-4.1 - Named groups and handles

The root shall be a group (`role="group"`) named by `aria-label` or `aria-labelledby`, and each tile a group named by its `label`. The handles are buttons named by the provider's `moveTile` and `resizeTile` strings with the tile's label (`Move Visitors`, `Resize Visitors`).

Implementation: `src/components/dashboard-grid/dashboard-grid.tsx`, `src/components/dashboard-grid/dashboard-tile.tsx`
Verification: `src/components/dashboard-grid/dashboard-grid.test.tsx`, `e2e/dashboard-grid.spec.ts`

## Hooks

| Hook                              | Kind  | Values | Description                                                |
| --------------------------------- | ----- | ------ | ---------------------------------------------------------- |
| `ui-dashboard-grid`               | root  |        | The grid (`role="group"`); inline column and row tracks.   |
| `ui-dashboard-grid__tile`         | slot  |        | `DashboardTile`'s group, placed inline on its cells.       |
| `ui-dashboard-grid__tile-content` | slot  |        | The tile's content.                                        |
| `ui-dashboard-grid__move`         | slot  |        | The move handle, in edit mode.                             |
| `ui-dashboard-grid__resize`       | slot  |        | The resize handle at the tile's bottom end, in edit mode.  |
| `ui-dashboard-grid__status`       | slot  |        | The visually hidden live region that announces changes.    |
| `data-editing`                    | state | `true` | The grid shows its handles.                                |
| `data-reflowed`                   | state | `true` | The grid shows fewer columns than its layout's, read only. |
| `data-moving`                     | state | `true` | A tile whose move handle a pointer is dragging.            |
| `data-resizing`                   | state | `true` | A tile whose resize handle a pointer is dragging.          |
