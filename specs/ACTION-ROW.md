# Action Row

`ActionRow` draws a row of actions described as data, each as an [Icon Button](ICON-BUTTON.md) with a tooltip. Standard verbs carry a fixed glyph, label and place; custom actions name their own icon and label. Any action can open a [Menu](MENU.md) of typed items. Optional lead content (a title, a filter, a status line) sits before the actions.

## UIC-ACTION-ROW-1 - Actions

### UIC-ACTION-ROW-1.1 - Standard verbs

An action whose `verb` is a standard verb shall draw that verb's glyph and be named by its provider string, as `actionVerbs` lists: `add` (`plus`, `add`), `refresh` (`refresh`, `refresh`), `more` (`more`, `more`), `edit` (`edit`, `edit`), `delete` (`delete`, `delete`), `save` (`save`, `save`), `cancel` (`close`, `cancel`) and `close` (`close`, `close`). An action's `label` replaces the verb's label, for example to name its subject ("Add comment"), and keeps the glyph and place. A verb outside the list is a type error.

Implementation: `src/components/action-row/action-row.tsx`, `src/core/glyphs.tsx`, `src/core/strings.ts`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

### UIC-ACTION-ROW-1.2 - Custom actions

An action with `verb: 'custom'` shall draw its `icon` (a built-in glyph name or icon node) and be named by its required `label`. Its optional `isSelected` makes it a toggle: `aria-pressed` reports `true` or `false` and `data-selected` marks the pressed state. Its `ref` reaches the button, so a caller can return focus to it.

Implementation: `src/components/action-row/action-row.tsx`
Verification: `src/components/action-row/action-row.test.tsx`

### UIC-ACTION-ROW-1.3 - Order

The row shall draw custom actions first, in the order given, then the standard verbs in the fixed order `add`, `refresh`, `more`, `edit`, `delete`, `save`, `cancel`, `close`; actions of the same verb keep their given order. `orderActions` exposes the same order.

Implementation: `src/components/action-row/action-row.tsx`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

### UIC-ACTION-ROW-1.4 - Tooltips

Each action shall show a React Aria tooltip (`ui-action-row__tooltip`) with its `tooltip`, or its label when it has none, on hover and on keyboard focus. The open tooltip describes the button; the accessible name stays the label.

Implementation: `src/components/action-row/action-row.tsx`
Verification: `src/components/action-row/action-row.test.tsx`, `e2e/action-row.spec.ts`

### UIC-ACTION-ROW-1.5 - Action states and attributes

`isDisabled` shall disable an action natively, except that a disabled action with its own `tooltip` stays focusable (`aria-disabled="true"`) so the tooltip explaining it can be read. `isPending` shows Icon Button's busy indicator and refuses presses; a pending `save` names its indicator with the provider's `saving` string. `isExpanded` publishes `aria-expanded`; `aria-controls`, `aria-haspopup` and `id` pass through, and the action's `data-*` attributes are forwarded to its button, which also publishes its verb in `data-verb`. `onPress` runs on activation.

Implementation: `src/components/action-row/action-row.tsx`
Verification: `src/components/action-row/action-row.test.tsx`

### UIC-ACTION-ROW-1.6 - Menu actions

An action with non-empty `items` shall open a [Menu](MENU.md) of those entries (items with their `icon`, `description`, `shortcut`, `tone`, `isDisabled` and submenus, sections and separators, as `Menu` takes them as data) in a `MenuPopover` at the button's bottom end, from its button: on press, Enter or Space, and on Arrow Down or Arrow Up, which focus the first or last item. The menu is labelled by the button and takes the row's size (`sm` for `xs`). The button keeps its tooltip and states, carries React Aria's `aria-haspopup`, `aria-expanded` and, while open, `aria-controls`, which replace the action's own `isExpanded` and `aria-haspopup`, and never calls the action's `onPress`. Choosing an item calls the item's `onAction` and the action's `onAction` with the item's `id`, closes the menu and returns focus to the button. A disabled or pending action does not open its menu. Without items the action is a plain button. This is the `more` verb's menu.

Implementation: `src/components/action-row/action-row.tsx`, `src/components/menu/menu.tsx`
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

## Hooks

| Hook                     | Kind      | Values                                                                          | Description                                |
| ------------------------ | --------- | ------------------------------------------------------------------------------- | ------------------------------------------ |
| `ui-action-row`          | root      |                                                                                 | The row `<div>`.                           |
| `ui-action-row__lead`    | slot      |                                                                                 | The lead content, before the actions.      |
| `ui-action-row__actions` | slot      |                                                                                 | The `<div>` holding the action buttons.    |
| `ui-action-row__action`  | slot      |                                                                                 | One action button (also `ui-icon-button`). |
| `ui-action-row__tooltip` | slot      |                                                                                 | An action's tooltip.                       |
| `data-size`              | attribute | `xs`, `sm`, `md`, `lg`                                                          | Size of the action buttons.                |
| `data-verb`              | attribute | `custom`, `add`, `refresh`, `more`, `edit`, `delete`, `save`, `cancel`, `close` | The action's verb.                         |
| `data-placement`         | state     | `top`, `bottom`, `left`, `right`, `center`                                      | Where the tooltip sits (React Aria).       |
| `data-entering`          | state     | `true`                                                                          | The tooltip is animating in (React Aria).  |
| `data-exiting`           | state     | `true`                                                                          | The tooltip is animating out (React Aria). |
