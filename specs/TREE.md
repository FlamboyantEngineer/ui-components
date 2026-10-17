# Tree

`Tree` draws a hierarchy of rows (folders and entries, categories and items) on React Aria's `Tree`. Items are plain data; render callbacks draw each row's icon, label, metadata and actions. The tree expands and collapses rows, selects, navigates by keyboard, follows links, can persist its expansion, shows loading and empty states, and can let the reader reorder rows ([TREE-REORDER.md](TREE-REORDER.md)).

## UIC-TREE-1 - Rows

### UIC-TREE-1.1 - Data-driven rows

`Tree` shall render a React Aria tree grid named by its `aria-label` or `aria-labelledby`, with one row per visible item. Children come from `getChildren` (the item's `children` by default), and `getTextValue` gives each row its accessible name and the text typeahead matches. Each row has `aria-level`, and `aria-expanded` when it has children. The caller's data stays its own: the tree reads items only through `id`, the accessors and the render callbacks.

Implementation: `src/components/tree/tree.tsx`
Verification: `src/components/tree/tree.test.tsx`, `e2e/tree.spec.ts`

### UIC-TREE-1.2 - Row anatomy

Every row shall have the same anatomy: the drag handle when the tree is reorderable, the expand button (or a spacer of the same slot when the row has no children), the icon from `getIcon` (a built-in glyph name or icon node, drawn as a decorative `Icon`), the label from `renderLabel` (the text value by default), the metadata from `renderMeta` and the controls from `renderActions`. Empty callbacks render no slot. Each row publishes its depth as `--ui-tree-level`, from which the stylesheet indents it.

Implementation: `src/components/tree/tree.tsx`, `labs/reference.css`
Verification: `src/components/tree/tree.test.tsx`, `e2e/tree.spec.ts`

### UIC-TREE-1.3 - Expand glyphs

The expand button shall draw built-in glyphs: `chevron-right` when collapsed and `chevron-down` when expanded, or `plus` and `minus` with `expandGlyph="plus-minus"`. The root publishes the choice as `data-expand-glyph`.

Implementation: `src/components/tree/tree.tsx`
Verification: `src/components/tree/tree.test.tsx`

## UIC-TREE-2 - Expansion

### UIC-TREE-2.1 - Expand and collapse

A row with children shall expand and collapse from its expand button, named by the provider's `expand` or `collapse` string together with the row's label, and from ArrowRight and ArrowLeft (React Aria). Pressing a branch row also toggles it when the tree has no selection, no `onAction` and the row no link. Expansion is controlled with `expandedKeys` and `onExpandedChange`, or uncontrolled from `defaultExpandedKeys`.

Implementation: `src/components/tree/tree.tsx`
Verification: `src/components/tree/tree.test.tsx`, `e2e/tree.spec.ts`

### UIC-TREE-2.2 - Children not loaded yet

`hasChildItems` shall make a row without loaded children expandable, with an expand button and `aria-expanded`, so expanding it can trigger the load. While `isItemPending` holds for an expanded row, a loading row (`ui-tree__loader`, with the spinner slot and the provider's `loading` string) shows below it.

Implementation: `src/components/tree/tree.tsx`
Verification: `src/components/tree/tree.test.tsx`

### UIC-TREE-2.3 - Persisted expansion

With `persistKey`, uncontrolled expansion shall be read from and written to the provider's storage under that key, so a remounted tree restores it. An unreadable stored value falls back to `defaultExpandedKeys`. Controlled expansion is never persisted.

Implementation: `src/components/tree/tree.tsx`
Verification: `src/components/tree/tree.test.tsx`, `e2e/tree.spec.ts`

## UIC-TREE-3 - Interaction

### UIC-TREE-3.1 - Keyboard navigation

The tree shall be one tab stop. ArrowDown and ArrowUp move between visible rows, Home and End to the first and last row, and printable keys run typeahead over the text values (React Aria).

Implementation: `src/components/tree/tree.tsx`
Verification: `src/components/tree/tree.test.tsx`, `e2e/tree.spec.ts`

### UIC-TREE-3.2 - Selection and disabled rows

React Aria's selection props (`selectionMode`, `selectionBehavior`, `selectedKeys`, `defaultSelectedKeys`, `onSelectionChange`) shall pass through: selected rows carry `aria-selected` and `data-selected`. Rows in `disabledKeys` carry `aria-disabled` and `data-disabled` and cannot be selected, activated or expanded.

Implementation: `src/components/tree/tree.tsx`
Verification: `src/components/tree/tree.test.tsx`

### UIC-TREE-3.3 - Row actions

`onAction` shall run for the row the reader activates: on press, or on Enter and double-click when selection replaces on press (React Aria). Controls from `renderActions` act on their own without selecting or activating the row.

Implementation: `src/components/tree/tree.tsx`
Verification: `src/components/tree/tree.test.tsx`

### UIC-TREE-3.4 - Link rows

`getHref` shall make the row itself a link: pressing it or pressing Enter navigates to the href, through the provider's `navigate` when the host set one. The row holds no link element of its own, so no link is nested in it, and it publishes `data-href`.

Implementation: `src/components/tree/tree.tsx`
Verification: `src/components/tree/tree.test.tsx`

### UIC-TREE-3.5 - Current row

`isItemCurrent` shall mark a row with `data-current` and `aria-current`: `page` on a link row and `true` otherwise.

Implementation: `src/components/tree/tree.tsx`
Verification: `src/components/tree/tree.test.tsx`

### UIC-TREE-3.6 - Owner keys

`onItemKeyDown` shall receive each keydown in a row, with the row's item, before the tree's own keyboard handling. When it returns `true` the tree prevents the key's default and does nothing more with it. Keys typed in an editable element inside a row, such as a rename field, reach neither the owner hook nor reordering.

Implementation: `src/components/tree/tree.tsx`
Verification: `src/components/tree/tree.test.tsx`

## UIC-TREE-4 - States and options

### UIC-TREE-4.1 - Loading

`isPending` shall set `aria-busy="true"` and `data-pending` on the tree. A pending tree with no items shall show one loading row: the `ui-tree__spinner` slot and the provider's `loading` string in the `ui-tree__empty` slot.

Implementation: `src/components/tree/tree.tsx`
Verification: `src/components/tree/tree.test.tsx`

### UIC-TREE-4.2 - Empty

A tree with no items that is not pending shall show `renderEmptyState`'s content in the `ui-tree__empty` slot, and nothing without it. React Aria publishes `data-empty` on the tree.

Implementation: `src/components/tree/tree.tsx`
Verification: `src/components/tree/tree.test.tsx`

### UIC-TREE-4.3 - Options

`density` (`compact` by default, `normal`, `spaced`), `variant` (`default`, or `picker` for a tree the reader chooses one row from, whose unavailable rows the stylesheet greys out) and `wrap` (labels may wrap instead of ellipsizing) shall publish `data-density`, `data-variant` and `data-wrap` on the tree.

Implementation: `src/components/tree/tree.tsx`, `labs/reference.css`
Verification: `src/components/tree/tree.test.tsx`, `e2e/tree.spec.ts`

### UIC-TREE-4.4 - Hooks and caller attributes

`Tree` shall carry the hooks below, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to the tree element.

Implementation: `src/components/tree/tree.tsx`
Verification: `src/components/tree/tree.test.tsx`

## Hooks

| Hook                      | Kind      | Values                        | Description                                                           |
| ------------------------- | --------- | ----------------------------- | --------------------------------------------------------------------- |
| `ui-tree`                 | root      |                               | The tree grid element.                                                |
| `ui-tree__item`           | slot      |                               | A row.                                                                |
| `ui-tree__drag-handle`    | slot      |                               | The row's drag button, in a reorderable tree.                         |
| `ui-tree__expand`         | slot      |                               | The expand button of a row with children.                             |
| `ui-tree__expand-spacer`  | slot      |                               | Holds the expand button's place in a row without children.            |
| `ui-tree__icon`           | slot      |                               | The row icon (also `ui-icon`).                                        |
| `ui-tree__label`          | slot      |                               | The row label.                                                        |
| `ui-tree__meta`           | slot      |                               | Secondary text after the label.                                       |
| `ui-tree__actions`        | slot      |                               | The row's trailing controls.                                          |
| `ui-tree__drop-indicator` | slot      |                               | The line where a dragged row would land, between rows.                |
| `ui-tree__loader`         | slot      |                               | The loading row below an expanded row whose children are loading.     |
| `ui-tree__empty`          | slot      |                               | The loading row or the empty-state content.                           |
| `ui-tree__spinner`        | slot      |                               | Busy indicator in a loading row.                                      |
| `data-density`            | attribute | `compact`, `normal`, `spaced` | Row spacing.                                                          |
| `data-variant`            | attribute | `default`, `picker`           | Navigation tree or picker.                                            |
| `data-expand-glyph`       | attribute | `chevron`, `plus-minus`       | The expand button's glyphs.                                           |
| `data-wrap`               | state     | `true`                        | Labels may wrap.                                                      |
| `data-pending`            | state     | `true`                        | Items are loading (tree), or the empty slot is the loading row.       |
| `data-current`            | state     | `true`                        | The current row.                                                      |
| `data-position`           | attribute | `before`, `after`             | Which side of its row a drop indicator stands for.                    |
| `--ui-tree-level`         | property  |                               | A row's (or loading row's) depth, from 1, for indentation.            |
| `data-empty`              | state     | `true`                        | The tree has no items (React Aria).                                   |
| `data-focused`            | state     | `true`                        | The tree, a row or a button has focus (React Aria).                   |
| `data-focus-visible`      | state     | `true`                        | Keyboard focus (React Aria).                                          |
| `data-selection-mode`     | state     | `single`, `multiple`          | The selection mode (React Aria).                                      |
| `data-allows-dragging`    | state     | `true`                        | The tree or row allows dragging (React Aria).                         |
| `data-drop-target`        | state     | `true`                        | The tree, a row or a drop indicator is the current drop target.       |
| `data-expanded`           | state     | `true`                        | An expanded row (React Aria).                                         |
| `data-has-child-items`    | state     | `true`                        | A row with children (React Aria).                                     |
| `data-level`              | state     |                               | A row's depth, from 1 (React Aria).                                   |
| `data-selected`           | state     | `true`                        | A selected row (React Aria).                                          |
| `data-disabled`           | state     | `true`                        | A disabled row or button (React Aria).                                |
| `data-hovered`            | state     | `true`                        | Pointer over a row or button (React Aria).                            |
| `data-pressed`            | state     | `true`                        | A row or button is pressed (React Aria).                              |
| `data-dragging`           | state     | `true`                        | The row being dragged (React Aria).                                   |
| `data-href`               | state     |                               | A link row's destination (React Aria).                                |
| `data-key`                | state     |                               | React Aria's key for a row; not for styling.                          |
| `data-collection`         | state     |                               | React Aria's collection id on the tree and its rows; not for styling. |
