# Dropdown Menu

`DropdownMenu` is a button that opens a menu: a `Button` with a caret, or an `IconButton`, as the trigger of a React Aria `MenuTrigger`, and a `Menu` in a `MenuPopover` ([MENU.md](MENU.md)). React Aria wires the popup attributes, focus and keyboard behaviour, so hosts need not build their own menu buttons. With `onPress` it is a split button: a primary action beside a chevron that opens the menu.

## UIC-DROPDOWN-MENU-1 - Trigger

### UIC-DROPDOWN-MENU-1.1 - Button trigger

`DropdownMenu` shall draw a `Button` ([BUTTON.md](BUTTON.md)) whose label is `label`, with `icon` as its start icon and, unless `showCaret` is false, a `chevron-down` caret in the button's end icon slot carrying `ui-dropdown-menu__caret`. The button also carries `ui-dropdown-menu`, and takes `variant` (`secondary` by default), `size` (`md` by default) and `isDisabled`.

Implementation: `src/components/dropdown-menu/dropdown-menu.tsx`, `labs/reference/dropdown-menu.css`
Verification: `src/components/dropdown-menu/dropdown-menu.test.tsx`, `e2e/dropdown-menu.spec.ts`

### UIC-DROPDOWN-MENU-1.2 - Icon trigger

With `iconOnly`, `DropdownMenu` shall draw an `IconButton` ([ICON-BUTTON.md](ICON-BUTTON.md)) showing `icon` (`more` by default), named by `label`, which must then be text, with `variant` `ghost` by default and no caret.

Implementation: `src/components/dropdown-menu/dropdown-menu.tsx`
Verification: `src/components/dropdown-menu/dropdown-menu.test.tsx`, `e2e/dropdown-menu.spec.ts`

### UIC-DROPDOWN-MENU-1.3 - Popup wiring

The trigger shall carry React Aria's `aria-haspopup`, `aria-expanded` and, while open, `aria-controls` naming the menu, which the trigger labels unless `aria-label` or `aria-labelledby` names it. It publishes `data-open` while the menu is open, and opens it on press, Enter or Space and on Arrow Down or Arrow Up, which focus the first or last item. `isOpen` with `onOpenChange` controls the open state and `defaultOpen` sets it uncontrolled.

Implementation: `src/components/dropdown-menu/dropdown-menu.tsx`
Verification: `src/components/dropdown-menu/dropdown-menu.test.tsx`, `e2e/dropdown-menu.spec.ts`

### UIC-DROPDOWN-MENU-1.4 - Menu

The menu shall draw `children` or `items` like `Menu`, pass `onAction`, the selection props, `disabledKeys`, `shouldCloseOnSelect` and `filterable` ([UIC-MENU-5.1](MENU.md#uic-menu-51---filterable-menu)) to it, and open at `placement` (`bottom start` by default). Its size is `menuSize`, by default the trigger size (`sm` for an `xs` trigger).

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

### UIC-DROPDOWN-MENU-1.7 - Split button

With `onPress`, `DropdownMenu` shall draw a `role="group"` element (the root, publishing `data-split` and, while the menu is open, `data-open`) holding the action, a `Button` (`ui-dropdown-menu__action`) labelled by `label` with `icon` as its start icon that runs `onPress` and opens nothing, and the toggle, an `IconButton` (`ui-dropdown-menu__toggle`) showing the `chevron-down` glyph, named by the provider's `moreOptions` string, which is the menu's trigger ([UIC-DROPDOWN-MENU-1.3](#uic-dropdown-menu-13---popup-wiring)) and labels the menu unless `aria-label` or `aria-labelledby` names it. Both take `variant` (`secondary` by default), `size` and `isDisabled`. The caller's `className` and `data-*` attributes go on the group, its `id` and `ref` on the action; `iconOnly` and `showCaret` do not apply. Focus returns to the toggle when the menu closes.

Implementation: `src/components/dropdown-menu/dropdown-menu.tsx`, `src/core/common-strings.ts`, `labs/reference/dropdown-menu.css`
Verification: `src/components/dropdown-menu/dropdown-menu.test.tsx`, `e2e/dropdown-menu.spec.ts`

## Hooks

| Hook                       | Kind  | Values | Description                                                                |
| -------------------------- | ----- | ------ | -------------------------------------------------------------------------- |
| `ui-dropdown-menu`         | root  |        | The trigger, also `ui-button` or `ui-icon-button`; a split button's group. |
| `ui-dropdown-menu__caret`  | slot  |        | The caret glyph, inside the button's end icon (also `ui-glyph`).           |
| `ui-dropdown-menu__action` | slot  |        | A split button's action (also `ui-button`).                                |
| `ui-dropdown-menu__toggle` | slot  |        | A split button's chevron that opens the menu (also `ui-icon-button`).      |
| `data-open`                | state | `true` | The menu is open.                                                          |
| `data-split`               | state | `true` | The root is a split button's group.                                        |
