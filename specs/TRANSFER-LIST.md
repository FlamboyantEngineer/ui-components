# Transfer List

`TransferList` chooses an ordered subset of items between two lists side by side: the available items and the chosen ones. Each side filters its rows, counts them and selects several; buttons between the sides move the selection or every shown item across, a double click or Enter moves a row, and the chosen side can be reordered. Each side is a [List View](LIST-ROW.md#uic-list-row-3---list-view). A short set of choices belongs in a [Checkbox Group](CHECKBOX-GROUP.md), and a choice from a long list without an order in a multiple [Select Field](SELECT-FIELD.md).

## UIC-TRANSFER-LIST-1 - Sides

### UIC-TRANSFER-LIST-1.1 - Structure

`TransferList` shall render a root `<div role="group">` (`ui-transfer-list`) named by its `aria-label` or `aria-labelledby`, holding the available side, the move buttons (`ui-transfer-list__actions`) and the chosen side. Each side (`ui-transfer-list__pane`, with `data-side` `available` or `chosen`) holds a header (`ui-transfer-list__header`) with its title (`ui-transfer-list__title`: `availableLabel` or the provider's `availableItems`, `chosenLabel` or `chosenItems`) and its count (`ui-transfer-list__count`), a [Search Field](SEARCH-FIELD.md) (`ui-transfer-list__search`) named by the provider's `filterLabel` string with the title, and a `ListView` (`ui-transfer-list__list`) named by the title. Each row is a `ListViewItem` showing an item's `label`, its `description` as meta text and its `icon`.

Numeric and text ids that read alike remain separate rows and selections in both sides; moving one reports its original key without moving its counterpart.

Implementation: `src/components/transfer-list/transfer-list.tsx`, `src/components/transfer-list/transfer-pane.tsx`, `src/core/picker-strings.ts`
Verification: `src/components/transfer-list/transfer-list.test.tsx`, `e2e/transfer-list.spec.ts`

### UIC-TRANSFER-LIST-1.2 - Value

The chosen item ids shall be `value` (controlled) or held by the list from `defaultValue` (uncontrolled), and every change calls `onChange` with the new ids. The available side lists the items not chosen, in the order of `items`; the chosen side lists the chosen items in the order of the value. An id that matches no item shows nowhere.

Implementation: `src/components/transfer-list/use-transfer-list.ts`
Verification: `src/components/transfer-list/transfer-list.test.tsx`

### UIC-TRANSFER-LIST-1.3 - Counts

Each side's count shall read the provider's `itemCount` string for the items on the side (`8 items`), followed while it has a selection by the `selectedCount` string (`8 items, 2 selected`). The count describes the side's list.

Implementation: `src/components/transfer-list/transfer-pane.tsx`
Verification: `src/components/transfer-list/transfer-list.test.tsx`, `e2e/transfer-list.spec.ts`

### UIC-TRANSFER-LIST-1.4 - Filtering

Text in a side's search field shall show only the side's rows whose label holds every word of it, ignoring case and accents. A side without rows to show reads the provider's `noResults` string while it filters, else `noItems`, in `ui-transfer-list__empty`.

Query terms are split as [Text Match](TEXT-MATCH.md) does, including `/`, `_` and `-` separators, and prepared once for the side rather than reparsed for each row.

Implementation: `src/components/transfer-list/use-transfer-list.ts`, `src/components/transfer-list/transfer-pane.tsx`
Verification: `src/components/transfer-list/transfer-list.test.tsx`, `e2e/transfer-list.spec.ts`

## UIC-TRANSFER-LIST-2 - Moving

### UIC-TRANSFER-LIST-2.1 - Selection

Each side shall select several rows in the list view's replace behaviour: a press selects one row, Shift extends the range, Ctrl or Cmd toggles a row, the arrow keys move the selection and Ctrl+A selects every row. A side's selection only ever holds rows it shows and can move.

Implementation: `src/components/transfer-list/transfer-pane.tsx`, `src/components/transfer-list/use-transfer-list.ts`
Verification: `src/components/transfer-list/transfer-list.test.tsx`, `e2e/transfer-list.spec.ts`

### UIC-TRANSFER-LIST-2.2 - Move buttons

The actions shall hold, for each side, an `IconButton` that moves the side's selection to the other side (`ui-transfer-list__move` with `data-scope="selected"`, named by the `moveSelectedTo` string with the other side's title, disabled without a selection) and one that moves every row the side shows and can move (`data-scope="all"`, named by `moveAllTo`, disabled without such a row); `data-target` names the side the items move to. Items moved to the chosen side follow the chosen ones in the order of `items`; items moved back leave the value. The moved items become the selection of the side they land on.

Implementation: `src/components/transfer-list/transfer-list.tsx`, `src/components/transfer-list/use-transfer-list.ts`, `src/components/transfer-list/transfer-moves.ts`
Verification: `src/components/transfer-list/transfer-moves.test.ts`, `src/components/transfer-list/transfer-list.test.tsx`, `e2e/transfer-list.spec.ts`

### UIC-TRANSFER-LIST-2.3 - Double click and Enter

A double click on a row, or Enter on the focused row, shall move it to the other side; when the row is selected, the whole selection moves with it.

Implementation: `src/components/transfer-list/transfer-pane.tsx`, `src/components/transfer-list/use-transfer-list.ts`
Verification: `src/components/transfer-list/transfer-list.test.tsx`, `e2e/transfer-list.spec.ts`

### UIC-TRANSFER-LIST-2.4 - Reordering

With `reorderable`, the root shall publish `data-reorderable`, the chosen side's rows reorder by drag and drop, by pointer or from each row's drag handle by keyboard ([UIC-LIST-ROW-3.5](LIST-ROW.md#uic-list-row-35---drag-and-drop)), dropped rows landing together in their order, and a `ui-transfer-list__reorder` group under the chosen side's header holds move up and move down `IconButton`s named by the provider's `moveItem` string. They move each selected chosen item one place, passing over the next unselected item, and are disabled while that would move nothing.

Movement availability shall be derived from neighboring selected and unselected keys without allocating a reordered copy.

Implementation: `src/components/transfer-list/transfer-list.tsx`, `src/components/transfer-list/transfer-moves.ts`
Verification: `src/components/transfer-list/transfer-moves.test.ts`, `src/components/transfer-list/transfer-list.test.tsx`, `e2e/transfer-list.spec.ts`

### UIC-TRANSFER-LIST-2.5 - Disabled items and list

Items in `disabledKeys` shall show disabled and never be selected or moved. With `isDisabled`, the root publishes `data-disabled` and every row, filter and button is disabled.

Implementation: `src/components/transfer-list/transfer-list.tsx`, `src/components/transfer-list/use-transfer-list.ts`
Verification: `src/components/transfer-list/transfer-list.test.tsx`

### UIC-TRANSFER-LIST-2.6 - Hooks and caller attributes

`TransferList` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/transfer-list/transfer-list.tsx`, `labs/reference/transfer-list.css`
Verification: `src/components/transfer-list/transfer-list.test.tsx`

## Hooks

| Hook                        | Kind      | Values                | Description                                      |
| --------------------------- | --------- | --------------------- | ------------------------------------------------ |
| `ui-transfer-list`          | root      |                       | The list's `<div role="group">`.                 |
| `ui-transfer-list__pane`    | slot      |                       | One side.                                        |
| `ui-transfer-list__header`  | slot      |                       | A side's header: its title and count.            |
| `ui-transfer-list__title`   | slot      |                       | A side's title.                                  |
| `ui-transfer-list__count`   | slot      |                       | A side's count.                                  |
| `ui-transfer-list__search`  | slot      |                       | A side's search field (also `ui-search-field`).  |
| `ui-transfer-list__list`    | slot      |                       | A side's rows (also `ui-list-view`).             |
| `ui-transfer-list__empty`   | slot      |                       | The text of a side without rows to show.         |
| `ui-transfer-list__actions` | slot      |                       | The move buttons between the sides.              |
| `ui-transfer-list__move`    | slot      |                       | A move button (also `ui-icon-button`).           |
| `ui-transfer-list__reorder` | slot      |                       | The chosen side's move up and move down buttons. |
| `data-side`                 | attribute | `available`, `chosen` | On a side: which one.                            |
| `data-scope`                | attribute | `selected`, `all`     | On a move button: what it moves.                 |
| `data-target`               | attribute | `available`, `chosen` | On a move button: the side the items move to.    |
| `data-reorderable`          | state     | `true`                | On the root: the chosen side reorders.           |
| `data-disabled`             | state     | `true`                | On the root: the list is disabled.               |
