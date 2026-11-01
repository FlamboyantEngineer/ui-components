# Action Row

`ActionRow` draws a row of actions described as data, each as an [Icon Button](BUTTON.md) with a tooltip. Standard verbs carry a fixed glyph, label and place; custom actions name their own icon and label. Any action can open a [Menu](MENU.md) of typed items. Optional lead content (a title, a filter, a status line) sits before the actions. The actions can form one React Aria toolbar, collapse into a "more" menu when they do not fit, and the row can serve as a collection's selection bar.

## UIC-ACTION-ROW-1 - Actions

### UIC-ACTION-ROW-1.1 - Standard verbs

An action whose `verb` is a standard verb shall draw that verb's glyph and be named by its provider string, as `actionVerbs` lists: `add` (`plus`, `add`), `refresh` (`refresh`, `refresh`), `more` (`more`, `more`), `edit` (`edit`, `edit`), `delete` (`delete`, `delete`), `save` (`save`, `save`), `cancel` (`close`, `cancel`) and `close` (`close`, `close`). An action's `label` replaces the verb's label, for example to name its subject ("Add comment"), and keeps the glyph and place. A verb outside the list is a type error.

Implementation: `src/components/action-row/action-row.tsx`, `src/core/glyphs.tsx`, `src/core/strings.ts`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

### UIC-ACTION-ROW-1.2 - Custom actions

An action with `verb: 'custom'` shall draw its `icon` (an imported icon component or rendered element) and be named by its required `label`. Its icon is optional: without one the button shows its `label` as visible text, which names it, and keeps its toggle, pending, disabled and menu semantics. Its optional `isSelected` makes it a toggle: `aria-pressed` reports `true` or `false` and `data-selected` marks the pressed state. Its `ref` reaches the button, so a caller can return focus to it.

Implementation: `src/components/action-row/action-row.tsx`
Verification: `src/components/action-row/action-row.test.tsx`

### UIC-ACTION-ROW-1.3 - Order

The row shall draw custom actions first, in the order given, then the standard verbs in the fixed order `add`, `refresh`, `more`, `edit`, `delete`, `save`, `cancel`, `close`; actions of the same verb keep their given order. `orderActions` exposes the same order.

Implementation: `src/components/action-row/action-row.tsx`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

### UIC-ACTION-ROW-1.4 - Tooltips

Each action shall show its `tooltip`, or its label when it has none, through the button's own `tooltip` ([Button](BUTTON.md), a `ui-tooltip` panel) on hover and on keyboard focus. The open tooltip of an action with its own `tooltip` describes the button; a tooltip that only repeats the label does not describe it ([UIC-BUTTON-11.7](BUTTON.md)). The accessible name stays the label.

Implementation: `src/components/action-row/action-row.tsx`, `src/components/action-row/action-row-actions.tsx`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

### UIC-ACTION-ROW-1.5 - Action states and attributes

`isDisabled` shall disable an action natively, except that a disabled action with its own `tooltip` stays focusable (`aria-disabled="true"`) so the tooltip explaining it can be read. `isPending` shows Icon Button's busy indicator and refuses presses; a pending `save` names its indicator with the provider's `saving` string. `isExpanded` publishes `aria-expanded`; `aria-controls` and `aria-haspopup` pass through, and the action's `data-*` attributes are forwarded to its button, which also publishes its verb in `data-verb`. `onPress` runs on activation. When it returns a promise, the action is pending until the promise settles, with the same busy indicator and refused presses whether the action is a button or an item of the overflow menu, and while it moves between the two as the row resizes; the row tracks it by the action's identity (UIC-ACTION-ROW-1.7). A rejection reaches the action's `onError`, or is rethrown, as with [Button](BUTTON.md). The caller's `isPending`, when set, wins over the tracked state.

Implementation: `src/components/action-row/action-row.tsx`, `src/components/action-row/use-action-pending.ts`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

### UIC-ACTION-ROW-1.6 - Menu actions

An action with non-empty `items` shall open a [Menu](MENU.md) of those entries (items with their `icon`, `description`, `shortcut`, `tone`, `isDisabled` and submenus, sections and separators, as `Menu` takes them as data) in a `MenuPopover` at the button's bottom end, from its button: on press, Enter or Space, and on Arrow Down or Arrow Up, which focus the first or last item. The menu is labelled by the button and takes the row's size (`sm` for `xs`). The button keeps its tooltip and states, carries React Aria's `aria-haspopup`, `aria-expanded` and, while open, `aria-controls`, which replace the action's own `isExpanded` and `aria-haspopup`, and never calls the action's `onPress`. Choosing an item calls the item's `onAction` and the action's `onAction` with the item's `id`, closes the menu and returns focus to the button. A disabled or pending action does not open its menu, and a menu open when its action turns disabled or pending closes and stays closed when the action is enabled again; its items choose nothing meanwhile. Without items the action is a plain button. Items arriving or leaving keep the button's `<button>` element, ref, focus and tooltip, and a menu open when its items leave closes. This is the `more` verb's menu.

Implementation: `src/components/action-row/action-row.tsx`, `src/components/menu/menu.tsx`
Verification: `src/components/action-row/action-row.test.tsx`, `src/components/action-row/action-row-menu-locking.test.tsx`, `e2e/action-row.spec.ts`

### UIC-ACTION-ROW-1.7 - Action identity

Each action shall be identified by its `id`: required on a custom action, and defaulting to the verb on a standard one, so a row with the same verb twice gives each an `id` (ids are unique within a row, as React keys are). The `id` identifies the action, not its button element. An action keeps its own button, with its focus and internal press and pending state, while other actions are added, removed or reordered, and a button is never reused for another action. When the action holding focus leaves the row, or moves into the overflow menu, focus moves to the next button in the actions slot that is still there, else to the overflow menu's button, else to the previous button, so it never falls to the page. Focus is read through open shadow roots, so this holds for a row inside one.

Implementation: `src/components/action-row/action-verbs.ts`, `src/components/action-row/action-row-actions.tsx`, `src/utils/use-overflow-focus.ts`, `src/utils/focus-target.ts`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

## UIC-ACTION-ROW-2 - Row

### UIC-ACTION-ROW-2.1 - Lead and empty row

The row shall render `lead` in the `ui-action-row__lead` slot before the `ui-action-row__actions` slot that holds the buttons. A lead that renders nothing (`null`, `undefined`, a boolean or an empty string) draws no slot, and a row with no actions and no such lead renders nothing.

Implementation: `src/components/action-row/action-row.tsx`
Verification: `src/components/action-row/action-row.test.tsx`

### UIC-ACTION-ROW-2.2 - Size

`size` (`xs`, `sm`, `md` by default, `lg`) shall size every action button and publish `data-size` on the root.

Implementation: `src/components/action-row/action-row.tsx`, `labs/reference/action-row.css`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

### UIC-ACTION-ROW-2.3 - Hooks and caller attributes

`ActionRow` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/action-row/action-row.tsx`
Verification: `src/components/action-row/action-row.test.tsx`

### UIC-ACTION-ROW-2.4 - Toolbar

With `toolbar` the actions slot shall be a React Aria `Toolbar`: `role="toolbar"` named by the row's `aria-label` or `aria-labelledby`, with `data-orientation`. Tab enters and leaves it as one stop, Arrow Left and Arrow Right move focus between the actions (mirrored right to left), and focus returning to it goes back to the action that last had it. Inside a text control in the toolbar (a text input, a slider or select, a text area, editable content, or an element with role `textbox` or `combobox`) the arrow keys move the caret and move focus only from the end of the text they point to, with no modifier held (Shift, Alt, Control or Meta arrows stay with the control) and no input method composing; a field among several in a group, such as the cells of a `PinInput`, moves between them first. Without `toolbar` each action is its own tab stop and the row takes no name.

Implementation: `src/components/action-row/action-row.tsx`, `src/components/action-row/action-row-actions.tsx`, `src/utils/toolbar-caret-keys.tsx`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

### UIC-ACTION-ROW-2.5 - Overflow menu

`overflow` shall publish `data-overflow` on the root: `visible` (the default) keeps every action, and `menu` renders only the actions that fit in the actions slot, in their order from the start, as [`useOverflowItems`](OVERFLOW-LIST.md) measures them. While actions are hidden, a `ui-action-row__overflow` element at the end of the slot holds an icon-only [Dropdown Menu](DROPDOWN-MENU.md) of the row's size, named by the provider's `moreItems` text with the count, listing each hidden action by its label and icon with its disabled and pending states (including a press still running, UIC-ACTION-ROW-1.5): choosing an action runs its `onPress`, and an action with `items` opens them as a submenu. A choice in that submenu, in its sections and nested submenus too, calls the item's own `onAction` and that action's `onAction` with the item's `id`, and never another action's: item ids need be unique only within one action's menu. Inside a toolbar the arrow keys reach the menu button.

Implementation: `src/components/action-row/action-row.tsx`, `src/components/action-row/action-row-actions.tsx`, `src/utils/use-overflow-items.ts`, `labs/reference/action-row.css`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

## UIC-ACTION-ROW-3 - Selection bar

### UIC-ACTION-ROW-3.1 - Selected count and clearing

With `selectedCount` the row shall be a collection's selection bar: it renders only while the count is above zero, publishes `data-selection`, and draws a `ui-action-row__selection` slot before the lead holding a `ui-action-row__clear` [Icon Button](BUTTON.md) (`close`, named by the provider's `clearSelection` string, when `onClearSelection` is set) and a `ui-action-row__count` status (`role="status"`) with the provider's `selectedCount` text, so a change of count is announced. Pressing the clear button, or Escape inside the row that nothing in it handled, calls `onClearSelection`. An Escape that an input method composition owns (pressed while composing, or reported with key code 229) cancels the composition only and leaves the selection. The row's actions are the bulk actions.

Implementation: `src/components/action-row/action-row.tsx`, `src/components/action-row/action-row-actions.tsx`, `labs/reference/action-row.css`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

## Hooks

| Hook                       | Kind      | Values                                                                          | Description                                                               |
| -------------------------- | --------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `ui-action-row`            | root      |                                                                                 | The row `<div>`.                                                          |
| `ui-action-row__selection` | slot      |                                                                                 | The selected count and its clear button.                                  |
| `ui-action-row__clear`     | slot      |                                                                                 | The clear button (also `ui-button`).                                      |
| `ui-action-row__count`     | slot      |                                                                                 | The selected count (`role="status"`).                                     |
| `ui-action-row__lead`      | slot      |                                                                                 | The lead content, before the actions.                                     |
| `ui-action-row__actions`   | slot      |                                                                                 | The `<div>` holding the action buttons (`role="toolbar"` with `toolbar`). |
| `ui-action-row__overflow`  | slot      |                                                                                 | The element holding the menu of hidden actions.                           |
| `ui-action-row__action`    | slot      |                                                                                 | One action button (also `ui-button`).                                     |
| `data-size`                | attribute | `xs`, `sm`, `md`, `lg`                                                          | Size of the action buttons.                                               |
| `data-overflow`            | attribute | `visible`, `menu`                                                               | What happens to actions that do not fit.                                  |
| `data-selection`           | state     | `true`                                                                          | The row is a selection bar.                                               |
| `data-orientation`         | state     | `horizontal`                                                                    | The toolbar's orientation (React Aria).                                   |
| `data-verb`                | attribute | `custom`, `add`, `refresh`, `more`, `edit`, `delete`, `save`, `cancel`, `close` | The action's verb.                                                        |
