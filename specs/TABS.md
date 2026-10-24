# Tabs

`Tabs` switches between peer sections of one surface. It is a family built on React Aria's `Tabs`, `TabList`, `Tab` and `TabPanel`: `Tabs` holds the selection, `TabList` the row (or column) of `Tab`s, and each `TabPanel` the content of the tab with the same `id`. A horizontal list that runs out of room scrolls, with optional scroll buttons, or collapses the tabs that do not fit into a "more" [Dropdown Menu](DROPDOWN-MENU.md) measured by [`useOverflowItems`](OVERFLOW-LIST.md); tabs can be removable and the list can add tabs. A list can also rename its tabs in place, reorder them by dragging and from the keyboard, and give each tab a menu of its actions, and `Tabs` can remember its selected tab through the provider's storage. Picking one of a few values of a setting is a [Segmented Choice](SEGMENTED-CHOICE.md); showing where a page sits in a hierarchy is a [Breadcrumb](BREADCRUMB.md).

Pointer ownership and drag lifecycle cleanup follow the shared [drag interaction contract](DRAG-INTERACTIONS.md).

## UIC-TABS-1 - Structure

### UIC-TABS-1.1 - Tabs, list and panels

`Tabs` shall render its root, a `TabList` with role `tablist` named by its `aria-label` or `aria-labelledby`, one `Tab` per section with role `tab` named by its label, and the `TabPanel` of the selected tab with role `tabpanel`, labelled by its tab. Each selected tab carries `aria-selected="true"` and `aria-controls` naming its panel, including tabs and panels returned from a host component that forwards their props ([UIC-COMPOSITION-4.2](COMPOSITION.md#uic-composition-42---collection-items-behind-a-host-component)). `selectedKey` with `onSelectionChange` controls the selection and `defaultSelectedKey` sets it when uncontrolled; without either, the first enabled tab is selected.

Implementation: `src/components/tabs/tabs.tsx`
Verification: `src/components/tabs/tabs.test.tsx`, `src/components/tabs/tab-keys.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-1.2 - Labels, icons and counts

A tab's children shall render in the `ui-tabs__label` slot, which publishes plain-text labels in `data-label` so a stylesheet can reserve the width of a heavier selected weight. `icon` (a built-in glyph name or any icon node) draws a decorative [Icon](ICON.md) in the `ui-tabs__icon` slot before the label. `count` shows a positive whole number after the label in the `ui-tabs__count` slot, capped at `countMax` (99 by default) as `<max>+`, following [Count](COUNT.md): finite, nonnegative caps round down and other caps are ignored; zero, negative and non-finite counts show nothing. The tab's accessible name is its visible text (the label, then the shown count), and its accessible description is `countLabel`, or the provider's `itemCount` text, with the full count.

Implementation: `src/components/tabs/tabs.tsx`
Verification: `src/components/tabs/tabs.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-1.3 - Selection indicator

The selected tab shall contain a selection indicator in the `ui-tabs__indicator` slot. When the selection moves, the indicator animates from the previous tab's position through any `translate` or size transition the stylesheet declares, so one bar appears to slide between tabs.

Implementation: `src/components/tabs/tabs.tsx`, `labs/reference/tabs.css`
Verification: `src/components/tabs/tabs.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-1.4 - Orientation and sizes

`orientation` (`horizontal` by default, or `vertical`) shall lay the tabs out in a row or a column and publish `data-orientation` on the root and the list. `size` (`sm`, `md` by default, `lg`) shall publish `data-size` on the root; the reference sheet draws 30, 36 and 42 pixel tabs.

Implementation: `src/components/tabs/tabs.tsx`, `labs/reference/tabs.css`
Verification: `src/components/tabs/tabs.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-1.5 - Hooks and caller attributes

Each family member shall carry its hooks below and append the caller's `className`. `Tabs`, `TabList`, `Tab` and `TabPanel` forward caller `data-*` attributes and `ref` to their elements; `Tabs` also forwards `id`, `TabList` and `Tab` the ARIA labelling attributes, and `Tab` its `onContextMenu` handler, so a host can open a menu for a tab. A tab's and a panel's `id` is a `Key` (a string or a number).

Implementation: `src/components/tabs/tabs.tsx`
Verification: `src/components/tabs/tabs.test.tsx`

### UIC-TABS-1.6 - Swapping elements

`Tabs`, `TabList`, `Tab` and `TabPanel` shall take `render(props, state)`, typed `ElementRender<'div', State>`, so the caller can replace each element as [COMPOSITION.md](COMPOSITION.md) describes; the replacement receives the element's hook classes, data attributes, handlers and ref, and a library state: `TabsRenderState` and `TabListRenderState` (`orientation`), `TabRenderState` (`isSelected`, `isHovered`, `isPressed`, `isFocused`, `isFocusVisible`, `isDisabled`) and `TabPanelRenderState` (`isFocused`, `isFocusVisible`, `isInert`, `isEntering`, `isExiting`). A tab with `href` receives an anchor's props, and its replacement renders an `<a>`.

Implementation: `src/components/tabs/tabs.tsx`, `src/components/tabs/tab-list.tsx`
Verification: `src/components/tabs/tab-list.test.tsx`

## UIC-TABS-2 - Behaviour

### UIC-TABS-2.1 - Pointer and keyboard selection

Pressing a tab shall select it. Focus roves: only the selected tab is in the tab order. The arrow keys of the list's orientation (mirrored in right-to-left locales for a horizontal list) shall move to the previous or next enabled tab, wrapping at both ends, and Home and End to the first and last enabled tab. With the default `keyboardActivation="automatic"` moving focus also selects; with `manual`, Space or Enter selects the focused tab.

Implementation: `src/components/tabs/tabs.tsx`
Verification: `src/components/tabs/tabs.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-2.2 - Disabled tabs

A `Tab` with `isDisabled` (or listed in `disabledKeys`) shall carry `aria-disabled="true"` and `data-disabled`, ignore presses including its close mark, and be skipped by keyboard navigation. `isDisabled` on `Tabs` disables every tab, the overflow menu and reordering. Disabled states shall also refuse Delete or Backspace on a tab that already has focus. The close mark follows changes to these disabled states without removing the mark.

Implementation: `src/components/tabs/tabs.tsx`
Verification: `src/components/tabs/tabs.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-2.3 - Tab links

A `Tab` with `href` shall render an `<a>` that keeps tab semantics. Selecting it navigates to its `href`, through the provider's `navigate` when the host sets one ([PROVIDER.md](PROVIDER.md)).

Implementation: `src/components/tabs/tabs.tsx`
Verification: `src/components/tabs/tabs.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-2.4 - Overflow

While its tabs do not fit, the list shall publish `data-overflowing`, re-measured when the list resizes or its tabs change. Whenever the selection changes, and on first render, an overflowing list shall scroll the selected tab toward its middle, clamped to the list's scroll range so the last tab ends flush with the list's end, smoothly unless the reader prefers reduced motion.

Implementation: `src/components/tabs/tabs.tsx`, `src/components/tabs/tab-list-overflow.ts`, `labs/reference/tabs.css`
Verification: `src/components/tabs/tabs.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-2.5 - Interaction states

The family shall publish its states: on the root `data-focused` and `data-focus-visible` while focus is within it and `data-disabled` while every tab is disabled; on each tab `data-selected`, `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible` and `data-disabled`; on the indicator `data-entering` and `data-exiting`; and on each panel `data-focused`, `data-focus-visible`, `data-inert` (a force-mounted panel that is not selected), `data-entering` and `data-exiting`.

Implementation: `src/components/tabs/tabs.tsx`
Verification: `src/components/tabs/tabs.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-2.6 - Overflow menu

With `overflow="menu"` a horizontal list shall sit in a `ui-tabs__bar` element (with `data-overflow="menu"`) and render only the tabs that fit, as [`useOverflowItems`](OVERFLOW-LIST.md) measures them in the bar beside a `ui-tabs__overflow` element after the list. The selected tab, then the tab with keyboard focus, always stay; the others fit from the start. The rest stay in the tabs' collection, so panels, selection and keyboard navigation still reach them: an arrow key, Home or End that moves focus to a hidden tab shows it. The overflow element holds an icon-only [Dropdown Menu](DROPDOWN-MENU.md) named by the provider's `moreItems` text with the count, listing the hidden tabs by their text (`textValue`, or a plain-text label) with their disabled state and links; choosing one selects it. The list publishes `data-overflowing` while tabs are hidden. A vertical list scrolls.

Implementation: `src/components/tabs/tab-list.tsx`, `src/components/overflow-list/visible-collection.tsx`, `src/utils/use-overflow-items.ts`, `labs/reference/tabs.css`
Verification: `src/components/tabs/tab-list.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-2.7 - Scroll buttons

With `scrollButtons` a horizontal list that scrolls shall sit in a `ui-tabs__bar` element between two `ui-tabs__scroll-button` [Icon Buttons](ICON-BUTTON.md) (`data-edge` `start` and `end`), each hidden with the native `hidden` attribute while its edge hides no tabs, as the [scroll strip hook](SCROLL-STRIP.md) measures it. Pressing one scrolls the list by 80% of its visible width toward its edge. They are named by the provider's `scrollBackward` and `scrollForward` strings, draw a chevron pointing to their edge (mirrored right to left) and stay out of the tab order, since the arrow keys reach every tab. The vertical wheel also scrolls the list sideways.

Implementation: `src/components/tabs/tab-list.tsx`, `src/utils/use-scroll-strip-overflow.ts`, `labs/reference/tabs.css`
Verification: `src/components/tabs/tab-list.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-2.8 - Removable and added tabs

With `onRemove` every tab with an `id` shall draw a close mark in a `ui-tabs__remove` slot and announce `Delete` in `aria-keyshortcuts` (UIC-TABS-3.6). Pressing the mark with a pointer calls `onRemove` with a set holding the tab's `id`, without selecting or focusing the tab; the mark is hidden from assistive technology because Delete or Backspace on the focused tab does the same from the keyboard. The caller removes the tab, and focus moves to a neighbouring tab. With `onAdd` the list draws a `ui-tabs__add` [Icon Button](ICON-BUTTON.md) (`plus`, named by the provider's `addTab` string) after the tabs, in a `ui-tabs__bar` element, that calls it.

Implementation: `src/components/tabs/tabs.tsx`, `src/components/tabs/tab-list.tsx`, `labs/reference/tabs.css`
Verification: `src/components/tabs/tab-list.test.tsx`, `e2e/tabs.spec.ts`

## UIC-TABS-3 - Editing

### UIC-TABS-3.1 - Renaming in place

With `onRename`, double-clicking an enabled tab that has an `id`, pressing F2 on the focused tab, or choosing Rename in its menu (UIC-TABS-3.5) shall open a name field (`ui-tabs__rename-input`) named by the provider's `renameItem` string and holding the tab's text value selected; the tab publishes `data-renaming`. A tab holds no control of its own, so the field sits in a `ui-tabs__rename` element after the list, laid over the tab with an inline absolute position and the tab's measured size, re-measured as the list scrolls. Keys typed in the field never reach the list. Enter, and focus leaving the field, call `onRename` with the tab's `id` and the trimmed name when it is not blank and differs from the text value; Escape abandons the edit. Enter and Escape return focus to the tab; focus that returns to the tab from elsewhere, as a closing menu returns it, keeps the field open.

Implementation: `src/components/tabs/tab-rename.tsx`, `src/components/tabs/tab-list.tsx`, `src/components/tabs/tab.tsx`, `labs/reference/tabs.css`
Verification: `src/components/tabs/tab-rename.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-3.2 - Name validation

With `validateName`, the field shall check each trimmed name that is not blank and differs from the text value as it is typed, calling `validateName` with the tab's `id` and the name. A returned message marks the field `aria-invalid` (and `data-invalid`) and shows the message in a `ui-tabs__rename-error` element that describes the field; an empty result clears it. Enter on a refused name keeps the field open with its message; focus leaving the field abandons a refused name.

Implementation: `src/components/tabs/tab-rename.tsx`, `labs/reference/tabs.css`
Verification: `src/components/tabs/tab-rename.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-3.3 - Reordering by dragging

With `onReorder`, every enabled tab that has an `id` shall drag through React Aria's drag and drop, carrying its text value as `text/plain`, and take drops of another tab of the same list on the half of it under the pointer in reading order (the top or bottom half in a vertical list). While a drag would land beside a tab, that tab publishes `data-drop-position` (`before` or `after`), and the dragged tab publishes `data-dragging`. A drop calls `onReorder` with `{ key, targetKey, position }`; drops that would leave the tab where it is, drags from outside the list and drags of a disabled tab are refused. The list never reorders its tabs itself: the owner applies the move and renders the tabs in their new order.

Implementation: `src/components/tabs/tab-reorder.ts`, `src/components/tabs/tab.tsx`, `src/primitives/drag-and-drop.ts`, `labs/reference/tabs.css`
Verification: `src/components/tabs/tab-reorder.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-3.4 - Reordering by keyboard

With `onReorder`, Alt+ArrowLeft and Alt+ArrowRight on the focused tab of a horizontal list (mirrored in a right-to-left locale), or Alt+ArrowUp and Alt+ArrowDown in a vertical list, shall move it one place toward the start or the end, calling `onReorder` with its neighbour as `targetKey`, and keep focus on the moved tab. At either end, and on a disabled tab, the keys are claimed and nothing moves.

Implementation: `src/components/tabs/tab-reorder.ts`, `src/components/tabs/tab-list.tsx`
Verification: `src/components/tabs/tab-reorder.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-3.5 - Tab menu

With `getMenuItems`, every enabled tab that has an `id` shall open a [Context Menu](CONTEXT-MENU.md) of the entries `getMenuItems(key, standard)` returns: a secondary click focuses the tab and opens it at the pointer, a long touch opens it at the touch point, and the Context Menu key or Shift+F10 below the tab; closing it returns focus to where it was. `standard` holds an entry for each action the list takes, in groups separated by rules: `rename` (the provider's `rename` string, opening the name field), `duplicate` (`duplicate`, calling `onDuplicate` with the tab's `id`), `move-backward` and `move-forward` (`moveItem` with `left` and `right`, mirrored right to left, or `up` and `down` in a vertical list; disabled at either end; calling `onReorder`) and `delete` (`delete`, in the danger tone, calling `onRemove`). The owner returns them as they are, changed (for example disabled), reordered or with its own entries.

Implementation: `src/components/tabs/tab-menu.tsx`, `src/components/tabs/tab.tsx`, `src/components/context-menu/context-menu.tsx`
Verification: `src/components/tabs/tab-menu.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-3.6 - Announced keys

Every tab that has an `id` shall announce in `aria-keyshortcuts` the keys its list takes, in this order: `Delete` with `onRemove`, `F2` with `onRename`, `Alt+ArrowLeft Alt+ArrowRight` (or `Alt+ArrowUp Alt+ArrowDown` in a vertical list) with `onReorder`, and `Shift+F10` with `getMenuItems`.

Implementation: `src/components/tabs/tab-list.tsx`, `src/components/tabs/tab.tsx`
Verification: `src/components/tabs/tab-menu.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-3.7 - Remembered selection

With `persistKey` and no `selectedKey`, `Tabs` shall start from the selection stored under that key through the provider's storage ([PROVIDER.md](PROVIDER.md)) and store every selection, so a remounted `Tabs` restores it. With nothing stored, or an unreadable stored value, it starts from `defaultSelectedKey`; a stored key that no enabled tab has selects the first enabled tab, which is then stored. Another `persistKey` restores that key's selection. A controlled selection is never stored.

Implementation: `src/components/tabs/tabs.tsx`
Verification: `src/components/tabs/tabs.test.tsx`, `e2e/tabs.spec.ts`

## Hooks

| Hook                     | Kind      | Values                   | Description                                                                |
| ------------------------ | --------- | ------------------------ | -------------------------------------------------------------------------- |
| `ui-tabs`                | root      |                          | The `Tabs` element holding the list and panels.                            |
| `ui-tabs__bar`           | slot      |                          | The element around a list with a menu, scroll buttons or an add button.    |
| `ui-tabs__list`          | slot      |                          | The `TabList` (`role="tablist"`).                                          |
| `ui-tabs__scroll-button` | slot      |                          | A scroll button beside the list (also `ui-icon-button`).                   |
| `ui-tabs__overflow`      | slot      |                          | The element holding the menu of hidden tabs.                               |
| `ui-tabs__add`           | slot      |                          | The add button (also `ui-icon-button`).                                    |
| `ui-tabs__tab`           | slot      |                          | One `Tab` (`role="tab"`, an `<a>` with `href`).                            |
| `ui-tabs__indicator`     | slot      |                          | The selection indicator inside the selected tab.                           |
| `ui-tabs__icon`          | slot      |                          | A tab's leading icon (also `ui-icon`).                                     |
| `ui-tabs__label`         | slot      |                          | A tab's label.                                                             |
| `ui-tabs__count`         | slot      |                          | A tab's shown count.                                                       |
| `ui-tabs__remove`        | slot      |                          | A removable tab's close mark.                                              |
| `ui-tabs__rename`        | slot      |                          | The element after the list laid over a tab being renamed.                  |
| `ui-tabs__rename-input`  | slot      |                          | The name field of a tab being renamed.                                     |
| `ui-tabs__rename-error`  | slot      |                          | The message of a refused name.                                             |
| `ui-tabs__panel`         | slot      |                          | One `TabPanel` (`role="tabpanel"`).                                        |
| `data-size`              | attribute | `sm`, `md`, `lg`         | Tab block size, on the root.                                               |
| `data-orientation`       | attribute | `horizontal`, `vertical` | Layout and arrow-key axis, on the root, the bar and the list (React Aria). |
| `data-overflow`          | attribute | `scroll`, `menu`         | What the bar's list does with tabs that do not fit.                        |
| `data-edge`              | attribute | `start`, `end`           | The edge a scroll button belongs to.                                       |
| `data-label`             | attribute |                          | A plain-text label, on the label slot.                                     |
| `data-key`               | attribute |                          | Opaque collection key (React Aria): not the `id`, not for styling.         |
| `data-collection`        | attribute |                          | React Aria's collection identifier on the list and tabs; not for styling.  |
| `data-overflowing`       | state     | `true`                   | The list's tabs do not fit.                                                |
| `data-selected`          | state     | `true`                   | The selected tab.                                                          |
| `data-disabled`          | state     | `true`                   | A disabled tab, or every tab on the root.                                  |
| `data-hovered`           | state     | `true`                   | Pointer over a tab.                                                        |
| `data-pressed`           | state     | `true`                   | A tab is being pressed.                                                    |
| `data-focused`           | state     | `true`                   | A focused tab or panel, or focus within the root.                          |
| `data-focus-visible`     | state     | `true`                   | Keyboard focus on a tab or panel, or within the root.                      |
| `data-inert`             | state     | `true`                   | A force-mounted panel that is not selected.                                |
| `data-renaming`          | state     | `true`                   | A tab being renamed.                                                       |
| `data-dragging`          | state     | `true`                   | A tab being dragged.                                                       |
| `data-drop-position`     | state     | `before`, `after`        | The side of a tab a dragged tab would land on, in reading order.           |
| `data-invalid`           | state     | `true`                   | The name field holds a refused name (React Aria).                          |
| `data-entering`          | state     | `true`                   | The indicator or a panel is entering (React Aria animation hook).          |
| `data-exiting`           | state     | `true`                   | The indicator or a panel is exiting (React Aria animation hook).           |
