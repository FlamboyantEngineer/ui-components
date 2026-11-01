# Transition Menu

`TransitionMenu` shows a record's current state as a [Badge](BADGE.md) that opens a menu of the states it may move to. Each allowed transition shows its target state's tone, a description or the reason it is not available now; choosing one runs it, or first opens a [Modal](MODAL.md) that asks for confirmation or a required comment. It builds on the [Menu](MENU.md) family (`MenuTrigger`, `MenuPopover`, `Menu`), [Button](BUTTON.md), [Status Light](STATUS-LIGHT.md) and [Text Field](TEXT-FIELD.md). The caller owns the states, the transitions allowed from the current one, and runs them.

## UIC-TRANSITION-MENU-1 - States and transitions

### UIC-TRANSITION-MENU-1.1 - Current state

`TransitionMenu` shall render a `<span>` root (`ui-transition-menu`) showing the state of `states` whose `id` is `value` as a [Badge](BADGE.md) (`ui-transition-menu__badge`) with the state's `label` and `tone` (`neutral` by default); a `value` that no state names shows as itself. With no `transitions`, the badge stands alone and the root publishes `data-readonly`.

Implementation: `src/components/transition-menu/transition-menu.tsx`
Verification: `src/components/transition-menu/transition-menu.test.tsx`, `e2e/transition-menu.spec.ts`

### UIC-TRANSITION-MENU-1.2 - Menu of transitions

With `transitions`, the badge shall sit in a `bare` [Button](BUTTON.md) (`ui-transition-menu__trigger`) ending with a `chevron-down` glyph, which opens a menu below its start listing one item (`ui-transition-menu__transition`, also `ui-menu-item`) per transition, in order: its `label`, else the target state's label, after a small [Status Light](STATUS-LIGHT.md) in the target state's tone, which the item also publishes in `data-target-tone`, with its `description` under the label.

Implementation: `src/components/transition-menu/transition-menu.tsx`
Verification: `src/components/transition-menu/transition-menu.test.tsx`, `e2e/transition-menu.spec.ts`

### UIC-TRANSITION-MENU-1.3 - Unavailable transitions

A transition with a `disabledReason` shall be an unavailable item showing the reason under its label instead of its description. It stays reachable by keyboard and is announced as unavailable, with `aria-disabled="true"`, `data-disabled` and the reason in its accessible name (`focusableWhenDisabled`, [UIC-MENU-2.6](MENU.md#uic-menu-26---focusable-disabled-items)). It cannot be chosen: a press, Enter or Space calls nothing, opens no dialog and leaves the menu open.

Implementation: `src/components/transition-menu/transition-menu.tsx`
Verification: `src/components/transition-menu/transition-menu.test.tsx`, `e2e/transition-menu.spec.ts`

### UIC-TRANSITION-MENU-1.4 - Running a transition

Choosing a transition without `confirmMessage` or `requiresComment` shall call `onTransition` with `{ transition, to }` (the transition's `id` and its target). While a returned promise is pending the trigger is pending and the root publishes `data-pending`; a rejection only ends it, since the caller reports the failure and keeps `value`.

Implementation: `src/components/transition-menu/transition-menu.tsx`
Verification: `src/components/transition-menu/transition-menu.test.tsx`, `e2e/transition-menu.spec.ts`

### UIC-TRANSITION-MENU-1.5 - Confirmation and comments

Choosing a transition with `confirmMessage` or `requiresComment` shall open a [Modal](MODAL.md) titled by the provider's `transitionTo` string for the target state, described by `confirmMessage`, whose primary action reads the transition's `label`, else that same title. With `requiresComment`, the body holds a required multiline [Text Field](TEXT-FIELD.md) (`ui-transition-menu__comment`) named by the provider's `comment` string, which takes focus, and the action stays disabled while the comment is blank. The action calls `onTransition` with `{ transition, to, comment }` (the trimmed comment, only when required) and closes the dialog once a returned promise settles, keeping it open with the failure if it rejects; Cancel closes it without a call.

Implementation: `src/components/transition-menu/transition-menu.tsx`, `src/components/transition-menu/transition-dialog.tsx`, `src/core/strings/view.ts`
Verification: `src/components/transition-menu/transition-menu.test.tsx`, `e2e/transition-menu.spec.ts`

### UIC-TRANSITION-MENU-1.6 - Disabled

With `isDisabled`, the trigger shall be disabled and the root publish `data-disabled`. A menu open when the menu turns disabled, or while a transition runs, closes and stays closed once enabled again; its transitions run nothing meanwhile.

Implementation: `src/components/transition-menu/transition-menu.tsx`
Verification: `src/components/transition-menu/transition-menu.test.tsx`, `src/components/transition-menu/transition-menu-locking.test.tsx`

### UIC-TRANSITION-MENU-1.7 - Hooks and caller attributes

`TransitionMenu` shall carry the hooks below, append the caller's `className`, and forward `id` and caller `data-*` attributes to its root.

Implementation: `src/components/transition-menu/transition-menu.tsx`
Verification: `src/components/transition-menu/transition-menu.test.tsx`

### UIC-TRANSITION-MENU-1.8 - Revoked transitions

Every entry point shall check the transition as it stands when it runs: choosing a menu item runs nothing while the menu is disabled or pending, or the transition is gone or unavailable. An open dialog holds the reader's consent to one operation: the transition from the state it was opened in, to the same target, with the same comment requirement and confirmation message (a non-text message by being one). When `isDisabled` turns on, the transition is removed or becomes unavailable, the current state changes, or the operation changes, the dialog closes without running anything and does not reopen if the transition comes back. While the operation stands, confirming calls the current `onTransition`.

Implementation: `src/components/transition-menu/transition-menu.tsx`
Verification: `src/components/transition-menu/transition-menu.test.tsx`

## UIC-TRANSITION-MENU-2 - Accessibility

### UIC-TRANSITION-MENU-2.1 - Names and keyboard

The trigger shall be named by the provider's `stateTrigger` string from `label` (the provider's `status` string by default) and the current state, so its name holds the visible state, and report the menu in `aria-haspopup` and `aria-expanded`; the menu is named by the same label. Enter, Space or ArrowDown open the menu with focus on its first item, arrow keys, Home and End move between items, reaching unavailable ones so their reason can be read, Enter chooses an available one and Escape closes it, returning focus to the trigger (React Aria). A dialog takes focus when it opens and returns it when it closes.

Implementation: `src/components/transition-menu/transition-menu.tsx`, `src/core/strings/view.ts`
Verification: `src/components/transition-menu/transition-menu.test.tsx`, `e2e/transition-menu.spec.ts`

## Hooks

| Hook                             | Kind  | Values                                            | Description                                                        |
| -------------------------------- | ----- | ------------------------------------------------- | ------------------------------------------------------------------ |
| `ui-transition-menu`             | root  |                                                   | The transition menu (`<span>`).                                    |
| `ui-transition-menu__trigger`    | slot  |                                                   | The button that opens the menu (also `ui-button`).                 |
| `ui-transition-menu__badge`      | slot  |                                                   | The current state (also `ui-badge`).                               |
| `ui-transition-menu__transition` | slot  |                                                   | One transition's menu item (also `ui-menu-item`).                  |
| `ui-transition-menu__comment`    | slot  |                                                   | The comment field of a transition's dialog (also `ui-text-field`). |
| `data-target-tone`               | state | `neutral`, `info`, `success`, `warning`, `danger` | On a transition: its target state's tone.                          |
| `data-pending`                   | state | `true`                                            | A transition runs.                                                 |
| `data-disabled`                  | state | `true`                                            | Every transition is refused.                                       |
| `data-readonly`                  | state | `true`                                            | No transition is allowed: the state only shows.                    |
