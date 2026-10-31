# Menubar

`Menubar` is a persistent row (or column) of top-level items that each open a menu, like an application's File, Edit and View menus, following the WAI-ARIA menubar pattern. `MenubarMenu` is one top-level item and its menu. React Aria has no menubar, so the bar is built from React Aria's `MenuTrigger` and `Button` with the library [Menu](MENU.md) family (`Menu`, `MenuPopover`, `SubmenuTrigger`), which own each menu's roles, focus, keyboard, submenus and focus restoration; the bar adds the keys and pointer moves that pass from one menu to another, and keeps one tab stop. A site navigation menu of links is a different pattern and out of scope.

## UIC-MENUBAR-1 - Bar

### UIC-MENUBAR-1.1 - Structure

`Menubar` shall render a `role="menubar"` element with `aria-orientation`, named by the caller's `aria-label` or `aria-labelledby`. Each `MenubarMenu` inside it draws one top-level item: a `<button>` with `role="menuitem"` (a React Aria `Button`) showing `label`, with `aria-haspopup`, `aria-expanded` and, while its menu is open, `aria-controls` naming the menu, which the item labels. A `MenubarMenu` outside a `Menubar` throws.

Implementation: `src/components/menubar/menubar.tsx`, `src/components/menubar/menubar-state.ts`
Verification: `src/components/menubar/menubar.test.tsx`, `e2e/menubar.spec.ts`

### UIC-MENUBAR-1.2 - Orientation and size

`orientation` (`horizontal`, the default, or `vertical`) shall be published in `data-orientation` and decide which arrow keys move along the bar; menus open below their item at `bottom start` in a row and beside it at `end top` in a column. `size` (`xs`, `sm`, `md`, the default, or `lg`) shall be published in `data-size` and set the row density of every menu (`sm` for an `xs` bar, as for dropdown menu triggers; [UIC-MENU-1.2](MENU.md#uic-menu-12---size)).

Implementation: `src/components/menubar/menubar.tsx`, `labs/reference/menubar.css`
Verification: `src/components/menubar/menubar.test.tsx`, `e2e/menubar.spec.ts`

### UIC-MENUBAR-1.3 - One tab stop

The bar shall be one stop in the tab sequence (roving `tabindex`): the first top-level item until another takes focus, then the item focused last, and the first again if that one is removed. Tab and Shift+Tab leave the bar.

Implementation: `src/components/menubar/menubar.tsx`, `src/components/menubar/menubar-state.ts`
Verification: `src/components/menubar/menubar.test.tsx`, `e2e/menubar.spec.ts`

### UIC-MENUBAR-1.4 - Moving along the bar

With focus on a top-level item and no modifier held, Arrow Right and Arrow Left (Arrow Down and Arrow Up in a column) shall move focus to the next and previous item, wrapping at the ends, and Home and End to the first and last. In right-to-left text Arrow Left is next in a row. When a menu is open, the newly focused item's menu opens in its place.

Implementation: `src/components/menubar/menubar-state.ts`, `src/components/menubar/menubar-keys.ts`
Verification: `src/components/menubar/menubar.test.tsx`, `src/components/menubar/menubar-keys.test.ts`, `e2e/menubar.spec.ts`

### UIC-MENUBAR-1.5 - Hooks and caller attributes

`Menubar` shall carry the root hooks below and `MenubarMenu` the item hooks, each appending the caller's `className` and forwarding caller `data-*` attributes and `id` to its element; `Menubar` forwards the other attributes of a `div` and its `ref`, which stays attached across renders (a callback ref is not detached and attached again on each commit), and its own hook values win over caller attributes of the same name.

Implementation: `src/components/menubar/menubar.tsx`
Verification: `src/components/menubar/menubar.test.tsx`

## UIC-MENUBAR-2 - Menus

### UIC-MENUBAR-2.1 - Opening from the keyboard

On a top-level item in a row, Arrow Down, Enter and Space shall open its menu with focus on the first item and Arrow Up with focus on the last (React Aria `MenuTrigger`). In a column, the forward arrow (Arrow Right, or Arrow Left in right-to-left text), Enter and Space open it on the first item.

Implementation: `src/components/menubar/menubar.tsx`, `src/components/menubar/menubar-keys.ts`
Verification: `src/components/menubar/menubar.test.tsx`, `src/components/menubar/menubar-keys.test.ts`, `e2e/menubar.spec.ts`

### UIC-MENUBAR-2.2 - Moving between open menus

In a row, Arrow Right (Arrow Left in right-to-left text) pressed in an open menu or one of its submenus, on an item that opens no submenu, shall close the open menus, move focus to the next top-level item and open its menu on its first item, wrapping at the end; Arrow Left pressed in a top-level menu does the same towards the previous item. When focusing that item scrolls a box around the bar to reveal it, its menu opens on the next frame, after the scroll, so the scroll does not close it. On an item that opens a submenu, Arrow Right opens the submenu, and in a submenu Arrow Left closes only that submenu ([UIC-MENU-4.5](MENU.md#uic-menu-45---submenus)). In a column, the backward arrow pressed in a top-level menu closes it and returns focus to its item.

Implementation: `src/components/menubar/menubar-state.ts`, `src/components/menubar/menubar-keys.ts`
Verification: `src/components/menubar/menubar.test.tsx`, `src/components/menubar/menubar-keys.test.ts`, `e2e/menubar.spec.ts`

### UIC-MENUBAR-2.3 - Closing and focus

At most one menu shall be open. Escape closes the innermost open menu, returning focus to its item; running an action closes the menu and returns focus to its top-level item; a press outside the bar and its menus, or a second press on the open menu's item, closes it. Tab pressed in an open menu closes it and moves focus out of the bar.

Implementation: `src/components/menubar/menubar.tsx`, `src/components/menubar/menubar-state.ts`
Verification: `src/components/menubar/menubar.test.tsx`, `e2e/menubar.spec.ts`

### UIC-MENUBAR-2.4 - Pointer

A press on a top-level item shall open its menu. While a menu is open, the pointer entering another top-level item shall move focus to that item and open its menu instead, with focus on the menu itself, so the reader can sweep across the bar.

Implementation: `src/components/menubar/menubar.tsx`, `src/components/menubar/menubar-state.ts`
Verification: `src/components/menubar/menubar.test.tsx`, `e2e/menubar.spec.ts`

### UIC-MENUBAR-2.5 - Menu content

`MenubarMenu` shall draw its `items` or `children` as a `Menu` in a `MenuPopover` on the `dropdown` layer, so a menu takes the menu family's items, icons, descriptions, shortcuts, sections, separators, disabled items, selectable sections (`menuitemcheckbox` and `menuitemradio`) and submenus, with their hooks; `onAction` reports the chosen item's `id`, as for a menu. The popover leaves the page visible to assistive technology and reachable, so the bar stays usable while a menu is open.

Implementation: `src/components/menubar/menubar.tsx`
Verification: `src/components/menubar/menubar.test.tsx`, `e2e/menubar.spec.ts`

### UIC-MENUBAR-2.6 - Menus that leave

When a `MenubarMenu` leaves the bar, the bar shall forget it as the open menu and as the destination of a move between menus, without remounting the other items: its menu and submenus close with it, and the remaining items open by press, hover, keyboard and the arrow keys as before, as do menus added later, also after every menu has left. Focus the open menu held then moves to the bar's tab stop (its first item); focus elsewhere stays.

Implementation: `src/components/menubar/menubar-state.ts`
Verification: `src/components/menubar/menubar-removal.test.tsx`, `e2e/menubar.spec.ts`

## Hooks

| Hook                  | Kind      | Values                   | Description                                                               |
| --------------------- | --------- | ------------------------ | ------------------------------------------------------------------------- |
| `ui-menubar`          | root      |                          | The `role="menubar"` element.                                             |
| `ui-menubar__trigger` | slot      |                          | A top-level item: the `<button role="menuitem">` of a `MenubarMenu`.      |
| `data-orientation`    | attribute | `horizontal`, `vertical` | How the top-level items are laid out.                                     |
| `data-size`           | attribute | `xs`, `sm`, `md`, `lg`   | Row density of the bar; `xs` menus use `sm`.                              |
| `data-open`           | state     | `true`                   | On a top-level item while its menu is open.                               |
| `data-hovered`        | state     | `true`                   | On a top-level item while the pointer is over it (React Aria).            |
| `data-pressed`        | state     | `true`                   | On a top-level item while pressed or while its menu is open (React Aria). |
| `data-focused`        | state     | `true`                   | On a top-level item while focused (React Aria).                           |
| `data-focus-visible`  | state     | `true`                   | On a top-level item while keyboard focused (React Aria).                  |
