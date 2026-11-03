# Menu

The menu family lists actions or options a reader can choose: `Menu` (the list), `MenuItem`, `MenuSection`, `MenuSeparator`, `MenuPopover` (the floating surface), `MenuTrigger` (opens a menu from a button) and `SubmenuTrigger` (opens a nested menu from an item). It is built on React Aria's `Menu`, `MenuItem`, `MenuSection`, `Header`, `Separator`, `Popover`, `MenuTrigger` and `SubmenuTrigger`, which own the roles, focus and keyboard behaviour; every part, trigger included, is a library component, so callers import nothing from React Aria. A menu takes its entries as JSX children or as data. Long menus filter from a search field (React Aria `Autocomplete`), load more entries as they scroll (`onLoadMore`) and render only the rows in view (`virtualized`), following [COLLECTIONS.md](COLLECTIONS.md). [DROPDOWN-MENU.md](DROPDOWN-MENU.md) composes a button and a menu; [CONTEXT-MENU.md](CONTEXT-MENU.md) opens menus at the pointer or from a controller.

## UIC-MENU-1 - Menu

### UIC-MENU-1.1 - Entries as children or data

`Menu` shall render a `role="menu"` list from `MenuItem`, `MenuSection`, `MenuSeparator` and `SubmenuTrigger` children or, without children, from its `items` entries: item entries (`id`, `label` and the item options), section entries (`type: 'section'` with `title` and `items`) and separator entries (`type: 'separator'`). An item entry with `items` opens a submenu of those entries. Entries take the props of the component they describe.

Numeric and text IDs (`1` and `'1'`) and text IDs differing only by whitespace identify distinct items and retain separate accessibility references. Root and section selections, disabled keys and actions keep the caller's original ID types, including actions inherited by submenus. A `MenuItem` or `MenuSection` rendered through a host component that forwards its props keeps its `id` ([UIC-COMPOSITION-4.2](COMPOSITION.md#uic-composition-42---collection-items-behind-a-host-component)).

Implementation: `src/components/menu/menu.tsx`, `src/components/menu/menu-item.tsx`
Verification: `src/components/menu/menu.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-1.2 - Size

`Menu` shall publish its row density in `data-size`: `sm`, `md` (the default) or `lg`. Submenus inherit the size of the menu that opens them, and item icons take the same size. The reference sheet uses rows at least 24, 28 and 32 pixels high.

Implementation: `src/components/menu/menu.tsx`, `src/components/menu/menu-item.tsx`, `labs/reference/menu.css`
Verification: `src/components/menu/menu.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-1.3 - Keyboard navigation

While a menu has focus, Arrow Down and Arrow Up shall move focus to the next and previous enabled item, wrapping at the ends and passing over disabled and pending items, section headings and separators; a disabled item with `focusableWhenDisabled` counts as enabled here ([UIC-MENU-2.6](#uic-menu-26---focusable-disabled-items)); Home and End move to the first and last enabled item; typing characters moves focus to the next item whose label starts with them; Enter and Space activate the focused item; Escape closes the menu.

Implementation: `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu.test.tsx`, `src/components/menu/menu-item.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-1.4 - Actions

Activating an enabled item shall call the item's `onAction` and the menu's `onAction` with the item's `id`, once, and then close the menu with every open submenu. A submenu's `Menu` without its own `onAction` reports to the `onAction` of the menu that opens it. `shouldCloseOnSelect={false}` on the item, its section or the menu keeps the menu open. An item's press handlers (`onPress` and the others of `PressEventProps`) receive the `PressEvent` as well. A disabled or pending item does nothing. An item with `href` is a link and navigates (through the provider's `navigate` when set).

Implementation: `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu.test.tsx`, `e2e/menu.spec.ts`

## UIC-MENU-2 - Items

### UIC-MENU-2.1 - Anatomy

`MenuItem` shall draw, in order: the selection check (`ui-menu-item__check`, only in a menu or section that allows selection, or on a check item, [UIC-MENU-2.7](#uic-menu-27---check-items)), its `icon` (an imported icon component or rendered element) as a decorative `Icon` in `ui-menu-item__icon`, its label in `ui-menu-item__label`, which names the item, its `description` in `ui-menu-item__description`, its `shortcut` as a `Shortcut` in `ui-menu-item__shortcut` ([SHORTCUT.md](SHORTCUT.md)), its `trailing` content in `ui-menu-item__trailing` ([UIC-MENU-2.8](#uic-menu-28---trailing-content)), and for a submenu trigger a chevron pointing in the reading direction in `ui-menu-item__submenu-indicator`. The item is named by its text: the label, then the description, the shortcut's readable words and the trailing content's text, each read once, so its accessible name holds all the text it shows. A `description` that renders nothing (`null`, `undefined`, a boolean or an empty string) draws no description slot; `0` draws one and joins the name.

Implementation: `src/components/menu/menu-item.tsx`, `src/components/menu/menu.tsx`, `labs/reference/menu.css`
Verification: `src/components/menu/menu-item.test.tsx`, `src/components/menu/menu.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-2.2 - Custom content

When `children` is a function, `MenuItem` shall draw what it returns instead of the default anatomy, passing it the item's `MenuItemRenderState`: `isHovered`, `isFocused`, `isFocusVisible`, `isPressed`, `isSelected`, `isDisabled`, the `selectionMode` it belongs to, `hasSubmenu` and `isOpen` (its submenu is open). `textValue` (by default the label text, or the entry's `label`) is used for type-to-select. An entry's `renderContent` is the same function.

Implementation: `src/components/menu/menu-item.tsx`
Verification: `src/components/menu/menu-item.test.tsx`

### UIC-MENU-2.3 - Tone and disabled items

`tone` (`neutral`, the default, or `danger`) shall be published in `data-tone`, so a destructive action can be marked; it changes no behaviour. `isDisabled` (or the menu's `disabledKeys`) shall keep the item visible with `aria-disabled="true"` and `data-disabled`, out of keyboard navigation and inert to pointer and keyboard. `focusableWhenDisabled` keeps it in keyboard navigation instead ([UIC-MENU-2.6](#uic-menu-26---focusable-disabled-items)).

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

### UIC-MENU-2.6 - Focusable disabled items

With `isDisabled` and `focusableWhenDisabled`, `MenuItem` shall stay in keyboard navigation (arrow keys, Home, End, type-to-select and hover reach it) so a reader can find it and read why it is unavailable, as the WAI-ARIA Authoring Practices allow for disabled menu items. It carries `aria-disabled="true"` and `data-disabled`, its `description` (for example the reason it is unavailable) stays part of its accessible name, and custom content receives `isDisabled: true`. It refuses activation: a press, Enter or Space, including Enter in a filterable menu's search field while it is highlighted, calls no `onAction` or press handler, changes no selection, follows no `href` and leaves the menu open. It does not apply to an item disabled through the menu's `disabledKeys`, to a pending item, or to the item of a `SubmenuTrigger`, which stays out of reach because hovering or the arrow key would still open its submenu.

Implementation: `src/components/menu/menu-item.tsx`, `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu-item.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-2.7 - Check items

With `isSelected` (true or false), in a menu or section without `selectionMode`, `MenuItem` shall be a check item of its own among plain items, such as a "Wrap lines" toggle: a `menuitemcheckbox` with `aria-checked`, publishing `data-selected` while checked, its check slot drawing the check glyph while checked. Activating it calls `onAction` like any item, for the caller to flip `isSelected`, and closes the menu unless `shouldCloseOnSelect={false}` keeps it open. Custom content receives its state as `isSelected`. With `isDisabled` and `focusableWhenDisabled` it stays reachable and refuses activation ([UIC-MENU-2.6](#uic-menu-26---focusable-disabled-items)). A check item is not a link. In a menu or section with `selectionMode`, the selection owns the item's check and `isSelected` does nothing.

Implementation: `src/components/menu/menu-item.tsx`
Verification: `src/components/menu/menu-item.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-2.8 - Trailing content

`MenuItem` and an item entry shall take `trailing`, non-interactive content such as a count `Badge`, drawn in `ui-menu-item__trailing` after the shortcut and before the submenu chevron, so it holds the row's trailing edge (the left edge in a right-to-left locale) vertically centred on the label, however short, long or wrapped the label is and however narrow the menu. Only when the label's longest word, the shortcut and the trailing content cannot share one line does the trailing content move below them, still at the trailing edge. Its text, including a visually hidden count label such as a `Badge`'s `aria-label`, joins the item's accessible name after the shortcut. It does not change `textValue`, so type-to-select still matches the label. Trailing content that renders nothing (`null`, `undefined`, a boolean or an empty string) draws no slot; `0` draws one. It is kept on a disabled, focusable disabled or pending item. Buttons, links and other controls are not supported in it, since the whole row is one menu item. Custom content ([UIC-MENU-2.2](#uic-menu-22---custom-content)) replaces it with the rest of the default anatomy.

Implementation: `src/components/menu/menu-item.tsx`, `src/components/menu/menu.tsx`, `labs/reference/menu.css`
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

`selectionMode` (`single` or `multiple`) on a `Menu` or a `MenuSection` shall make its items `menuitemradio` or `menuitemcheckbox` with `aria-checked`, publish `data-selection-mode` and, on selected items, `data-selected`, and draw the check glyph in the check slot of selected items. `selectedKeys` with `onSelectionChange` control the selection and `defaultSelectedKeys` sets it uncontrolled. An uncontrolled selection is held by `Menu` itself, so it survives turning `filterable`, `highlightMatches` or `virtualized` on or off, and changing the menu's label; turning `highlightMatches` on or off or changing the label also keeps the list, its focus and an open submenu mounted. A multiple-selection menu stays open when an item is chosen by pointer or Space and closes on Enter; `shouldCloseOnSelect` overrides both.

Implementation: `src/components/menu/menu-item.tsx`, `labs/reference/menu.css`
Verification: `src/components/menu/menu-item.test.tsx`, `e2e/menu.spec.ts`

## UIC-MENU-4 - Triggers, popovers and submenus

### UIC-MENU-4.1 - Menu trigger

`MenuTrigger` shall hold a trigger (a `Button` or another library pressable) and a `MenuPopover`, add no element of its own, and open the popover from the trigger: on press, Enter or Space, and on Arrow Down or Arrow Up, which focus the first or last item. An opening mouse press that stays within the trigger's original bounds until release shall not activate an overlapping menu item; dragging outside those bounds and releasing over an item shall still activate it. The trigger carries `aria-haspopup`, `aria-expanded` and, while open, `aria-controls` naming the menu, which the trigger labels. `isOpen` with `onOpenChange` controls the open state and `defaultOpen` sets it uncontrolled. `isDisabled` keeps the trigger's element, ref and focus but hands it no menu: it carries no popup attributes, presses as it would without the trigger, and closes a menu that was open through `onOpenChange(false)`, once, so the menu stays closed when the trigger is enabled again; a controlled menu is drawn closed while the trigger is disabled.

Implementation: `src/components/menu/menu.tsx`, `src/components/menu/menu-trigger.tsx`, `src/components/menu/menu-trigger-press.tsx`
Verification: `src/components/menu/menu.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-4.2 - Focus return

Closing a menu opened from a trigger, by an action, Escape or a press outside, shall return focus to the trigger.

Implementation: `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-4.3 - Popover

`MenuPopover` shall be a popover placed against its trigger, taking the overlay position props: `placement` (a `Placement`) defaults to `bottom start`, `DEFAULT_DROPDOWN_OFFSET` (4 pixels) away (`offset`), shifted by `crossOffset`, flipping to the other side when it does not fit unless `shouldFlip` is false, and limiting its height to the room in the viewport less `DEFAULT_OVERLAY_GUTTER` (8 pixels, `containerPadding`); the popover is the scroll container of a menu taller than that room. Repositioning or resizing the viewport shall preserve the focused item in view. It publishes `data-placement`, `data-trigger` (`MenuTrigger`, `SubmenuTrigger`), `data-entering` and `data-exiting`, and closes on a press outside it. Pressing its own `MenuTrigger` again shall close it once through the trigger, without an outside close reopening it on the same press. While it is open the page outside stays scrollable, reachable and visible to assistive technology. As the page scrolls the menu stays open and keeps its place against the trigger, a sticky or fixed one included; scrolling an element that holds the trigger closes it, since the popover cannot follow that. A close the reader asks for, such as Escape, still closes the menu when it lands in the same task as a page scroll or while a non-bubbling ancestor scroll is awaiting cleanup, including before an ignored scroll close commits another render.

Implementation: `src/components/menu/menu-popover.tsx`, `labs/reference/menu.css`
Verification: `src/components/menu/menu-popover.test.tsx`, `e2e/menu.spec.ts`

A first press that reveals the trigger inside a scrolling ancestor shall open the menu. Only a scroll the reader makes after the menu opens closes it: until the reader turns a wheel, moves a touch, or presses a pointer or a key, scrolls are the page's own (a reveal or focus scroll still settling, as after moving through a list's rows with the keys) and leave it open. After that, a queued scroll event for offsets already present at opening shall not close it; changing an ancestor’s scroll offsets shall still close it. A hinted trigger follows the same rule.

### UIC-MENU-4.4 - Layers

`MenuPopover` shall sit on the overlay layer `layer` ([PORTAL.md](PORTAL.md)), `dropdown` by default, publish it in `data-layer` and take its z-index from `useLayerZIndex`, so a provider's `layerZIndex` applies and a menu stacks above `modal` content and below `tooltip` and `toast` content. A submenu popover takes the layer of the menu popover that opens it.

Implementation: `src/components/menu/menu-popover.tsx`
Verification: `src/components/menu/menu-popover.test.tsx`, `e2e/menu.spec.ts`

### UIC-MENU-4.5 - Submenus

`SubmenuTrigger`, given a `MenuItem` and a `MenuPopover`, shall make the item a submenu trigger (`aria-haspopup="menu"`, `aria-expanded`, `data-has-submenu`, `data-open` while open) that opens its `MenuPopover` beside the item, overlapping the parent menu by 2 pixels (`SUBMENU_OFFSET`) and shifted 4 pixels toward the parent item (`SUBMENU_CROSS_OFFSET`): on hover after a short delay, on press, and on Arrow Right (Arrow Left in right-to-left text), which focuses the submenu's first item. In the submenu, Arrow Left (Arrow Right in right-to-left text) and Escape close only the submenu and return focus to its trigger item. Activating an item of a submenu closes the whole menu.

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

With `virtualized`, a menu given as children or as data shall render through React Aria's `Virtualizer` with a list layout ([UIC-COLLECTIONS-1.1](COLLECTIONS.md#uic-collections-11---virtualized-rendering)) and publish `data-virtualized`, drawing only the rows in view of its scroll container (its `MenuPopover`, or the page), each `rowHeight` pixels high (by default 24, 28 or 32 at size `sm`, `md` or `lg`, [UIC-COLLECTIONS-1.4](COLLECTIONS.md#uic-collections-14---layout-options)), while keyboard navigation reaches every item and each row keeps its hooks, `aria-setsize` and `aria-posinset`. Filtering and loading more work the same in a virtualized menu. A virtualized menu shall keep a stable intrinsic width, bounded by the viewport; repeated measurement shall never make it grow wider.

Implementation: `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu.test.tsx`, `e2e/menu.spec.ts`, `e2e/lab-layout-regressions.spec.ts`

### UIC-MENU-5.4 - Highlighted matches

With `highlightMatches`, the menu shall mark the text typed in the enclosing search field (its own with `filterable`, or a [Command Palette](COMMAND-PALETTE.md)'s) in the labels of its data entries and their submenus, through [Text Match](TEXT-MATCH.md) ignoring case and accents, and in any `TextMatch` its children draw. Marks only split the label's text, so names, type-to-select and filtering are unchanged. Without it, labels stay plain text even inside a `TextMatchProvider`.

Implementation: `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu.test.tsx`, `e2e/menu.spec.ts`

## UIC-MENU-6 - Built-in action icons

### UIC-MENU-6.1 - Action icon maps

A component whose menu offers built-in actions shall take their icons as a `MenuActionIcons<Action>` map, keyed by action name, through a `menuIcons` prop (or `<menu>MenuIcons`, such as `tileMenuIcons`, where the component already names its menu that way). For each listed action, an icon replaces the action's own and `null` (or `false`) leaves it without one; an action left out keeps its default, which may be none. Only the icon changes: the action's label, accessible name, availability, tone, handler, keyboard and context-menu invocation and focus return stay as they were. Entries the caller adds are `MenuEntry` objects and take their icon from the entry's own `icon`. `resolveActionIcon(icons, action, fallback)` resolves one action's icon by these rules. Action icons are decorative ([UIC-MENU-2.1](#uic-menu-21---anatomy)), so they add nothing to an item's name. The components with built-in menu actions, their actions and default icons:

| Component                                                  | Prop             | Actions                                                                                                                       | Default icons         |
| ---------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `Field` and every field built on it                        | `menuIcons`      | `clear`, `reset`, `set-default`, `help`                                                                                       | yes                   |
| `SignaturePad`                                             | `menuIcons`      | its own `upload-image`, `paste-image`, `delete-image`, `undo-stroke`, and the field's                                         | yes                   |
| `TabList`                                                  | `menuIcons`      | `rename`, `duplicate`, `move-backward`, `move-forward`, `delete`                                                              | yes                   |
| `ConditionBuilder`                                         | `menuIcons`      | `move-up`, `move-down`, `duplicate`, `delete`                                                                                 | none                  |
| `RelationMatrix`                                           | `menuIcons`      | `move-before`, `move-after`, `insert-before`, `insert-after`, `remove`, `remove-relation` (a cell's kinds take their `glyph`) | none                  |
| `CalendarView`                                             | `eventMenuIcons` | `edit`                                                                                                                        | none                  |
| `DashboardGrid`                                            | `tileMenuIcons`  | `move`, `resize`, `remove`                                                                                                    | none                  |
| `ChatMessageActionsMenu`, and `Chat` as `messageMenuIcons` | `menuIcons`      | `copy`, `up`, `down`, `reply`, `react`, `edit`, `delete`                                                                      | yes                   |
| `FolderManager`                                            | `menuIcons`      | `rename`, `delete`, `move`                                                                                                    | `rename` and `delete` |
| `PdfViewer`                                                | `menuIcons`      | `copy`                                                                                                                        | none                  |

`Timeline` item menus and the empty space menu of `DashboardGrid` hold only the caller's entries, so the entry's `icon` already covers them. In a menu where some rows have an icon, the reference stylesheet indents the text of the rows without one so every label starts in line; selection checks and submenu arrows keep their own slots.

Implementation: `src/components/menu/menu-action-icons.ts`, `labs/reference/menu.css`
Verification: `src/components/menu/menu-action-icons.test.tsx`, `e2e/menu.spec.ts`

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
| `ui-menu-item__check`             | slot      |                                                                               | Selection check, also on check items; holds the glyph when checked. |
| `ui-menu-item__icon`              | slot      |                                                                               | Leading icon (also `ui-icon`).                                      |
| `ui-menu-item__spinner`           | slot      |                                                                               | Busy indicator of a pending item.                                   |
| `ui-menu-item__label`             | slot      |                                                                               | The label.                                                          |
| `ui-menu-item__description`       | slot      |                                                                               | Secondary text.                                                     |
| `ui-menu-item__shortcut`          | slot      |                                                                               | Keyboard chord (also `ui-shortcut`).                                |
| `ui-menu-item__trailing`          | slot      |                                                                               | Trailing content, such as a count badge.                            |
| `ui-menu-item__submenu-indicator` | slot      |                                                                               | Chevron of a submenu trigger (also `ui-glyph`).                     |
| `data-tone`                       | attribute | `neutral`, `danger`                                                           | Emphasis.                                                           |
| `data-key`                        | state     |                                                                               | Opaque collection key (React Aria): not the `id`, not for styling.  |
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
