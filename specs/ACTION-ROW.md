# Action Row

`ActionRow` draws a row of actions described as data, each as an [Icon Button](BUTTON.md) with a tooltip. Callers provide stable ids, labels, optional icons and the order. Any action can open a [Menu](MENU.md) of typed items. Optional lead content (a title, a filter, a status line) sits before the actions. The actions can form one React Aria toolbar, collapse into a "more" menu when they do not fit.

## UIC-ACTION-ROW-1 - Actions

### UIC-ACTION-ROW-1.1 - Caller actions

Each action shall have a required stable `id` and `label`, an optional `icon` and `pendingLabel`, and the existing press, menu and state properties. Labels and glyphs come from the caller; the component applies no action vocabulary or ordering policy.
Implementation: `src/components/action-row/action-row.tsx`, `src/core/glyphs.tsx`, `src/core/strings.ts`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

### UIC-ACTION-ROW-1.2 - Custom actions

An action shall draw its `icon` (an imported icon component or rendered element) and be named by its required `label`. Its icon is optional: without one the button shows its `label` as visible text, which names it, and keeps its toggle, pending, disabled and menu semantics. Its optional `isSelected` makes it a toggle: `aria-pressed` reports `true` or `false` and `data-selected` marks the pressed state. Its `ref` reaches the button, so a caller can return focus to it.

Implementation: `src/components/action-row/action-row.tsx`
Verification: `src/components/action-row/action-row.test.tsx`

### UIC-ACTION-ROW-1.3 - Order

The row shall draw every action in the order supplied by the caller.
Implementation: `src/components/action-row/action-row.tsx`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

### UIC-ACTION-ROW-1.4 - Tooltips

Each action shall show its `tooltip`, or its label when it has none, through the button's own `tooltip` ([Button](BUTTON.md), a `ui-tooltip` panel) on hover and on keyboard focus. The open tooltip of an action with its own `tooltip` describes the button; a tooltip that only repeats the label does not describe it ([UIC-BUTTON-11.7](BUTTON.md)). The accessible name stays the label.

Implementation: `src/components/action-row/action-row.tsx`, `src/components/action-row/action-row-actions.tsx`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

### UIC-ACTION-ROW-1.5 - Action states and attributes

`isDisabled` shall disable an action natively, except that a disabled action with its own `tooltip` stays focusable (`aria-disabled="true"`) so the tooltip explaining it can be read. `isPending` shows Icon Button's busy indicator and refuses presses; `pendingLabel` names the pending indicator. `isExpanded` publishes `aria-expanded`; `aria-controls` and `aria-haspopup` pass through, and the action's `data-*` attributes are forwarded to its button. `onPress` runs on activation. When it returns a promise, the action is pending until the promise settles, with the same busy indicator and refused presses whether the action is a button or an item of the overflow menu, and while it moves between the two as the row resizes; the row tracks it by the action's identity (UIC-ACTION-ROW-1.7). A rejection reaches the action's `onError`, or is rethrown, as with [Button](BUTTON.md). The caller's `isPending`, when set, wins over the tracked state.

Implementation: `src/components/action-row/action-row.tsx`, `src/components/action-row/use-action-pending.ts`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

### UIC-ACTION-ROW-1.6 - Menu actions

An action with non-empty `items` shall open a [Menu](MENU.md) of those entries (items with their `icon`, `description`, `shortcut`, `tone`, `isDisabled` and submenus, sections and separators, as `Menu` takes them as data) in a `MenuPopover` at the button's bottom end, from its button: on press, Enter or Space, and on Arrow Down or Arrow Up, which focus the first or last item. The menu is labelled by the button and takes the row's size (`sm` for `xs`). The button keeps its tooltip and states, carries React Aria's `aria-haspopup`, `aria-expanded` and, while open, `aria-controls`, which replace the action's own `isExpanded` and `aria-haspopup`, and never calls the action's `onPress`. Choosing an item calls the item's `onAction` and the action's `onAction` with the item's `id`, closes the menu and returns focus to the button. A disabled or pending action does not open its menu, and a menu open when its action turns disabled or pending closes and stays closed when the action is enabled again; its items choose nothing meanwhile. Without items the action is a plain button. Items arriving or leaving keep the button's `<button>` element, ref, focus and tooltip, and a menu open when its items leave closes.

Implementation: `src/components/action-row/action-row.tsx`, `src/components/menu/menu.tsx`
Verification: `src/components/action-row/action-row.test.tsx`, `src/components/action-row/action-row-menu-locking.test.tsx`, `e2e/action-row.spec.ts`

### UIC-ACTION-ROW-1.7 - Action identity

Each action shall be identified by its `id`: required on every action (ids are unique within a row, as React keys are). The `id` identifies the action, not its button element. An action keeps its own button, with its focus and internal press and pending state, while other actions are added, removed or reordered, and a button is never reused for another action. When the action holding focus leaves the row, or moves into the overflow menu, focus moves to the next button in the actions slot that is still there, else to the overflow menu's button, else to the previous button, so it never falls to the page. Focus is read through open shadow roots, so this holds for a row inside one.

Implementation: `src/components/action-row/action-row-action.ts`, `src/components/action-row/action-row-actions.tsx`, `src/utils/use-overflow-focus.ts`, `src/utils/focus-target.ts`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

## UIC-ACTION-ROW-2 - Row

### UIC-ACTION-ROW-2.1 - Lead and empty row

The row shall render `lead` in the `ui-action-row__lead` slot before the `ui-action-row__actions` slot that holds the buttons. `leadOverflow="scroll"` shall give the lead the remaining width and horizontal scrolling for intrinsic-width content, while menu-overflow actions keep their content width up to half the row. Focused lead controls scroll into view without moving the page; a control wider than the lead keeps its trailing end visible. Its default `truncate` keeps the ordinary lead layout. A lead that renders nothing (`null`, `undefined`, a boolean or an empty string) draws no slot, and a row with no actions and no such lead renders nothing.

Implementation: `src/components/action-row/action-row.tsx`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

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

`overflow` shall publish `data-overflow` on the root: `visible` (the default) keeps every action, and `menu` renders only the actions that fit in the actions slot, in their order from the start, as [`useOverflowItems`](OVERFLOW-LIST.md) measures them; actions compare by their identity (`id`), so a host that writes its actions inline is not measured afresh on each render. While actions are hidden, a `ui-action-row__overflow` element at the end of the slot holds an icon-only [Dropdown Menu](DROPDOWN-MENU.md) of the row's size, named by the provider's `moreItems` text with the count, listing each hidden action by its label and icon with its disabled and pending states (including a press still running, UIC-ACTION-ROW-1.5): choosing an action runs its `onPress`, and an action with `items` opens them as a submenu. A choice in that submenu, in its sections and nested submenus too, calls the item's own `onAction` and that action's `onAction` with the item's `id`, and never another action's: item ids need be unique only within one action's menu. Inside a toolbar the arrow keys reach the menu button.

Implementation: `src/components/action-row/action-row.tsx`, `src/components/action-row/action-row-actions.tsx`, `src/utils/use-overflow-items.ts`, `labs/reference/action-row.css`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

## UIC-ACTION-ROW-3 - Host composition

### UIC-ACTION-ROW-3.1 - Focus on unmount

When the host unmounts a row while it holds focus, focus shall move to `finalFocus` (a ref or a function returning an element). Native keyboard handlers passed by the host reach the row. Hosts compose selection counts, clear buttons and conditional visibility with Cluster, Button and status text, and may handle Escape while respecting defaultPrevented and input-method composition.
Implementation: `src/components/action-row/action-row.tsx`, `src/components/action-row/action-row-actions.tsx`, `labs/reference/action-row.css`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

## Hooks

| Hook                      | Kind      | Values                 | Description                                                               |
| ------------------------- | --------- | ---------------------- | ------------------------------------------------------------------------- |
| `ui-action-row`           | root      |                        | The row `<div>`.                                                          |
| `ui-action-row__lead`     | slot      |                        | The lead content, before the actions.                                     |
| `ui-action-row__actions`  | slot      |                        | The `<div>` holding the action buttons (`role="toolbar"` with `toolbar`). |
| `ui-action-row__overflow` | slot      |                        | The element holding the menu of hidden actions.                           |
| `ui-action-row__action`   | slot      |                        | One action button (also `ui-button`).                                     |
| `data-lead-overflow`      | attribute | `truncate`, `scroll`   | Lead content sizing and overflow.                                         |
| `data-size`               | attribute | `xs`, `sm`, `md`, `lg` | Size of the action buttons.                                               |
| `data-overflow`           | attribute | `visible`, `menu`      | What happens to actions that do not fit.                                  |
| `data-orientation`        | state     | `horizontal`           | The toolbar's orientation (React Aria).                                   |
