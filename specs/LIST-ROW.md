# List Row

`List` and `ListRow` draw a native list of rows for generic lists: search results, recent items, notifications, file lists. Each row has one primary control (a link, a button or a focusable read-only body) holding its text, and optional trailing controls beside it. The list keeps a single tab stop and moves focus between rows with the arrow keys. `ListRowContent` draws a row's text alone, for an element that is itself the link. `ListView` with `ListViewItem` and `ListViewSection` draws the same rows on React Aria's grid list, for collections the reader selects, reorders, searches by typing or scrolls through at length.

## UIC-LIST-ROW-1 - List

### UIC-LIST-ROW-1.1 - Native list

`List` shall render a `<ul>` named by its `aria-label` or `aria-labelledby`, and each `ListRow` an `<li>`. Primary controls keep their native semantics: a link row's primary control is a link, an action row's a button, and a read-only row's a focusable element with no role.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`, `e2e/list-row.spec.ts`

### UIC-LIST-ROW-1.2 - One tab stop

Exactly one enabled row's primary control shall be in the tab sequence: the first row until focus enters the list, then the row that last held focus, including focus on one of its trailing controls. Moving focus between rows shall re-render only the row losing the tab stop and the row taking it.

Implementation: `src/components/list-row/list-row.tsx`, `src/components/list-row/use-list-navigation.ts`
Verification: `src/components/list-row/list-row.test.tsx`, `e2e/list-row.spec.ts`

### UIC-LIST-ROW-1.3 - Arrow navigation

ArrowDown and ArrowUp on a primary control shall move focus to the next or previous enabled row in document order, and Home and End to the first or last, without wrapping and without activating anything. Disabled rows are skipped. Keys pressed with a modifier, and keys pressed in trailing controls, keep their ordinary behaviour.

Implementation: `src/components/list-row/list-row.tsx`, `src/components/list-row/use-list-navigation.ts`
Verification: `src/components/list-row/list-row.test.tsx`, `e2e/list-row.spec.ts`

### UIC-LIST-ROW-1.4 - Boundary and requested focus

ArrowUp on the first row shall call `onNavigatePastStart` when it is set, so an associated search field can take focus back. `handleRef` shall receive `focusFirst()`, which focuses the first enabled row in the current document order, after keyed reorders included.

Implementation: `src/components/list-row/list-row.tsx`, `src/components/list-row/use-list-navigation.ts`
Verification: `src/components/list-row/list-row.test.tsx`

### UIC-LIST-ROW-1.5 - Focus recovery

When the row holding focus is removed, focus shall move to the nearest remaining row, preferring the next row at equal distance. A row whose primary control is replaced (an action row becoming read-only while it is renamed, and back) keeps focus on its new primary control. Focus that has left the list, including a blur with no related target, cancels the recovery. A removed tab-stop row leaves a remaining row in the tab sequence. Focus is read through open shadow roots, so this holds for a list inside one.

Implementation: `src/components/list-row/list-row.tsx`, `src/components/list-row/use-list-navigation.ts`, `src/utils/focus-target.ts`
Verification: `src/components/list-row/list-row.test.tsx`

### UIC-LIST-ROW-1.6 - Pending and dividers

`isPending` shall set `aria-busy="true"` and `data-pending` on the list. `divided` shall publish `data-divided`, from which the stylesheet draws dividers between rows.

Implementation: `src/components/list-row/list-row.tsx`, `labs/reference/list-row.css`
Verification: `src/components/list-row/list-row.test.tsx`, `e2e/list-row.spec.ts`

### UIC-LIST-ROW-1.7 - List hooks and caller attributes

`List` shall carry the hooks below, append the caller's `className`, and forward `id`, `ref`, caller `data-*` attributes and the other native list props ([UIC-COMPOSITION-2.4](COMPOSITION.md#uic-composition-24---native-props-of-containers): all of them but `dangerouslySetInnerHTML`) to the `<ul>`. A caller's key and blur handlers run before the list's own; arrow navigation skips a key whose default the caller prevented.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`

## UIC-LIST-ROW-2 - Row

### UIC-LIST-ROW-2.1 - Primary control

A row with `href` shall render its primary control as a link, published as `data-kind="link"`. A row with `onPress` and no `href` shall render a React Aria button that runs `onPress` on click, Enter and Space (`action`). A row with neither shall render a focusable read-only element that offers no command (`static`).

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`, `e2e/list-row.spec.ts`

### UIC-LIST-ROW-2.2 - One link, nothing nested

A link row shall render exactly one link, holding the row's icon, title and meta, with no interactive element inside it. Trailing content shall render after the primary control as its sibling, never inside it. `ListRowContent` shall draw the same text with no control at all, for use inside an element that is itself the link or button.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`, `e2e/list-row.spec.ts`

### UIC-LIST-ROW-2.3 - Links through the provider

A link row shall render its link through the provider's link renderer with `href`, `target` and `rel`; `target="_blank"` adds `noopener` and `noreferrer` to the caller's `rel`, as a [Link](LINK.md#uic-link-22---new-tabs) does. `onPress` shall run when the link is followed and `onAuxPress` on a middle-button click. The row never cancels a click, so modifier clicks keep their browser behaviour.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`

### UIC-LIST-ROW-2.4 - Row text

A row shall draw its `title` and, when it has content, its `meta` below it. An `icon` (an imported icon component or rendered element) shall be drawn through `IconLabel`, beside both lines and taking the row's free width; it takes precedence over `leading`, decorative media drawn before the text and hidden from assistive technology.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`

### UIC-LIST-ROW-2.5 - Current row

`isCurrent` shall set `aria-current="page"` on a link row's link and `aria-current="true"` on other primary controls, and publish `data-current` on the row.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`

### UIC-LIST-ROW-2.6 - Disabled row

`isDisabled` shall publish `data-disabled` on the row, render a link row without its link, disable an action row's button, and leave the row out of the tab sequence and arrow navigation.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`

### UIC-LIST-ROW-2.7 - Tone

`tone` (`neutral`, `danger`) shall publish `data-tone` on the row, `neutral` when unset, for semantic emphasis such as an overdue item.

Implementation: `src/components/list-row/list-row.tsx`, `labs/reference/list-row.css`
Verification: `src/components/list-row/list-row.test.tsx`

### UIC-LIST-ROW-2.8 - Row hooks and caller attributes

`ListRow` and `ListRowContent` shall carry the hooks below, append the caller's `className`, and forward `id`, caller `data-*` attributes and the other native props ([UIC-COMPOSITION-2.4](COMPOSITION.md#uic-composition-24---native-props-of-containers): all of them but `dangerouslySetInnerHTML`) to their root. The component's own attributes win over caller attributes of the same name.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`

### UIC-LIST-ROW-2.9 - Reference layout

The reference sheet shall keep the title and the meta on one line each, ellipsized, and move trailing content below the text when the row is too narrow for both.

Implementation: `labs/reference/list-row.css`
Verification: `e2e/list-row.spec.ts`

## UIC-LIST-ROW-3 - List view

### UIC-LIST-ROW-3.1 - Grid list of rows

`ListView` shall render React Aria's `GridList` in its `stack` layout with the `ui-list-view` root, named by its `aria-label` or `aria-labelledby`, and `ListViewItem` a `GridListItem` (`ui-list-view-item`, keyed by its `id`) whose cell holds the row text drawn by `ListRowContent` (`title`, `meta`, `icon`, `leading`) followed by `trailing` controls in the `ui-list-view-item__trailing` slot. Rows come from `ListViewItem` and `ListViewSection` children, or from `items` with a function in `children` that draws one per item and redraws them when `dependencies` change. The list is one tab stop: ArrowDown and ArrowUp move between rows, Home and End to the first and last, and Enter or a press calls `onAction` with the row's key or follows the item's `href` (React Aria). A string `title` is the item's `textValue` unless one is given. `divided` publishes `data-divided` and the item's `tone` (`neutral` by default, `danger`) `data-tone`, as on `List` and `ListRow`.

IDs on `ListViewItem` and `ListViewSection`, including IDs inferred from dynamic items, retain their primitive type: numeric `1` and text `'1'` remain distinct, as do text IDs differing only by whitespace. Selection, action and reorder callbacks report the original IDs. Internally encoded collection IDs keep React keys and accessibility references unique. A `ListViewItem` or `ListViewSection` rendered through a host component that forwards its props, as a child or for each of `items`, keeps its `id` ([UIC-COMPOSITION-4.2](COMPOSITION.md#uic-composition-42---collection-items-behind-a-host-component)): selection, disabled keys and callbacks reach it by that `id`.

Implementation: `src/components/list-row/list-view.tsx`, `labs/reference/list-row.css`
Verification: `src/components/list-row/list-view.test.tsx`, `e2e/list-row.spec.ts`

### UIC-LIST-ROW-3.2 - Typeahead

Typing printable characters while a row has focus shall move focus to the next row whose text value starts with the typed text (React Aria).

Implementation: `src/components/list-row/list-view.tsx`
Verification: `src/components/list-row/list-view.test.tsx`, `e2e/list-row.spec.ts`

### UIC-LIST-ROW-3.3 - Selection

The selection props (`selectionMode`, `selectionBehavior`, `selectedKeys`, `defaultSelectedKeys`, `onSelectionChange` with the new `Selection`, `disallowEmptySelection`, `disabledKeys`) shall select rows: selected rows carry `aria-selected` and `data-selected`, and a multiple-selection list `aria-multiselectable`. While the list selects with toggles (`selectionBehavior="toggle"`, the default), each row draws a selection [Checkbox](CHECKBOX.md) before its text in the `ui-list-view-item__checkbox` slot, which reports and toggles the row's selection; with `replace` no checkbox draws and a press replaces the selection. The list holds an uncontrolled selection itself, so turning `reorder` or `virtualized` on or off never resets it to `defaultSelectedKeys` or reports a change, and the row that held focus takes it again once the list redraws, unless focus moved elsewhere.

One-shot generators supplied for selected, initial or disabled keys keep their values across unrelated rerenders. Controlled updates preserve the primitive's range-selection anchor; mutable Sets and arrays still reflect membership changes.

Implementation: `src/components/list-row/list-view.tsx`, `labs/reference/list-row.css`
Verification: `src/components/list-row/list-view.test.tsx`, `e2e/list-row.spec.ts`

### UIC-LIST-ROW-3.4 - Sections and sticky headers

`ListViewSection` shall render a React Aria `GridListSection` (`ui-list-view-section`, a `rowgroup` named by its header, keyed by its `id`) whose first row is a `GridListHeader` holding its `title` (`ui-list-view-section__header`), followed by its children or the rows a function in `children` draws from its `items`. Arrow keys move across sections from row to row, skipping headers. `stickyHeaders` shall publish `data-sticky-headers` on the list, from which the stylesheet keeps the header of the section in view at the top of the scrolling list; the reference sheet does so.

Implementation: `src/components/list-row/list-view.tsx`, `labs/reference/list-row.css`
Verification: `src/components/list-row/list-view.test.tsx`, `e2e/list-row.spec.ts`

### UIC-LIST-ROW-3.5 - Drag and drop

With `reorder`, the reader shall reorder rows by drag and drop, by pointer or by keyboard from a row's drag handle (React Aria's `useDragAndDrop`), and each drop shall report one `reorder.onMove({ keys, targetKey, position })` with `position` `before` or `after`. The list never reorders its rows itself: the owner applies the move and renders the new order. A drop on a row, or beside one of the dragged rows, is refused. While the list reorders, each row draws a [DragHandle](DRAG-HANDLE.md) in the `ui-list-view-item__drag-handle` slot first and publishes `data-allows-dragging`; the dragged row carries `data-dragging`, and the landing spot between rows is a `ui-list-view__drop-indicator` row with `data-position` (`before`, `after`) and `data-drop-target`. A list without `reorder` draws no drag affordance; turning it on or off remounts the rows.

Implementation: `src/components/list-row/list-view.tsx`, `src/utils/use-reorder-drag-and-drop.ts`, `labs/reference/list-row.css`
Verification: `src/components/list-row/list-view.test.tsx`, `e2e/list-row.spec.ts`

### UIC-LIST-ROW-3.6 - Long and incrementally loaded lists

`virtualized` shall render the list through React Aria's `Virtualizer` with its list layout: only the rows in view, plus a small buffer, are in the document, at `rowHeight` pixels each (48 by default; section headers and the loading row take the same height). `onLoadMore` shall be called when the end of the rows scrolls into view while `isLoading` is false, through React Aria's `GridListLoadMoreItem` after the rows (`ui-list-view__loader`), virtualized or not; while `isLoading`, the loading row shows a small loading [EmptyState](EMPTY-STATE.md) (a polite status) reading the provider's `loading` string. `renderEmptyState` draws the empty list, which publishes `data-empty`.

Implementation: `src/components/list-row/list-view.tsx`, `labs/reference/list-row.css`
Verification: `src/components/list-row/list-view.test.tsx`, `e2e/list-row.spec.ts`

## UIC-LIST-ROW-4 - Row controls

### UIC-LIST-ROW-4.1 - Leading row controls

Row checkboxes and drag handles precede all content in a horizontal row, vertically centered beside the title, metadata, icons and trailing actions. The reference stylesheet applies flex layout to the row itself because React Aria's generated grid cell uses display: contents. This stays true in narrow panes and during selection or dragging.

Implementation: `labs/reference/list-row.css`
Verification: `e2e/list-row.spec.ts`

## Hooks

| Hook                             | Kind      | Values                     | Description                                                        |
| -------------------------------- | --------- | -------------------------- | ------------------------------------------------------------------ |
| `ui-list`                        | root      |                            | The `<ul>`.                                                        |
| `data-divided`                   | state     | `true`                     | Dividers between rows requested.                                   |
| `data-pending`                   | state     | `true`                     | Rows are loading or updating.                                      |
| `ui-list-row`                    | root      |                            | The `<li>`.                                                        |
| `ui-list-row__primary`           | slot      |                            | The link, button or read-only body holding the row text.           |
| `ui-list-row__trailing`          | slot      |                            | Trailing controls, after the primary control.                      |
| `data-kind`                      | attribute | `link`, `action`, `static` | What the primary control is.                                       |
| `data-tone`                      | attribute | `neutral`, `danger`        | Semantic emphasis.                                                 |
| `data-current`                   | state     | `true`                     | The current row.                                                   |
| `data-disabled`                  | state     | `true`                     | Disabled row, or the disabled action button (React Aria).          |
| `data-hovered`                   | state     | `true`                     | Pointer over an action row's button (React Aria).                  |
| `data-pressed`                   | state     | `true`                     | An action row's button is pressed (React Aria).                    |
| `data-focused`                   | state     | `true`                     | An action row's button has focus (React Aria).                     |
| `data-focus-visible`             | state     | `true`                     | An action row's button has keyboard focus (React Aria).            |
| `ui-list-row-content`            | root      |                            | The row text: leading media or icon, title and meta.               |
| `ui-list-row-content__leading`   | slot      |                            | Decorative leading media.                                          |
| `ui-list-row-content__text`      | slot      |                            | The title and meta lines (the `IconLabel` label with `icon`).      |
| `ui-list-row-content__title`     | slot      |                            | The title line.                                                    |
| `ui-list-row-content__meta`      | slot      |                            | The meta line.                                                     |
| `ui-list-view`                   | root      |                            | The grid list (`role="grid"`).                                     |
| `ui-list-view__drop-indicator`   | slot      |                            | Where dragged rows would land, between rows.                       |
| `ui-list-view__loader`           | slot      |                            | The loading row after the rows while more load.                    |
| `data-sticky-headers`            | state     | `true`                     | Section headers stay in view while their rows scroll.              |
| `data-position`                  | attribute | `before`, `after`          | Which side of its row a drop indicator stands for.                 |
| `ui-list-view-item`              | root      |                            | A row (`role="row"`).                                              |
| `ui-list-view-item__drag-handle` | slot      |                            | The row's drag handle (also `ui-drag-handle`).                     |
| `ui-list-view-item__checkbox`    | slot      |                            | The selection checkbox (also `ui-checkbox`).                       |
| `ui-list-view-item__trailing`    | slot      |                            | Trailing controls, after the row text.                             |
| `ui-list-view-section`           | root      |                            | A section of rows (`role="rowgroup"`).                             |
| `ui-list-view-section__header`   | slot      |                            | The section's header row.                                          |
| `data-selected`                  | state     | `true`                     | A selected row (React Aria).                                       |
| `data-selection-mode`            | state     | `single`, `multiple`       | The list's selection mode, on rows (React Aria).                   |
| `data-allows-dragging`           | state     | `true`                     | A row the reader can drag (React Aria).                            |
| `data-dragging`                  | state     | `true`                     | A row being dragged (React Aria).                                  |
| `data-drop-target`               | state     | `true`                     | The list, a row or a drop indicator is the drop target.            |
| `data-focus-visible-within`      | state     | `true`                     | Keyboard focus inside a row (React Aria).                          |
| `data-layout`                    | state     | `stack`                    | The list's layout (React Aria).                                    |
| `data-orientation`               | state     | `vertical`                 | The list's orientation (React Aria).                               |
| `data-empty`                     | state     | `true`                     | The list has no rows (React Aria).                                 |
| `data-collection`                | state     |                            | React Aria's collection marker, on the list and its rows.          |
| `data-href`                      | state     |                            | A link row's address (React Aria).                                 |
| `data-key`                       | state     |                            | Opaque collection key (React Aria): not the `id`, not for styling. |
