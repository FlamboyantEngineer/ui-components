# Tree Select Field

`TreeSelectField` is a field that chooses one node, or several, from a hierarchy, such as a category, a folder or a part of an assembly. Its trigger opens a popover with a search and a [Tree](TREE.md): the search keeps each match's ancestors as context, branches load lazily, and with multiple choice the rows' checkboxes cascade. The chosen node reads in the trigger by its label or its path; several chosen nodes show as removable chips. It is built on the [Field](FIELD.md) base: label, validation, dirty state, restore, undo, menu and forms. A flat list of choices belongs in a [Select Field](SELECT-FIELD.md).

## UIC-TREE-SELECT-FIELD-1 - Trigger and popover

### UIC-TREE-SELECT-FIELD-1.1 - Structure

`TreeSelectField` shall render a `Field` (`ui-tree-select-field`, also `ui-field`) whose control is a frame (`ui-tree-select-field__frame`) holding the trigger button (`ui-tree-select-field__trigger`) and, when shown, the clear button. The trigger shows the value (`ui-tree-select-field__value`), or the `placeholder` (default: the provider's `selectPlaceholder`) with `data-placeholder` while nothing is chosen, and a chevron (`ui-tree-select-field__chevron`); it is named by the field's label and its value. The root publishes `data-selection-mode` (`single`, `multiple`) and `data-value-display` (`label`, `path`).

Implementation: `src/components/tree-select-field/tree-select-field.tsx`, `src/components/tree-select-field/tree-select-trigger.tsx`
Verification: `src/components/tree-select-field/tree-select-field.test.tsx`, `e2e/tree-select-field.spec.ts`

### UIC-TREE-SELECT-FIELD-1.2 - Popover

Pressing the trigger shall open a popover (`ui-tree-select-field__popover`) below it, publishing the trigger's width as `--ui-trigger-width`, holding a dialog (`ui-tree-select-field__dialog`) named by the field's label, with a [Search Field](SEARCH-FIELD.md) (`ui-tree-select-field__search`) named by the provider's `filterLabel` string with the label, which takes focus, and a `Tree` in its `picker` variant (`ui-tree-select-field__tree`) named by the label, its chosen rows selected. Every opening starts afresh: the search is empty and the tree opens with the ancestors of the chosen nodes expanded. Escape, or a press outside, closes the popover and returns focus to the trigger; Escape in the tree closes it rather than clearing a multiple choice. The open state follows `isOpen`, `defaultOpen` and `onOpenChange`.

Indexing the loaded hierarchy shall use an explicit traversal stack. Opening at multiple selected nodes shall collect their distinct ancestors without revisiting shared parent paths.

Implementation: `src/components/tree-select-field/tree-select-control.tsx`, `src/components/tree-select-field/tree-select-popover.tsx`, `src/components/tree-select-field/tree-index.ts`
Verification: `src/components/tree-select-field/tree-index.test.ts`, `src/components/tree-select-field/tree-select-field.test.tsx`, `e2e/tree-select-field.spec.ts`

### UIC-TREE-SELECT-FIELD-1.3 - Single choice

In a single choice, pressing a row, or Enter or Space on the focused row, shall make its node the value, commit it and close the popover; doing so on the chosen row keeps the value and closes the popover. Pressing the expand button only expands or collapses its row.

Implementation: `src/components/tree-select-field/tree-select-control.tsx`, `src/components/tree-select-field/tree-select-popover.tsx`
Verification: `src/components/tree-select-field/tree-select-field.test.tsx`, `e2e/tree-select-field.spec.ts`

### UIC-TREE-SELECT-FIELD-1.4 - Value display

With `valueDisplay` `label` (the default), a chosen node shall read as its text value (`getTextValue`); with `path`, as the text values of its ancestors and itself joined like a [Path](PATH.md) (`Europe/Norway/Oslo`). The trigger and the chips both follow it.

Label display shall read only the selected node’s text; path display reads its ancestors too.

Implementation: `src/components/tree-select-field/tree-select-control.tsx`
Verification: `src/components/tree-select-field/tree-select-field.test.tsx`, `e2e/tree-select-field.spec.ts`

### UIC-TREE-SELECT-FIELD-1.5 - Unloaded values

A chosen key that matches no loaded node shall read as the key itself, with `data-missing` on the value or its chip, until its node loads.

Implementation: `src/components/tree-select-field/tree-select-control.tsx`
Verification: `src/components/tree-select-field/tree-select-field.test.tsx`

## UIC-TREE-SELECT-FIELD-2 - Search, multiple choice and states

### UIC-TREE-SELECT-FIELD-2.1 - Search

Text in the search field shall filter the tree as `Tree`'s `filterText` does: the rows whose text value holds every word show with their ancestors, expanded, and their descendants. Down in the search field moves focus to the tree's first row. A tree with no row to show reads the provider's `noResults` string while it filters, else `noItems`.

Implementation: `src/components/tree-select-field/tree-select-popover.tsx`
Verification: `src/components/tree-select-field/tree-select-field.test.tsx`, `e2e/tree-select-field.spec.ts`

### UIC-TREE-SELECT-FIELD-2.2 - Multiple choice

With `selectionMode` `multiple`, the value shall be the list of chosen keys in reading order, each row draws a checkbox, the popover stays open while the reader chooses, and every change commits at once. With `selectionPropagation` (the default), choosing a node chooses its loaded descendants and a node is chosen exactly when all its loaded children are, as in `Tree`; without it each row is chosen on its own. The trigger reads the provider's `selectedCount` string for the chips shown.

Implementation: `src/components/tree-select-field/tree-select-control.tsx`, `src/components/tree-select-field/tree-select-popover.tsx`, `src/components/tree-select-field/tree-index.ts`
Verification: `src/components/tree-select-field/tree-index.test.ts`, `src/components/tree-select-field/tree-select-field.test.tsx`, `e2e/tree-select-field.spec.ts`

### UIC-TREE-SELECT-FIELD-2.3 - Chips

A multiple choice shall show its chosen nodes after the frame as a `TagGroup` (`ui-tree-select-field__chips`) named by the provider's `selectedValues` string with the label, one `Tag` (`ui-tree-select-field__chip`) per chosen key, or with `selectionPropagation` per chosen branch (a chosen node whose ancestors are not chosen). While the field is editable each chip can be removed by its button, Delete or Backspace; removing a chip removes its key and, with `selectionPropagation`, its descendants and ancestors, and commits.

Collapsing and removing selected branches shall reuse shared ancestor checks rather than materializing an ancestor array for each selected key.

Implementation: `src/components/tree-select-field/tree-select-control.tsx`, `src/components/tree-select-field/tree-index.ts`
Verification: `src/components/tree-select-field/tree-index.test.ts`, `src/components/tree-select-field/tree-select-field.test.tsx`, `e2e/tree-select-field.spec.ts`

### UIC-TREE-SELECT-FIELD-2.4 - Lazy branches

`hasChildItems` and `onLoadChildren` shall pass to the tree, so a branch whose children are not loaded expands to a loading row and loads them ([Tree](TREE.md)); the field indexes the nodes again when the caller's `items` grow.

Implementation: `src/components/tree-select-field/tree-select-popover.tsx`, `src/components/tree-select-field/tree-select-control.tsx`
Verification: `src/components/tree-select-field/tree-select-field.test.tsx`, `e2e/tree-select-field.spec.ts`

### UIC-TREE-SELECT-FIELD-2.5 - Clear, read-only and disabled

With `isClearable`, while the value can be cleared, a clear `IconButton` (`ui-tree-select-field__clear`) named by the provider's `clearValue` string with the label shall follow the trigger; pressing it clears and commits the value and focuses the trigger. A read-only field does not open, calls no `onOpenChange` when pressed, and its chips cannot be removed; a disabled field's trigger is disabled.

Implementation: `src/components/tree-select-field/tree-select-control.tsx`, `src/components/tree-select-field/tree-select-trigger.tsx`
Verification: `src/components/tree-select-field/tree-select-field.test.tsx`

### UIC-TREE-SELECT-FIELD-2.6 - Forms

With `name`, the field shall render hidden inputs under that name: one per chosen key for a multiple choice, and one holding the key or an empty entry for a single choice, disabled while the field is. Numeric and text keys with the same spelling remain distinct as inputs are reordered.

Implementation: `src/components/tree-select-field/tree-select-control.tsx`
Verification: `src/components/tree-select-field/tree-select-field.test.tsx`

### UIC-TREE-SELECT-FIELD-2.7 - Hooks and caller attributes

`TreeSelectField` shall carry the hooks below and the field base's, append the caller's `className` and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/tree-select-field/tree-select-field.tsx`, `labs/reference/tree-select-field.css`
Verification: `src/components/tree-select-field/tree-select-field.test.tsx`

## Hooks

| Hook                            | Kind      | Values                                     | Description                                             |
| ------------------------------- | --------- | ------------------------------------------ | ------------------------------------------------------- |
| `ui-tree-select-field`          | root      |                                            | The field root (also `ui-field`).                       |
| `ui-tree-select-field__frame`   | slot      |                                            | Holds the trigger and the clear button.                 |
| `ui-tree-select-field__trigger` | slot      |                                            | The trigger button.                                     |
| `ui-tree-select-field__value`   | slot      |                                            | The chosen value or the placeholder; names the trigger. |
| `ui-tree-select-field__chevron` | slot      |                                            | The trigger's chevron glyph.                            |
| `ui-tree-select-field__clear`   | slot      |                                            | The clear button (also `ui-icon-button`).               |
| `ui-tree-select-field__popover` | slot      |                                            | The popover.                                            |
| `--ui-trigger-width`            | property  |                                            | Width of the trigger, in pixels.                        |
| `ui-tree-select-field__dialog`  | slot      |                                            | The dialog inside the popover.                          |
| `ui-tree-select-field__search`  | slot      |                                            | The search field (also `ui-search-field`).              |
| `ui-tree-select-field__tree`    | slot      |                                            | The tree (also `ui-tree`).                              |
| `ui-tree-select-field__chips`   | slot      |                                            | The chips of a multiple choice (also `ui-tag-group`).   |
| `ui-tree-select-field__chip`    | slot      |                                            | One chip (also `ui-tag-group__tag`).                    |
| `data-selection-mode`           | attribute | `single`, `multiple`                       | On the root: how many nodes the field takes.            |
| `data-value-display`            | attribute | `label`, `path`                            | On the root: how chosen nodes read.                     |
| `data-placeholder`              | state     | `true`                                     | On the value: nothing is chosen.                        |
| `data-missing`                  | state     | `true`                                     | On the value or a chip: the key matches no loaded node. |
| `data-placement`                | state     | `top`, `bottom`, `left`, `right`, `center` | On the popover: the side it opened on (React Aria).     |
| `data-trigger`                  | state     | `DialogTrigger`                            | On the popover: what opened it (React Aria).            |
| `data-entering`                 | state     | `true`                                     | On the popover: opening (React Aria).                   |
| `data-exiting`                  | state     | `true`                                     | On the popover: closing (React Aria).                   |
| `data-hovered`                  | state     | `true`                                     | On the trigger: under the pointer (React Aria).         |
| `data-pressed`                  | state     | `true`                                     | On the trigger: being pressed (React Aria).             |
| `data-focused`                  | state     | `true`                                     | On the trigger: focused (React Aria).                   |
| `data-focus-visible`            | state     | `true`                                     | On the trigger: focused from the keyboard (React Aria). |
| `data-disabled`                 | state     | `true`                                     | On the trigger: disabled (React Aria).                  |
