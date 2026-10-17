# Dropdown Menu

`DropdownMenu` is a button that opens a menu: a `Button` with a caret, or an `IconButton`, as the trigger of a React Aria `MenuTrigger`, and a `Menu` in a `MenuPopover` ([MENU.md](MENU.md)). React Aria wires the popup attributes, focus and keyboard behaviour, so hosts need not build their own menu buttons.

## UIC-DROPDOWN-MENU-1 - Trigger

### UIC-DROPDOWN-MENU-1.1 - Button trigger

`DropdownMenu` shall draw a `Button` ([BUTTON.md](BUTTON.md)) whose label is `label`, with `icon` as its start icon and, unless `showCaret` is false, a `chevron-down` caret in the button's end icon slot carrying `ui-dropdown-menu__caret`. The button also carries `ui-dropdown-menu`, and takes `variant` (`secondary` by default), `size` (`md` by default) and `isDisabled`.

Implementation: `src/components/dropdown-menu/dropdown-menu.tsx`, `labs/reference/dropdown-menu.css`
Verification: `src/components/dropdown-menu/dropdown-menu.test.tsx`, `e2e/dropdown-menu.spec.ts`

### UIC-DROPDOWN-MENU-1.2 - Icon trigger

With `iconOnly`, `DropdownMenu` shall draw an `IconButton` ([ICON-BUTTON.md](ICON-BUTTON.md)) showing `icon` (`more` by default), named by `label`, which must then be text, with `variant` `ghost` by default and no caret unless `showCaret` is set.

Implementation: `src/components/dropdown-menu/dropdown-menu.tsx`
Verification: `src/components/dropdown-menu/dropdown-menu.test.tsx`, `e2e/dropdown-menu.spec.ts`

### UIC-DROPDOWN-MENU-1.3 - Popup wiring

The trigger shall carry React Aria's `aria-haspopup`, `aria-expanded` and, while open, `aria-controls` naming the menu, which the trigger labels unless `aria-label` names it. It publishes `data-open` while the menu is open, and opens it on press, Enter or Space and on Arrow Down or Arrow Up, which focus the first or last item. `isOpen` with `onOpenChange` controls the open state and `defaultOpen` sets it uncontrolled.

Implementation: `src/components/dropdown-menu/dropdown-menu.tsx`
Verification: `src/components/dropdown-menu/dropdown-menu.test.tsx`, `e2e/dropdown-menu.spec.ts`

### UIC-DROPDOWN-MENU-1.4 - Menu

The menu shall draw `children` or `items` like `Menu`, pass `onAction`, the selection props, `disabledKeys` and `shouldCloseOnSelect` to it, and open at `placement` (`bottom start` by default). Its size is `menuSize`, by default the trigger size (`sm` for an `xs` trigger).

Implementation: `src/components/dropdown-menu/dropdown-menu.tsx`
Verification: `src/components/dropdown-menu/dropdown-menu.test.tsx`, `e2e/dropdown-menu.spec.ts`

### UIC-DROPDOWN-MENU-1.5 - Focus return

Closing the menu by an action, Escape or a press outside shall return focus to the trigger.

Implementation: `src/components/dropdown-menu/dropdown-menu.tsx`
Verification: `src/components/dropdown-menu/dropdown-menu.test.tsx`, `e2e/dropdown-menu.spec.ts`

### UIC-DROPDOWN-MENU-1.6 - Hooks and caller attributes

The trigger shall carry the hooks below besides its button hooks, append the caller's `className`, and take `id`, `ref` and caller `data-*` attributes.

Implementation: `src/components/dropdown-menu/dropdown-menu.tsx`
Verification: `src/components/dropdown-menu/dropdown-menu.test.tsx`

## Hooks

| Hook                      | Kind  | Values | Description                                                      |
| ------------------------- | ----- | ------ | ---------------------------------------------------------------- |
| `ui-dropdown-menu`        | root  |        | The trigger, also `ui-button` or `ui-icon-button`.               |
| `ui-dropdown-menu__caret` | slot  |        | The caret glyph, inside the button's end icon (also `ui-glyph`). |
| `data-open`               | state | `true` | The menu is open.                                                |
