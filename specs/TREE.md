# Tree

`Tree` draws a hierarchy of rows (folders and entries, categories and items) on React Aria's `Tree`. Items are plain data; render callbacks draw each row's icon, label, metadata and actions. The tree expands and collapses rows, selects (with checkboxes and propagation when asked), navigates by keyboard, follows links, can persist its expansion, loads children on demand, filters its rows by text, renames rows in place, shows loading and empty notices through [EmptyState](EMPTY-STATE.md), and can let the reader reorder rows ([TREE-REORDER.md](TREE-REORDER.md)).

## UIC-TREE-1 - Rows

### UIC-TREE-1.1 - Data-driven rows

`Tree` shall render a React Aria tree grid named by its `aria-label` or `aria-labelledby`, with one row per visible item. Children come from `getChildren` (the item's `children` by default), and `getTextValue` gives each row its accessible name and the text typeahead matches. Each row has `aria-level`, and `aria-expanded` when it has children. The caller's data stays its own: the tree reads items only through `id`, the accessors and the render callbacks. Numeric and text ids that read alike, and ids whose whitespace would normalize alike in a collection primitive, remain distinct. Only the primitive receives encoded identities; selection, expansion, actions, loading, item state and reorder callbacks retain the caller's original keys.

Library item lookups and loaded key collection shall retain reading order through iterative tree walks, with no repeated descendant-array copies. A lookup stops before reading the matched item's children.

Implementation: `src/components/tree/tree.tsx`, `src/components/tree/use-tree-model.ts`, `src/components/tree/tree-item.tsx`, `src/utils/walk-tree.ts`
Verification: `src/components/tree/tree.test.tsx`, `src/utils/walk-tree.test.ts`, `e2e/tree.spec.ts`

### UIC-TREE-1.2 - Row anatomy

Every row shall have the same anatomy: the drag handle (a [DragHandle](DRAG-HANDLE.md)) when the tree is reorderable, the expand button (or a spacer of the same slot when the row has no children), the selection checkbox with `checkboxSelection`, the icon from `getIcon` (an imported icon component or rendered element, drawn as a decorative `Icon`), the label from `renderLabel` (the text value by default), the metadata from `renderMeta`, a load error and the controls from `renderActions`. Empty callbacks render no slot. The callbacks receive the item and the row's state: `isExpanded`, `hasChildItems`, `level`, `isSelected`, `isDisabled`, `isFocusVisible` and `isCurrent`. Each row publishes its depth as `--ui-tree-level`, from which the stylesheet indents it.

Implementation: `src/components/tree/tree-item.tsx`, `labs/reference/tree.css`, `src/components/tree/tree-row.tsx`
Verification: `src/components/tree/tree.test.tsx`, `e2e/tree.spec.ts`

### UIC-TREE-1.3 - Expand glyphs

The expand button shall draw built-in glyphs: `chevron-right` when collapsed and `chevron-down` when expanded, or `plus` and `minus` with `expandGlyph="plus-minus"`. The root publishes the choice as `data-expand-glyph`.

Implementation: `src/components/tree/tree.tsx`, `src/components/tree/use-tree-model.ts`, `src/components/tree/tree-item.tsx`, `src/components/tree/tree-row.tsx`
Verification: `src/components/tree/tree.test.tsx`

## UIC-TREE-2 - Expansion

### UIC-TREE-2.1 - Expand and collapse

A row with children shall expand and collapse from its expand button, named by the provider's `expand` or `collapse` string together with the row's label, and from ArrowRight and ArrowLeft (React Aria). Pressing a branch row also toggles it when the tree has no selection, no `onAction` and the row no link. Expansion is controlled with `expandedKeys` and `onExpandedChange`, or uncontrolled from `defaultExpandedKeys`.

Implementation: `src/components/tree/tree.tsx`, `src/components/tree/use-tree-model.ts`, `src/components/tree/tree-item.tsx`, `src/components/tree/use-tree-expansion.ts`, `src/components/tree/tree-row.tsx`
Verification: `src/components/tree/tree.test.tsx`, `e2e/tree.spec.ts`

### UIC-TREE-2.2 - Children not loaded yet

`hasChildItems` shall make a row without loaded children expandable, with an expand button and `aria-expanded`, so expanding it can trigger the load. While `isItemPending` holds for an expanded row, a loading row (`ui-tree__loader`) shows below it, holding a small loading `EmptyState` (a polite status) that reads the provider's `loading` string.

Implementation: `src/components/tree/tree-item.tsx`
Verification: `src/components/tree/tree.test.tsx`

### UIC-TREE-2.3 - Persisted expansion

With `persistKey`, uncontrolled expansion shall be read from and written to the provider's storage under that key, so a remounted tree restores it. An unreadable stored value falls back to `defaultExpandedKeys`. Controlled expansion is never persisted.

Implementation: `src/components/tree/use-tree-expansion.ts`
Verification: `src/components/tree/tree.test.tsx`, `e2e/tree.spec.ts`

### UIC-TREE-2.4 - Loading children on demand

With `onLoadChildren`, the loading row of an expanded row that has children but none loaded shall ask for them once it comes into view (React Aria's loading sentinel), calling `onLoadChildren` with the item; the owner adds the children to its items. While a returned promise is pending the loading row shows, as for `isItemPending`. A rejection shall show its message (or the provider's `actionFailed` string) in the row as an [InlineError](INLINE-ERROR.md) (`ui-tree__load-error`) whose retry button asks again; the row does not ask again on its own after a failure or a success.

Implementation: `src/components/tree/use-tree-loads.ts`, `src/components/tree/tree-item.tsx`, `src/components/tree/tree-row.tsx`, `src/components/tree/tree.tsx`, `src/components/tree/use-tree-model.ts`
Verification: `src/components/tree/use-tree-loads.test.tsx`, `e2e/tree.spec.ts`

## UIC-TREE-3 - Interaction

### UIC-TREE-3.1 - Keyboard navigation

The tree shall be one tab stop. ArrowDown and ArrowUp move between visible rows, Home and End to the first and last row, and printable keys run typeahead over the text values (React Aria).

Implementation: `src/components/tree/tree.tsx`, `src/components/tree/use-tree-model.ts`, `src/components/tree/tree-aria-keys.ts`
Verification: `src/components/tree/tree.test.tsx`, `src/components/tree/tree-aria-keys.test.tsx`, `e2e/tree.spec.ts`

### UIC-TREE-3.2 - Selection and disabled rows

The selection props (`selectionMode`, `selectionBehavior`, `selectedKeys`, `defaultSelectedKeys`, `disallowEmptySelection`, and `onSelectionChange` with the new `Selection`) shall select rows: selected rows carry `aria-selected` and `data-selected`. Rows in `disabledKeys` carry `aria-disabled` and `data-disabled` and cannot be selected, activated or expanded.

Initial selection and disabled key iterables are read once for the model and primitive, so a one-shot generator has the same effect as a set or array.

Implementation: `src/components/tree/tree.tsx`, `src/components/tree/use-tree-model.ts`, `src/components/tree/tree-aria-keys.ts`
Verification: `src/components/tree/tree.test.tsx`, `src/components/tree/tree-aria-keys.test.tsx`

### UIC-TREE-3.3 - Row actions

`onAction` shall receive the key of the row the reader activates: on press, or on Enter and double-click when selection replaces on press (React Aria). Controls from `renderActions` act on their own without selecting or activating the row.

Implementation: `src/components/tree/tree.tsx`, `src/components/tree/use-tree-model.ts`, `src/components/tree/tree-aria-keys.ts`
Verification: `src/components/tree/tree.test.tsx`, `src/components/tree/tree-aria-keys.test.tsx`

### UIC-TREE-3.4 - Link rows

`getHref` shall make the row itself a link: pressing it or pressing Enter navigates to the href, through the provider's `navigate` when the host set one. The row holds no link element of its own, so no link is nested in it, and it publishes `data-href`.

Implementation: `src/components/tree/tree-item.tsx`
Verification: `src/components/tree/tree.test.tsx`

### UIC-TREE-3.5 - Current row

`currentKey` shall mark its row with `data-current` and `aria-current`: `page` on a link row and `true` otherwise.

Implementation: `src/components/tree/tree-item.tsx`
Verification: `src/components/tree/tree.test.tsx`

### UIC-TREE-3.6 - Owner keys

`onItemKeyDown` shall receive each keydown in a row, with the row's item, before the tree's own keyboard handling. When it returns `true` the tree prevents the key's default and does nothing more with it. Keys typed in an editable element inside a row (a field such as a rename field, editable content of any `contenteditable` value but `false`, or an element with role `textbox` or `combobox`) reach neither the owner hook nor reordering.

Implementation: `src/components/tree/use-tree-key-down.ts`, `src/components/tree/tree.tsx`, `src/components/tree/use-tree-model.ts`
Verification: `src/components/tree/tree.test.tsx`

## UIC-TREE-4 - States and options

### UIC-TREE-4.1 - Loading

`isPending` shall set `data-pending` on the tree, and `aria-busy="true"` while the tree shows items; an empty pending tree is not busy, so no busy ancestor holds back its loading status. A pending tree with no items shall show one loading row holding a small loading `EmptyState` (a polite status, also `ui-tree__empty`) that reads the provider's `loading` string.

Implementation: `src/components/tree/tree.tsx`, `src/components/tree/use-tree-model.ts`, `src/components/tree/tree-item.tsx`
Verification: `src/components/tree/tree.test.tsx`

### UIC-TREE-4.2 - Empty

A tree with no items that is not pending shall show `emptyMessage` in a small empty `EmptyState` (also `ui-tree__empty`), and nothing without it. React Aria publishes `data-empty` on the tree.

Implementation: `src/components/tree/tree.tsx`, `src/components/tree/use-tree-model.ts`, `src/components/tree/tree-item.tsx`
Verification: `src/components/tree/tree.test.tsx`

### UIC-TREE-4.3 - Options

`size` (`sm` by default, `md`, `lg`: the row spacing), `variant` (`default`, or `picker` for a tree the reader chooses one row from, whose unavailable rows the stylesheet greys out) and `wrap` (labels may wrap instead of ellipsizing) shall publish `data-size`, `data-variant` and `data-wrap` on the tree.

Implementation: `src/components/tree/tree.tsx`, `src/components/tree/use-tree-model.ts`, `labs/reference/tree.css`
Verification: `src/components/tree/tree.test.tsx`, `e2e/tree.spec.ts`

### UIC-TREE-4.4 - Hooks and caller attributes

`Tree` shall carry the hooks below, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to the tree element.

Implementation: `src/components/tree/tree.tsx`, `src/components/tree/use-tree-model.ts`, `src/components/tree/tree-aria-keys.ts`
Verification: `src/components/tree/tree.test.tsx`, `src/components/tree/tree-aria-keys.test.tsx`

### UIC-TREE-4.5 - Virtualization

`virtualized` shall render the tree through React Aria's `Virtualizer` with its list layout and publish `data-virtualized` on the tree: only the visible rows in view of the tree, plus a small buffer, are in the document, at `rowHeight` pixels each (28, 32 or 40 by default at size `sm`, `md` or `lg`), and scrolling the tree reaches the last row. The stylesheet bounds the tree's height.

Implementation: `src/components/tree/tree.tsx`, `src/components/tree/use-tree-model.ts`, `labs/reference/tree.css`
Verification: `src/components/tree/tree.test.tsx`, `e2e/tree.spec.ts`

### UIC-TREE-4.6 - Presentation changes

Turning `virtualized` on or off, or `filterText` going between `undefined` and a string, shall keep an uncontrolled selection without calling `onSelectionChange`, and keep focus on the row that held it, unless focus had moved elsewhere. The tree holds the selection above React Aria and always draws its text-match provider, which passes the outer one through without a filter.

Implementation: `src/components/tree/tree.tsx`, `src/components/tree/use-tree-selection.ts`, `src/utils/use-carried-focus.ts`
Verification: `src/components/tree/tree.test.tsx`

## UIC-TREE-5 - Checkbox selection

### UIC-TREE-5.1 - Selection checkboxes

`checkboxSelection` shall draw a [Checkbox](CHECKBOX.md) in the `ui-tree__checkbox` slot of each row, after the expand button, while the tree selects (`selectionMode` is not `none`). The checkbox reports the row's selection and toggles it (React Aria's `selection` slot); a tree that does not select draws none.

Implementation: `src/components/tree/tree-row.tsx`, `src/components/tree/tree-item.tsx`, `labs/reference/tree.css`
Verification: `src/components/tree/use-tree-selection.test.tsx`, `e2e/tree.spec.ts`

### UIC-TREE-5.2 - Selection propagation

With `selectionPropagation` and multiple selection, selecting or deselecting a row shall select or deselect its loaded descendants that are not disabled, and then each branch shall be selected exactly when all its enabled children are. A row that is not selected while a descendant is publishes `data-indeterminate` and its checkbox shows mixed. The tree holds the selection from `defaultSelectedKeys` unless `selectedKeys` controls it, and reports every change to `onSelectionChange` as a set of keys. In single selection `selectionPropagation` has no effect: a press selects that row alone.

Selection propagation and indeterminate-state calculations shall walk loaded hierarchies without recursive JavaScript calls, including deeply nested branches.

Implementation: `src/components/tree/use-tree-selection.ts`, `src/components/tree/tree-item.tsx`, `src/components/tree/tree.tsx`, `src/components/tree/use-tree-model.ts`
Verification: `src/components/tree/use-tree-selection.test.tsx`, `e2e/tree.spec.ts`

## UIC-TREE-6 - Filtering

### UIC-TREE-6.1 - Filtered rows

While `filterText` is not blank, the tree shall show only the loaded rows whose text value matches it, their ancestors and their descendants. Ancestors of a match open to show it; expanding and collapsing then changes an expansion of the filter's own, and the reader's expansion returns once the filter clears. A row matches while its text value holds every term of `filterText`, split as [Text Match](TEXT-MATCH.md) does, or while `filter(textValue, filterText)` returns true when the caller sets one. Default labels mark the terms through `TextMatch`.

Filtering shall walk loaded hierarchies without recursive JavaScript calls and evaluate the match callback once per item in preorder, including deeply nested branches.

Implementation: `src/components/tree/use-tree-filter.ts`, `src/components/tree/tree-row.tsx`, `src/components/tree/tree.tsx`, `src/components/tree/use-tree-model.ts`
Verification: `src/components/tree/use-tree-filter.test.tsx`, `e2e/tree.spec.ts`

## UIC-TREE-7 - Renaming

### UIC-TREE-7.1 - Renaming in place

With `onRename`, F2 on a row that `canRename` accepts (every row by default) shall replace its label with a text field (`ui-tree__rename-input`) named by the provider's `renameItem` string, holding the row's text value selected. Keys typed in the field edit it and never reach the tree. Enter, and focus leaving the field, call `onRename` with the item and the trimmed name when it is not blank and differs from the text value; Escape abandons the edit. Enter and Escape return focus to the row. An Enter or Escape that an input method composition owns (pressed while it composes, or the Enter reported with key code 229 as it ends) is left to the input method and neither renames nor abandons.

Implementation: `src/components/tree/use-tree-rename.tsx`, `src/utils/is-composing-key.ts`, `src/components/tree/use-tree-key-down.ts`, `src/components/tree/tree-row.tsx`
Verification: `src/components/tree/use-tree-rename.test.tsx`, `e2e/tree.spec.ts`

### UIC-TREE-7.2 - Renaming the row as it is now

The rename shall act on the row the owner draws now, found by its key among the shown rows. F2 opens no field on a row in `disabledKeys`. Enter, and focus leaving the field, check the row again before renaming: it must still be shown, outside `disabledKeys` and accepted by `canRename`, and `onRename` receives the current item rather than the one F2 opened. When a render leaves the open field's row disabled, outside the shown rows or refused by `canRename`, or drops `onRename`, the field closes without renaming and stays closed when `onRename` comes back; when the field held focus, focus returns to the row, or to the tree when the row takes no focus.

Implementation: `src/components/tree/use-tree-rename.tsx`, `src/components/tree/tree.tsx`, `src/components/tree/use-tree-model.ts`
Verification: `src/components/tree/tree-rename-eligibility.test.tsx`, `e2e/tree.spec.ts`

## Hooks

| Hook                      | Kind      | Values                  | Description                                                                   |
| ------------------------- | --------- | ----------------------- | ----------------------------------------------------------------------------- |
| `ui-tree`                 | root      |                         | The tree grid element.                                                        |
| `ui-tree__item`           | slot      |                         | A row.                                                                        |
| `ui-tree__drag-handle`    | slot      |                         | The row's drag handle, in a reorderable tree (also `ui-drag-handle`).         |
| `ui-tree__expand`         | slot      |                         | The expand button of a row with children.                                     |
| `ui-tree__expand-spacer`  | slot      |                         | Holds the expand button's place in a row without children.                    |
| `ui-tree__checkbox`       | slot      |                         | The row's selection checkbox (also `ui-checkbox`).                            |
| `ui-tree__icon`           | slot      |                         | The row icon (also `ui-icon`).                                                |
| `ui-tree__label`          | slot      |                         | The row label.                                                                |
| `ui-tree__rename-input`   | slot      |                         | The name field of a row being renamed, inside its label.                      |
| `ui-tree__meta`           | slot      |                         | Secondary text after the label.                                               |
| `ui-tree__load-error`     | slot      |                         | Why the row's children failed to load, with a retry (also `ui-inline-error`). |
| `ui-tree__actions`        | slot      |                         | The row's trailing controls.                                                  |
| `ui-tree__drop-indicator` | slot      |                         | The line where a dragged row would land, between rows.                        |
| `ui-tree__loader`         | slot      |                         | The loading row below an expanded row whose children are loading.             |
| `ui-tree__empty`          | slot      |                         | The empty tree's notice (also `ui-empty-state`).                              |
| `data-size`               | attribute | `sm`, `md`, `lg`        | Row spacing.                                                                  |
| `data-variant`            | attribute | `default`, `picker`     | Navigation tree or picker.                                                    |
| `data-expand-glyph`       | attribute | `chevron`, `plus-minus` | The expand button's glyphs.                                                   |
| `data-wrap`               | state     | `true`                  | Labels may wrap.                                                              |
| `data-virtualized`        | state     | `true`                  | Only the rows in view render.                                                 |
| `data-pending`            | state     | `true`                  | Items are loading.                                                            |
| `data-current`            | state     | `true`                  | The current row.                                                              |
| `data-indeterminate`      | state     | `true`                  | A row that is not selected while some of its descendants are.                 |
| `data-position`           | attribute | `before`, `after`       | Which side of its row a drop indicator stands for.                            |
| `--ui-tree-level`         | property  |                         | A row's (or loading row's) depth, from 1, for indentation.                    |
| `data-empty`              | state     | `true`                  | The tree has no items (React Aria).                                           |
| `data-focused`            | state     | `true`                  | The tree, a row or a button has focus (React Aria).                           |
| `data-focus-visible`      | state     | `true`                  | Keyboard focus (React Aria).                                                  |
| `data-selection-mode`     | state     | `single`, `multiple`    | The selection mode (React Aria).                                              |
| `data-allows-dragging`    | state     | `true`                  | The tree or row allows dragging (React Aria).                                 |
| `data-drop-target`        | state     | `true`                  | The tree, a row or a drop indicator is the current drop target.               |
| `data-expanded`           | state     | `true`                  | An expanded row (React Aria).                                                 |
| `data-has-child-items`    | state     | `true`                  | A row with children (React Aria).                                             |
| `data-level`              | state     |                         | A row's depth, from 1 (React Aria).                                           |
| `data-selected`           | state     | `true`                  | A selected row (React Aria).                                                  |
| `data-disabled`           | state     | `true`                  | A disabled row or button (React Aria).                                        |
| `data-hovered`            | state     | `true`                  | Pointer over a row or button (React Aria).                                    |
| `data-pressed`            | state     | `true`                  | A row or button is pressed (React Aria).                                      |
| `data-dragging`           | state     | `true`                  | The row being dragged (React Aria).                                           |
| `data-href`               | state     |                         | A link row's destination (React Aria).                                        |
| `data-key`                | state     |                         | Opaque collection key (React Aria): not the `id`, not for styling.            |
| `data-collection`         | state     |                         | React Aria's collection id on the tree and its rows; not for styling.         |
