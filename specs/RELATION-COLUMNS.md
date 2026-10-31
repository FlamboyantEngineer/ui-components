# Relation Columns

`RelationColumns` walks the relations of an item one step at a time, Miller-column style: the item sits in the middle column, the items upstream of it (such as the needs it derives from) in the column before and the items downstream of it (such as the designs and tests that follow from it) in the column after. Choosing an item in a side column opens the column of its own related items further along that side, so the reader traces a chain in either direction. Each column is a [List View](LIST-ROW.md#uic-list-row-3---list-view) of the caller's items; a [Breadcrumb](BREADCRUMB.md) shows the chosen chain.

## UIC-RELATION-COLUMNS-1 - Walking relations

### UIC-RELATION-COLUMNS-1.1 - Item, upstream and downstream columns

`RelationColumns` shall render a group named by its `aria-label` or `aria-labelledby` holding the trail (UIC-RELATION-COLUMNS-1.4) and a row of columns (`ui-relation-columns__columns`). Each column (`ui-relation-columns__column`) is a group with a header (`ui-relation-columns__column-header`) holding its title (`ui-relation-columns__column-title`) and a `ListView` (`ui-relation-columns__list`) named by that title, with one row (`ui-relation-columns__item`) per item, its title drawn by `renderItem` or else the item's text from `getTextValue`, which typeahead also matches. The middle column, titled by the provider's `relationItem` string, holds `item`; the first column before it lists `getRelated(item, 'upstream')`, titled by the provider's `upstreamOf` string with the item's text, and the first after it lists `getRelated(item, 'downstream')`, titled by `downstreamOf`. A column publishes `data-direction` (`upstream`, `item`, `downstream`) and `data-depth`, its distance from the middle column. A side column without items draws a small [Empty State](EMPTY-STATE.md) (`ui-relation-columns__empty`) reading the provider's `noUpstream` or `noDownstream` string.

Implementation: `src/components/relation-columns/relation-columns.tsx`, `src/components/relation-columns/relation-column.tsx`, `src/components/relation-columns/relation-columns-model.ts`
Verification: `src/components/relation-columns/relation-columns.test.tsx`, `e2e/relation-columns.spec.ts`

### UIC-RELATION-COLUMNS-1.2 - Columns along a path and counts

The columns shall follow the path of chosen items on each side, nearest first: each chosen key that is among the related items of the column it is chosen in opens the next column of that side, listing the chosen item's related items in the same direction, titled by `upstreamOf` or `downstreamOf` with the chosen item's text; a key that is not among them ends its side there. Each column header counts its items in a `ui-relation-columns__column-count` slot, and each item of a side column counts the items further along its side in a `ui-relation-columns__item-count` slot, both as digits hidden from assistive technology, which reads the provider's `itemCount` and `relatedCount` strings instead.

Implementation: `src/components/relation-columns/relation-columns-model.ts`, `src/components/relation-columns/relation-column.tsx`, `src/core/strings/relation.ts`
Verification: `src/components/relation-columns/relation-columns-model.test.ts`, `src/components/relation-columns/relation-columns.test.tsx`, `e2e/relation-columns.spec.ts`

### UIC-RELATION-COLUMNS-1.3 - Choosing an item

A side column shall take one chosen item (single selection, replacing on press, following focus from the keyboard): choosing an item calls `onPathChange` with the path where that side keeps the choices before the column, then the new one, dropping those beyond. The path (`{ upstream, downstream }`, each a list of keys) is controlled with `path` or uncontrolled from `defaultPath`; an uncontrolled path starts empty again when `item` changes to another key. The middle column chooses nothing.

Implementation: `src/components/relation-columns/relation-columns.tsx`, `src/components/relation-columns/relation-column.tsx`, `src/components/relation-columns/relation-columns-model.ts`
Verification: `src/components/relation-columns/relation-columns-model.test.ts`, `src/components/relation-columns/relation-columns.test.tsx`, `e2e/relation-columns.spec.ts`

### UIC-RELATION-COLUMNS-1.4 - Trail

A `Breadcrumb` (`ui-relation-columns__path`) named by the provider's `relationPath` string followed by the root's name (so several walks on a page keep distinct landmarks) shall list the chosen chain in reading order: the chosen upstream items from the furthest, the item, then the chosen downstream items. Activating a crumb keeps the choices up to that item on its side and drops those beyond it; activating the item's crumb clears both sides.

Implementation: `src/components/relation-columns/relation-columns.tsx`, `src/components/relation-columns/relation-columns-model.ts`
Verification: `src/components/relation-columns/relation-columns.test.tsx`, `e2e/relation-columns.spec.ts`

### UIC-RELATION-COLUMNS-1.5 - Hooks and caller attributes

`RelationColumns` shall carry the hooks below, append the caller's `className` to the root and forward `id`, `ref`, the ARIA labelling attributes and caller `data-*` attributes to it; caller attributes never replace a hook attribute.

Implementation: `src/components/relation-columns/relation-columns.tsx`, `src/components/relation-columns/relation-columns-hooks.ts`
Verification: `src/components/relation-columns/relation-columns.test.tsx`

### UIC-RELATION-COLUMNS-1.6 - Starting again from an item

Enter on an item of a side column, or a double click (a tap on touch), shall call `onAction` with its key, so the owner can start the walk from it by passing it as `item`.

Implementation: `src/components/relation-columns/relation-column.tsx`
Verification: `src/components/relation-columns/relation-columns.test.tsx`, `e2e/relation-columns.spec.ts`

## UIC-RELATION-COLUMNS-2 - Keyboard

### UIC-RELATION-COLUMNS-2.1 - Moving between columns

ArrowUp and ArrowDown shall move between the items of a column (React Aria), choosing them in a side column. ArrowLeft and ArrowRight on an item move focus to the column before or after it (mirrored right to left), onto its chosen item or else its first; at the first and last columns they keep focus where it is.

Implementation: `src/components/relation-columns/relation-columns.tsx`
Verification: `src/components/relation-columns/relation-columns.test.tsx`, `e2e/relation-columns.spec.ts`

## UIC-RELATION-COLUMNS-3 - Accessibility

### UIC-RELATION-COLUMNS-3.1 - Named columns

Each column shall be a group and a grid named by its title, so a reader hears which item a column relates to and in which direction; each column is one tab stop. Counts are read as text, not as bare numbers.

Implementation: `src/components/relation-columns/relation-column.tsx`
Verification: `src/components/relation-columns/relation-columns.test.tsx`, `e2e/relation-columns.spec.ts`

## Hooks

| Hook                                 | Kind  | Values                           | Description                                          |
| ------------------------------------ | ----- | -------------------------------- | ---------------------------------------------------- |
| `ui-relation-columns`                | root  |                                  | The group holding the trail and the columns.         |
| `ui-relation-columns__path`          | slot  |                                  | The trail of chosen items (also `ui-breadcrumb`).    |
| `ui-relation-columns__columns`       | slot  |                                  | The row of columns.                                  |
| `ui-relation-columns__column`        | slot  |                                  | A column (`role="group"`).                           |
| `ui-relation-columns__column-header` | slot  |                                  | A column's header.                                   |
| `ui-relation-columns__column-title`  | slot  |                                  | A column's title.                                    |
| `ui-relation-columns__column-count`  | slot  |                                  | A column's item count.                               |
| `ui-relation-columns__list`          | slot  |                                  | A column's list (also `ui-list-view`).               |
| `ui-relation-columns__item`          | slot  |                                  | An item's row (also `ui-list-view-item`).            |
| `ui-relation-columns__item-count`    | slot  |                                  | How many items lie further along an item's side.     |
| `ui-relation-columns__empty`         | slot  |                                  | A side column's empty state (also `ui-empty-state`). |
| `data-direction`                     | state | `upstream`, `item`, `downstream` | Which side of the item a column lists.               |
| `data-depth`                         | state |                                  | A column's distance from the item's column.          |
