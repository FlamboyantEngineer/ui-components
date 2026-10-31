# Board

`Board` lays cards out in columns, one per value of a grouping the owner chooses (a status, a stage, an owner), optionally repeated in lanes (swimlanes) for a second grouping. Each column has a header with its title, its card count against an optional limit, a collapse toggle and optional caller actions; each lane has a header with its title, its count and a collapse toggle. Every cell (one column in one lane) is a React Aria grid list of the caller's card content. Cards move within and between cells by pointer or keyboard drag and drop and by Alt+Arrow keys, and columns reorder, each move reported as plain data for the owner to apply, as for [Tree reordering](TREE-REORDER.md) and [List View](LIST-ROW.md#uic-list-row-35---drag-and-drop). Long cells virtualize ([COLLECTIONS.md](COLLECTIONS.md)).

Pointer ownership and drag lifecycle cleanup follow the shared [drag interaction contract](DRAG-INTERACTIONS.md).

## UIC-BOARD-1 - Layout

### UIC-BOARD-1.1 - Columns, cells and cards

`Board` shall render a group named by its `aria-label` or `aria-labelledby` holding a row of column headers (`ui-board__columns`), one `ui-board__column` per entry of `columns` with its `title` in a `ui-board__column-title` slot, then a row of cells (`ui-board__cells`) with one `ui-board__cell` per column. Each cell holds a React Aria grid list (`ui-board__cards`) named by its column's title, with one `ui-board__card` row per card of the cell in the order of `items`, its content drawn by `renderCard` in a `ui-board__card-content` slot. `getColumn` places each item in a column (items whose column is not on the board are left out), `getTextValue` gives each card the text typeahead matches, and Enter or a press on a card calls `onAction` with its key. The board reads items only through `id`, the accessors and `renderCard`.

Implementation: `src/components/board/board.tsx`, `src/components/board/board-cell.tsx`, `src/components/board/board-lane.tsx`, `src/components/board/board-column-header.tsx`
Verification: `src/components/board/board.test.tsx`, `e2e/board.spec.ts`

### UIC-BOARD-1.2 - Counts and limits

Each column header shall show its card count across lanes in a `ui-board__column-count` slot: the count alone, or `count/limit` for a column with a `limit`, read by assistive technology as the provider's `cardCount` string (`3 cards`, `3 cards, limit 5`, `6 cards, over the limit of 5`). A column holding more cards than its limit publishes `data-over-limit` on its header and on each of its cells.

Implementation: `src/components/board/board-column-header.tsx`, `src/components/board/use-board-model.ts`, `src/core/planning-strings.ts`, `labs/reference/board.css`
Verification: `src/components/board/board.test.tsx`, `e2e/board.spec.ts`

### UIC-BOARD-1.3 - Lanes

With `lanes`, the board shall render one group per lane (`ui-board__lane`), named by its header (`ui-board__lane-header`): a collapse toggle, the lane's `title` in a `ui-board__lane-title` slot and its card count across columns in a `ui-board__lane-count` slot, read as the provider's `cardCount` string. The lane's cells follow its header, one per column, each grid list named by its column's title and the lane's title. `getLane` places each card in a lane; cards whose lane is not on the board are left out.

Implementation: `src/components/board/board-lane.tsx`, `src/components/board/board-moves.ts`
Verification: `src/components/board/board.test.tsx`, `src/components/board/board-moves.test.ts`, `e2e/board.spec.ts`

### UIC-BOARD-1.4 - Collapsing columns and lanes

Each column header and lane header shall hold an [ExpandToggle](EXPAND-TOGGLE.md) (`ui-board__column-toggle`, `ui-board__lane-toggle`) named by the provider's `collapsePanel` or `expandPanel` string with the title. A collapsed column publishes `data-collapsed` on its header and cells, and its cells stay as empty placeholders, so the stylesheet can draw a narrow column while the lanes keep their columns aligned. The reference sheet draws a collapsed column as a 44px panel that starts in the header row, toggle first, and runs its title (cut when too long), count and actions down over its placeholder cells, so collapsing any set of columns leaves the header row at its height with none collapsed; a collapsed lane publishes `data-collapsed` and hides its cells. The collapsed columns are controlled with `collapsedColumns` and `onCollapsedColumnsChange` or uncontrolled from `defaultCollapsedColumns`, and the collapsed lanes likewise with `collapsedLanes`, `onCollapsedLanesChange` and `defaultCollapsedLanes`. With `persistKey`, the uncontrolled collapsed columns and lanes are remembered through the provider storage adapter ([PROVIDER.md](PROVIDER.md)) under `<persistKey>:columns` and `<persistKey>:lanes`, as lists of keys in which numeric and text keys stay distinct. A stored value that is not a list of keys falls back to the default collapsed columns or lanes.

Implementation: `src/components/board/board-column-header.tsx`, `src/components/board/board-lane.tsx`, `src/components/board/use-board-collapse.ts`, `src/components/board/board-cell.tsx`
Verification: `src/components/board/board.test.tsx`, `e2e/board.spec.ts`

### UIC-BOARD-1.5 - Empty cells

A cell without cards shall draw a small [EmptyState](EMPTY-STATE.md) reading the provider's `noCards` string in a `ui-board__empty` slot, and its grid list publishes `data-empty`. An empty cell still takes dropped cards.

Implementation: `src/components/board/board-cell.tsx`
Verification: `src/components/board/board.test.tsx`, `e2e/board.spec.ts`

### UIC-BOARD-1.6 - Adding cards

With `onAddCard`, every open cell shall end with a [Button](BUTTON.md) (`ui-board__add`) reading the provider's `addCard` string, described by its column's title (and its lane's), that calls `onAddCard({ column, lane })` with the cell's column key and lane key (`null` without lanes). Without `onAddCard` no button renders.

Implementation: `src/components/board/board-cell.tsx`
Verification: `src/components/board/board.test.tsx`, `e2e/board.spec.ts`

### UIC-BOARD-1.7 - Virtualized cells

`virtualized` shall render each cell's grid list through React Aria's `Virtualizer` with its list layout, measuring each card from an estimate, so only the cards in view of the cell (plus a small buffer) are in the document; keyboard navigation and drag and drop reach every card. The root and each grid list publish `data-virtualized`, and the stylesheet bounds the cells' height.

Implementation: `src/components/board/board-cell.tsx`, `labs/reference/board.css`
Verification: `src/components/board/board.test.tsx`, `e2e/board.spec.ts`

### UIC-BOARD-1.8 - Hooks and caller attributes

`Board` shall carry the hooks below, append the caller's `className` to the root, and forward `id`, the ARIA labelling attributes and caller `data-*` attributes to it; caller attributes never replace a hook attribute.

Implementation: `src/components/board/board.tsx`, `src/components/board/board-hooks.ts`
Verification: `src/components/board/board.test.tsx`

### UIC-BOARD-1.9 - Column actions

With `renderColumnActions`, each column header shall end with a `ui-board__column-actions` slot holding what the callback returns for that column, called with the column's own entry of `columns`; a column for which it returns `null`, `undefined` or `false`, and every column without the callback, renders no slot. The slot follows the title and count in reading and tab order, also in a collapsed column, and its controls stay keyboard accessible. Pressing or activating a control in the slot never collapses the column or activates a card, and a pointer drag that starts in the slot never drags the column while the board takes column moves.

Implementation: `src/components/board/board.tsx`, `src/components/board/board-column-header.tsx`, `labs/reference/board.css`
Verification: `src/components/board/board.test.tsx`, `e2e/board.spec.ts`

### UIC-BOARD-1.10 - Header icons

A `BoardColumn` or `BoardLane` with an `icon` (an icon component or a rendered element, as `Button` takes) shall draw it as a decorative icon, hidden from assistive technology, in a `ui-board__column-icon` or `ui-board__lane-icon` slot between the collapse toggle and the title; without one no slot renders. The title alone still names the column's or lane's cells and the count reads as before. `renderColumnActions` receives the column entry with its `icon`. The reference sheet keeps the icon from shrinking, aligned with the title, and upright in a collapsed column, without making the header row taller ([UIC-BOARD-1.4](#uic-board-14---collapsing-columns-and-lanes)).

Implementation: `src/components/board/board.tsx`, `src/components/board/board-column-header.tsx`, `src/components/board/board-lane.tsx`, `labs/reference/board.css`
Verification: `src/components/board/board-icons.test.tsx`, `e2e/board.spec.ts`

## UIC-BOARD-2 - Card moves

### UIC-BOARD-2.1 - Cells from data

The board shall sort its items into cells by `getColumn` (and `getLane`), keeping their order in `items`; a move names its cell by these keys and its place by the neighbouring card, so the owner applies it to its own data.

Implementation: `src/components/board/board-moves.ts`
Verification: `src/components/board/board-moves.test.ts`

### UIC-BOARD-2.2 - Drag and drop

With `onMove`, the reader shall move a card within its cell, to another column or to another lane by pointer drag and drop, or by keyboard and assistive technology from the card's [DragHandle](DRAG-HANDLE.md) (`ui-board__card-handle`), through React Aria's `useDragAndDrop` on every cell. Each accepted drop reports one `onMove({ key, column, lane, targetKey, position })`: the card `key` lands in the cell of `column` and `lane` (`null` without lanes), before or after the card `targetKey`, or with `targetKey: null` in a cell holding no other card. A drop on a card rather than beside it, or one that leaves the card where it is, is refused. Cards carry a media type of their own board, so another board refuses them. The dragged card publishes `data-dragging`, a cell or card under a drop `data-drop-target`, and the landing spot between cards is a `ui-board__drop-indicator` with `data-position` (`before`, `after`) and `data-drop-target`. Without `onMove` no card drags.

Implementation: `src/components/board/use-board-drag.ts`, `src/components/board/board-moves.ts`, `src/components/board/board-cell.tsx`
Verification: `src/components/board/board.test.tsx`, `src/components/board/board-moves.test.ts`, `e2e/board.spec.ts`

### UIC-BOARD-2.3 - Keyboard moves

With `onMove`, Alt+ArrowUp and Alt+ArrowDown on a card shall report the move past its neighbouring card in the cell, and Alt+ArrowLeft and Alt+ArrowRight (mirrored right to left) the move to the same place in the neighbouring open column of its lane, at the end when that cell holds fewer cards; collapsed columns are skipped. Focus stays on the moved card once the owner renders the move, following the shared [focus request lifecycle](STEP-LIST-EDITOR.md#uic-step-list-editor-42---focus-after-an-edit); in a virtualized cell that does not render the moved card, the cell scrolls toward it until it renders and takes focus. At either end the chord is claimed and moves nothing. Cards publish the chords in `aria-keyshortcuts`.

Card, column and lane keys retain their primitive type; numeric `1` and text `"1"` identify separate items. Card actions, moves and focus restoration shall preserve that distinction, including keys containing whitespace. Public callbacks retain the original keys; a card's React Aria `data-key` is opaque.

Implementation: `src/components/board/board.tsx`, `src/components/board/board-moves.ts`, `src/components/board/board-cell.tsx`
Verification: `src/components/board/board.test.tsx`, `src/components/board/board-moves.test.ts`, `e2e/board.spec.ts`

### UIC-BOARD-2.4 - Applying moves

`applyBoardMove(items, move, place)` shall return the items after a card move without changing them: the moved item, given its new cell by the owner's `place(item, { column, lane })`, lands before or after its target, or at the end without one; an unknown card leaves the items as they were. `applyColumnMove(columns, move)` shall return the columns after a column move. They suit owners that keep cards in one ordered array.

Implementation: `src/components/board/board-moves.ts`
Verification: `src/components/board/board-moves.test.ts`, `e2e/board.spec.ts`

## UIC-BOARD-3 - Column moves

### UIC-BOARD-3.1 - Dragging columns

With `onColumnMove`, each column header shall start with a drag handle (`ui-board__column-handle`, an [Button](BUTTON.md) named by the provider's `moveColumn` string with the title), and the reader shall drag a column header onto another by pointer (React Aria's `useDrag` and `useDrop`): the dragged column takes the target's slot, reported as one `onColumnMove({ key, targetKey, position })`, `after` when it comes from the start side and `before` otherwise. The dragged header publishes `data-dragging` and the header under it `data-drop-target` with `data-position`. Without `onColumnMove` no handle renders and no header drags.

Implementation: `src/components/board/board-column-header.tsx`, `src/components/board/use-board-drag.ts`, `src/components/board/board-moves.ts`
Verification: `src/components/board/board.test.tsx`, `src/components/board/board-moves.test.ts`, `e2e/board.spec.ts`

### UIC-BOARD-3.2 - Keyboard column moves

Alt+ArrowLeft and Alt+ArrowRight on a column's drag handle (mirrored right to left) shall report the move of the column one place, keeping focus on its handle once the owner renders the move; at either end they do nothing. Enter on the handle shall start a keyboard drag of the column (React Aria's drag button), which lands on the other column headers in turn as Tab moves and drops on Enter, reported as for a pointer drop. The handle publishes both chords in `aria-keyshortcuts` and is described by React Aria's drag button description, which tells the reader how to start a keyboard drag.

Implementation: `src/components/board/board-column-header.tsx`, `src/components/board/board.tsx`, `src/components/board/board-moves.ts`, `src/utils/use-item-drag.ts`
Verification: `src/components/board/board.test.tsx`, `src/components/board/board-moves.test.ts`, `e2e/board.spec.ts`

## UIC-BOARD-4 - Accessibility

### UIC-BOARD-4.1 - Named structure

The board shall be a group, each lane a group named by its title, and each cell a grid named by its column's title (and its lane's), so a reader always knows where a card is. Counts are read as text, not as bare numbers, and collapse toggles carry `aria-expanded`. Each cell is one tab stop: the arrow keys move between its cards (React Aria) and into a card's drag handle.

Implementation: `src/components/board/board.tsx`, `src/components/board/board-lane.tsx`, `src/components/board/board-cell.tsx`, `src/components/board/board-column-header.tsx`
Verification: `src/components/board/board.test.tsx`, `e2e/board.spec.ts`

## Hooks

| Hook                        | Kind      | Values            | Description                                                                          |
| --------------------------- | --------- | ----------------- | ------------------------------------------------------------------------------------ |
| `ui-board`                  | root      |                   | The board (`role="group"`).                                                          |
| `ui-board__columns`         | slot      |                   | The row of column headers.                                                           |
| `ui-board__column`          | slot      |                   | A column header.                                                                     |
| `ui-board__column-handle`   | slot      |                   | A column's drag handle (also `ui-button`).                                           |
| `ui-board__column-toggle`   | slot      |                   | A column's collapse toggle (also `ui-expand-toggle`).                                |
| `ui-board__column-icon`     | slot      |                   | A column's decorative icon (also `ui-icon`).                                         |
| `ui-board__column-title`    | slot      |                   | A column's title.                                                                    |
| `ui-board__column-count`    | slot      |                   | A column's card count, against its limit.                                            |
| `ui-board__column-actions`  | slot      |                   | The caller's controls at the end of a column header.                                 |
| `ui-board__lane`            | slot      |                   | A lane (`role="group"`).                                                             |
| `ui-board__lane-header`     | slot      |                   | A lane's header.                                                                     |
| `ui-board__lane-toggle`     | slot      |                   | A lane's collapse toggle (also `ui-expand-toggle`).                                  |
| `ui-board__lane-icon`       | slot      |                   | A lane's decorative icon (also `ui-icon`).                                           |
| `ui-board__lane-title`      | slot      |                   | A lane's title.                                                                      |
| `ui-board__lane-count`      | slot      |                   | A lane's card count.                                                                 |
| `ui-board__cells`           | slot      |                   | The row of cells of a lane, or of a board without lanes.                             |
| `ui-board__cell`            | slot      |                   | One column of one lane.                                                              |
| `ui-board__cards`           | slot      |                   | A cell's grid list (`role="grid"`).                                                  |
| `ui-board__card`            | slot      |                   | A card (`role="row"`).                                                               |
| `ui-board__card-handle`     | slot      |                   | A card's drag handle (also `ui-drag-handle`).                                        |
| `ui-board__card-content`    | slot      |                   | The caller's card content.                                                           |
| `ui-board__drop-indicator`  | slot      |                   | Where a dragged card would land, between cards.                                      |
| `ui-board__empty`           | slot      |                   | The empty state of a cell without cards (also `ui-empty-state`).                     |
| `ui-board__add`             | slot      |                   | A cell's add-card button (also `ui-button`).                                         |
| `data-virtualized`          | state     | `true`            | Cells render only the cards in view.                                                 |
| `data-collapsed`            | state     | `true`            | A collapsed column (header and cells) or lane.                                       |
| `data-over-limit`           | state     | `true`            | A column (header and cells) holding more cards than its limit.                       |
| `data-dragging`             | state     | `true`            | A column header or card being dragged.                                               |
| `data-drop-target`          | state     | `true`            | A column header, cell, card or drop indicator under a drag.                          |
| `data-position`             | state     | `before`, `after` | Where a dragged column or card would land against the target.                        |
| `data-key`                  | state     |                   | Card: opaque collection key (React Aria); column header: its key as text.            |
| `data-key-identity`         | attribute |                   | On column headers and cards: JSON `[type, text]` retaining the key's primitive type. |
| `data-empty`                | state     | `true`            | A cell without cards (React Aria).                                                   |
| `data-focused`              | state     | `true`            | A cell or card has focus (React Aria).                                               |
| `data-focus-visible`        | state     | `true`            | A cell or card has keyboard focus (React Aria).                                      |
| `data-focus-visible-within` | state     | `true`            | Keyboard focus inside a card (React Aria).                                           |
| `data-hovered`              | state     | `true`            | Pointer over a card (React Aria).                                                    |
| `data-pressed`              | state     | `true`            | A card is pressed (React Aria).                                                      |
| `data-allows-dragging`      | state     | `true`            | A card the reader can drag (React Aria).                                             |
| `data-layout`               | state     | `stack`           | A cell's layout (React Aria).                                                        |
| `data-orientation`          | state     | `vertical`        | A cell's orientation (React Aria).                                                   |
| `data-collection`           | state     |                   | React Aria's collection marker, on the cells' lists and cards.                       |
