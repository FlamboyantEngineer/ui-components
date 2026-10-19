# Menu

The menu family lists actions or options a reader can choose: `Menu` (the list), `MenuItem`, `MenuSection`, `MenuSeparator`, `MenuPopover` (the floating surface), `MenuTrigger` (opens a menu from a button) and `SubmenuTrigger` (opens a nested menu from an item). It is built on React Aria's `Menu`, `MenuItem`, `MenuSection`, `Header`, `Separator`, `Popover`, `MenuTrigger` and `SubmenuTrigger`, which own the roles, focus and keyboard behaviour; every part, trigger included, is a library component, so callers import nothing from React Aria. A menu takes its entries as JSX children or as data. Long menus filter from a search field (React Aria `Autocomplete`), load more entries as they scroll (`onLoadMore`) and render only the rows in view (`virtualized`), following [COLLECTIONS.md](COLLECTIONS.md). [DROPDOWN-MENU.md](DROPDOWN-MENU.md) composes a button and a menu; [CONTEXT-MENU.md](CONTEXT-MENU.md) opens menus at the pointer or from a controller.

## UIC-MENU-1 - Menu

### UIC-MENU-1.1 - Entries as children or data

`Menu` shall render a `role="menu"` list from `MenuItem`, `MenuSection`, `MenuSeparator` and `SubmenuTrigger` children or, without children, from its `items` entries: item entries (`id`, `label` and the item options), section entries (`type: 'section'` with `title` and `items`) and separator entries (`type: 'separator'`). An item entry with `items` opens a submenu of those entries. Entries take the props of the component they describe.

Implementation: `src/components/menu/menu.tsx`, `src/components/menu/menu-item.tsx`
Verification: `src/components/menu/menu.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-1.2 - Size

`Menu` shall publish its row density in `data-size`: `sm`, `md` (the default) or `lg`. Submenus inherit the size of the menu that opens them, and item icons take the same size. The reference sheet uses rows at least 24, 28 and 32 pixels high.

Implementation: `src/components/menu/menu.tsx`, `src/components/menu/menu-item.tsx`, `labs/reference/menu.css`
Verification: `src/components/menu/menu.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-1.3 - Keyboard navigation

While a menu has focus, Arrow Down and Arrow Up shall move focus to the next and previous enabled item, wrapping at the ends and passing over disabled and pending items, section headings and separators; Home and End move to the first and last enabled item; typing characters moves focus to the next item whose label starts with them; Enter and Space activate the focused item; Escape closes the menu.

Implementation: `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-1.4 - Actions

Activating an enabled item shall call the item's `onAction` and the menu's `onAction` with the item's `id`, once, and then close the menu with every open submenu. A submenu's `Menu` without its own `onAction` reports to the `onAction` of the menu that opens it. `shouldCloseOnSelect={false}` on the item, its section or the menu keeps the menu open. An item's press handlers (`onPress` and the others of `PressEventProps`) receive the `PressEvent` as well. A disabled or pending item does nothing. An item with `href` is a link and navigates (through the provider's `navigate` when set).

Implementation: `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu.test.tsx`, `e2e/menu.spec.ts`

## UIC-MENU-2 - Items

### UIC-MENU-2.1 - Anatomy

`MenuItem` shall draw, in order: the selection check (`ui-menu-item__check`, only in a menu or section that allows selection), its `icon` (a built-in glyph name or any icon node) as a decorative `Icon` in `ui-menu-item__icon`, its label in `ui-menu-item__label`, which names the item, its `description` in `ui-menu-item__description`, its `shortcut` as a `Shortcut` in `ui-menu-item__shortcut` ([SHORTCUT.md](SHORTCUT.md)), and for a submenu trigger a chevron pointing in the reading direction in `ui-menu-item__submenu-indicator`. The item is named by its text: the label, then the description and the shortcut's readable words, each read once, so its accessible name holds all the text it shows.

Implementation: `src/components/menu/menu-item.tsx`, `labs/reference/menu.css`
Verification: `src/components/menu/menu-item.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-2.2 - Custom content

When `children` is a function, `MenuItem` shall draw what it returns instead of the default anatomy, passing it the item's `MenuItemRenderState`: `isHovered`, `isFocused`, `isFocusVisible`, `isPressed`, `isSelected`, `isDisabled`, the `selectionMode` it belongs to, `hasSubmenu` and `isOpen` (its submenu is open). `textValue` (by default the label text, or the entry's `label`) is used for type-to-select. An entry's `renderContent` is the same function.

Implementation: `src/components/menu/menu-item.tsx`
Verification: `src/components/menu/menu-item.test.tsx`

### UIC-MENU-2.3 - Tone and disabled items

`tone` (`neutral`, the default, or `danger`) shall be published in `data-tone`, so a destructive action can be marked; it changes no behaviour. `isDisabled` (or the menu's `disabledKeys`) shall keep the item visible with `aria-disabled="true"` and `data-disabled`, out of keyboard navigation and inert to pointer and keyboard.

Implementation: `src/components/menu/menu-item.tsx`, `labs/reference/menu.css`
Verification: `src/components/menu/menu-item.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-2.4 - Pending items

`isPending` shall draw an item as a placeholder for actions still loading: disabled, with `data-pending`, and a decorative busy indicator in `ui-menu-item__spinner` in place of its icon. Replacing the entries of an open menu replaces the placeholder in place, without closing the menu.

Implementation: `src/components/menu/menu-item.tsx`, `labs/reference/menu.css`
Verification: `src/components/menu/menu-item.test.tsx`

### UIC-MENU-2.5 - Interaction states

`MenuItem` shall publish its interaction states: `data-hovered` (pointer over the item), `data-focused`, `data-focus-visible` (keyboard focus) and `data-pressed`.

Implementation: `src/components/menu/menu-item.tsx`
Verification: `src/components/menu/menu-item.test.tsx`, `e2e/menu.spec.ts`

## UIC-MENU-3 - Sections, separators and selection

### UIC-MENU-3.1 - Sections

`MenuSection` shall group its items in a `role="group"` element; its `title` is drawn in `ui-menu-section__header` and names the group. Without a title, `aria-label` names it.

Implementation: `src/components/menu/menu-item.tsx`
Verification: `src/components/menu/menu-item.test.tsx`

### UIC-MENU-3.2 - Separators

`MenuSeparator` shall draw a `role="separator"` rule that takes no focus.

Implementation: `src/components/menu/menu-item.tsx`
Verification: `src/components/menu/menu-item.test.tsx`

### UIC-MENU-3.3 - Selection

`selectionMode` (`single` or `multiple`) on a `Menu` or a `MenuSection` shall make its items `menuitemradio` or `menuitemcheckbox` with `aria-checked`, publish `data-selection-mode` and, on selected items, `data-selected`, and draw the check glyph in the check slot of selected items. `selectedKeys` with `onSelectionChange` control the selection and `defaultSelectedKeys` sets it uncontrolled. A multiple-selection menu stays open when an item is chosen by pointer or Space and closes on Enter; `shouldCloseOnSelect` overrides both.

Implementation: `src/components/menu/menu-item.tsx`, `labs/reference/menu.css`
Verification: `src/components/menu/menu-item.test.tsx`, `e2e/menu.spec.ts`

## UIC-MENU-4 - Triggers, popovers and submenus

### UIC-MENU-4.1 - Menu trigger

`MenuTrigger` shall hold a trigger (a `Button`, an `IconButton` or another library pressable) and a `MenuPopover`, add no element of its own, and open the popover from the trigger: on press, Enter or Space, and on Arrow Down or Arrow Up, which focus the first or last item. An opening mouse press that stays within the trigger's original bounds until release shall not activate an overlapping menu item; dragging outside those bounds and releasing over an item shall still activate it. The trigger carries `aria-haspopup`, `aria-expanded` and, while open, `aria-controls` naming the menu, which the trigger labels. `isOpen` with `onOpenChange` controls the open state and `defaultOpen` sets it uncontrolled.

Implementation: `src/components/menu/menu.tsx`, `src/components/menu/menu-trigger-press.tsx`
Verification: `src/components/menu/menu.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-4.2 - Focus return

Closing a menu opened from a trigger, by an action, Escape or a press outside, shall return focus to the trigger.

Implementation: `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-4.3 - Popover

`MenuPopover` shall be a popover placed against its trigger, taking the overlay position props: `placement` (a `Placement`) defaults to `bottom start`, 4 pixels away (`offset`), shifted by `crossOffset`, flipping to the other side when it does not fit unless `shouldFlip` is false, and limiting its height to the room in the viewport less 8 pixels (`containerPadding`); the popover is the scroll container of a menu taller than that room. It publishes `data-placement`, `data-trigger` (`MenuTrigger`, `SubmenuTrigger`), `data-entering` and `data-exiting`, and closes on a press outside it.

Implementation: `src/components/menu/menu-popover.tsx`, `labs/reference/menu.css`
Verification: `src/components/menu/menu-popover.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-4.4 - Layers

`MenuPopover` shall sit on the overlay layer `layer` ([PORTAL.md](PORTAL.md)), `dropdown` by default, publish it in `data-layer` and take its z-index from `useLayerZIndex`, so a provider's `layerZIndex` applies and a menu stacks above `modal` content and below `tooltip` and `toast` content. A submenu popover takes the layer of the menu popover that opens it.

Implementation: `src/components/menu/menu-popover.tsx`
Verification: `src/components/menu/menu-popover.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-4.5 - Submenus

`SubmenuTrigger`, given a `MenuItem` and a `MenuPopover`, shall make the item a submenu trigger (`aria-haspopup="menu"`, `aria-expanded`, `data-has-submenu`, `data-open` while open) that opens its `MenuPopover` beside the item, overlapping the parent menu by 2 pixels: on hover after a short delay, on press, and on Arrow Right (Arrow Left in right-to-left text), which focuses the submenu's first item. In the submenu, Arrow Left (Arrow Right in right-to-left text) and Escape close only the submenu and return focus to its trigger item. Activating an item of a submenu closes the whole menu.

Implementation: `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu-popover.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-4.6 - Hooks and caller attributes

Every component of the family that draws an element shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes to its root element (the menu, item, section, separator or popover).

Implementation: `src/components/menu/menu.tsx`, `src/components/menu/menu-item.tsx`, `src/components/menu/menu-popover.tsx`
Verification: `src/components/menu/menu-item.test.tsx`

## UIC-MENU-5 - Long menus

### UIC-MENU-5.1 - Filterable menu

With `filterable`, the menu shall be led by a search field (`ui-menu__search`, its input `ui-menu__search-input`, named and hinted by the provider's `search` string), built on React Aria's `SearchField` and `Autocomplete`, which keeps only the items whose text contains the typed text, ignoring case and accents. Focus stays in the field: the first match is highlighted as the reader types (the field's `aria-activedescendant`), Arrow Down and Arrow Up move the highlight, Enter activates the highlighted item, and Escape clears the text, then closes the menu. A menu opened from a trigger focuses the field on open; a standalone menu leaves focus where it is. While nothing matches, the menu shows the provider's `noResults` string in `ui-menu__empty`, unless the caller's `renderEmptyState` says otherwise.

Implementation: `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-5.2 - Loading more

`onLoadMore` or `isLoading` shall end the menu, children or data, with a loading sentinel ([UIC-COLLECTIONS-1.2](COLLECTIONS.md#uic-collections-12---loading-more-inside-a-collection)), which calls `onLoadMore` when it scrolls into view while `isLoading` is false. While `isLoading`, it draws a row (`ui-menu__load-more`) holding a decorative busy indicator (`ui-menu__load-more-spinner`) and the provider's `loading` string; an empty menu then shows that row alone, without its empty state.

Implementation: `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-5.3 - Virtualized menu

With `virtualized`, a menu given as children or as data shall render through React Aria's `Virtualizer` with a list layout ([UIC-COLLECTIONS-1.1](COLLECTIONS.md#uic-collections-11---virtualized-rendering)) and publish `data-virtualized`, drawing only the rows in view of its scroll container (its `MenuPopover`, or the page), each `rowHeight` pixels high (by default 24, 28 or 32 at size `sm`, `md` or `lg`, [UIC-COLLECTIONS-1.4](COLLECTIONS.md#uic-collections-14---layout-options)), while keyboard navigation reaches every item and each row keeps its hooks, `aria-setsize` and `aria-posinset`. Filtering and loading more work the same in a virtualized menu.

Implementation: `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-5.4 - Highlighted matches

With `highlightMatches`, the menu shall mark the text typed in the enclosing search field (its own with `filterable`, or a [Command Palette](COMMAND-PALETTE.md)'s) in the labels of its data entries and their submenus, through [Text Match](TEXT-MATCH.md) ignoring case and accents, and in any `TextMatch` its children draw. Marks only split the label's text, so names, type-to-select and filtering are unchanged. Without it, labels stay plain text even inside a `TextMatchProvider`.

Implementation: `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu.test.tsx`, `e2e/menu.spec.ts`

## Hooks

| Hook                              | Kind      | Values                                                                        | Description                                                         |
| --------------------------------- | --------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `ui-menu`                         | root      |                                                                               | The `role="menu"` list.                                             |
| `data-size`                       | attribute | `sm`, `md`, `lg`                                                              | Row density.                                                        |
| `data-empty`                      | state     | `true`                                                                        | The menu has no items, or the search field no text (React Aria).    |
| `data-virtualized`                | state     | `true`                                                                        | Only the rows in view render.                                       |
| `ui-menu__search`                 | slot      |                                                                               | The search field of a filterable menu.                              |
| `ui-menu__search-input`           | slot      |                                                                               | Its text input (`role="searchbox"`).                                |
| `ui-menu__empty`                  | slot      |                                                                               | The no-match message of a filterable menu.                          |
| `ui-menu__load-more`              | slot      |                                                                               | The loading row at the end of the menu.                             |
| `ui-menu__load-more-spinner`      | slot      |                                                                               | The busy indicator of the loading row.                              |
| `data-collection`                 | state     |                                                                               | React Aria's collection marker, on the menu and its items.          |
| `ui-menu-item`                    | root      |                                                                               | One item (`menuitem`, `menuitemradio` or `menuitemcheckbox`).       |
| `ui-menu-item__check`             | slot      |                                                                               | Selection check, in selectable menus; holds the glyph when checked. |
| `ui-menu-item__icon`              | slot      |                                                                               | Leading icon (also `ui-icon`).                                      |
| `ui-menu-item__spinner`           | slot      |                                                                               | Busy indicator of a pending item.                                   |
| `ui-menu-item__label`             | slot      |                                                                               | The label.                                                          |
| `ui-menu-item__description`       | slot      |                                                                               | Secondary text.                                                     |
| `ui-menu-item__shortcut`          | slot      |                                                                               | Keyboard chord (also `ui-shortcut`).                                |
| `ui-menu-item__submenu-indicator` | slot      |                                                                               | Chevron of a submenu trigger (also `ui-glyph`).                     |
| `data-tone`                       | attribute | `neutral`, `danger`                                                           | Emphasis.                                                           |
| `data-key`                        | state     |                                                                               | The item's `id` (React Aria).                                       |
| `data-pending`                    | state     | `true`                                                                        | A placeholder for loading actions.                                  |
| `data-disabled`                   | state     | `true`                                                                        | Disabled (React Aria).                                              |
| `data-hovered`                    | state     | `true`                                                                        | Pointer over the item.                                              |
| `data-focused`                    | state     | `true`                                                                        | Focused.                                                            |
| `data-focus-visible`              | state     | `true`                                                                        | Keyboard focus.                                                     |
| `data-pressed`                    | state     | `true`                                                                        | Being pressed.                                                      |
| `data-selected`                   | state     | `true`                                                                        | Checked.                                                            |
| `data-selection-mode`             | state     | `single`, `multiple`                                                          | The selection the item belongs to.                                  |
| `data-has-submenu`                | state     | `true`                                                                        | Opens a submenu.                                                    |
| `data-open`                       | state     | `true`                                                                        | Its submenu is open.                                                |
| `ui-menu-section`                 | root      |                                                                               | A `role="group"` of items.                                          |
| `ui-menu-section__header`         | slot      |                                                                               | The section title.                                                  |
| `ui-menu-separator`               | root      |                                                                               | A `role="separator"` rule.                                          |
| `ui-menu-popover`                 | root      |                                                                               | The floating surface of a menu or submenu.                          |
| `data-layer`                      | attribute | `backdrop`, `drawer`, `modal`, `dropdown`, `context-menu`, `tooltip`, `toast` | Overlay layer; the z-index is set inline from it.                   |
| `data-placement`                  | state     | `top`, `bottom`, `left`, `right`, `center`                                    | Side of the anchor it opened on (React Aria).                       |
| `data-trigger`                    | state     | `MenuTrigger`, `SubmenuTrigger`                                               | What opened it (React Aria).                                        |
| `data-entering`                   | state     | `true`                                                                        | Entry animation (React Aria).                                       |
| `data-exiting`                    | state     | `true`                                                                        | Exit animation (React Aria).                                        |
