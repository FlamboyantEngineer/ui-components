# Navigation Menu

`NavigationMenu` is site navigation: a navigation landmark listing top-level links and items whose panels hold links and other content, such as a column of product links with a short description. It is a list of navigation links, not commands, so it is separate from [Menubar](MENUBAR.md) and [Menu](MENU.md); a [Navigation Rail](NAVIGATION-RAIL.md) is the side navigation of an application. Its triggers and panels are React Aria `Disclosure`s, and its links are the library [Link](LINK.md).

## UIC-NAVIGATION-MENU-1 - Structure

### UIC-NAVIGATION-MENU-1.1 - Landmark and list

`NavigationMenu` shall render a `<nav>` (`ui-navigation-menu`) named by `aria-label` or `aria-labelledby`, holding a `<ul>` (`ui-navigation-menu__list`). Each `NavigationMenuItem` and each top-level `NavigationMenuLink` is an `<li>` (`ui-navigation-menu__item`) of that list.

Implementation: `src/components/navigation-menu/navigation-menu.tsx`, `src/components/navigation-menu/navigation-menu-items.tsx`
Verification: `src/components/navigation-menu/navigation-menu.test.tsx`, `e2e/navigation-menu.spec.ts`

### UIC-NAVIGATION-MENU-1.2 - Items, triggers and panels

A `NavigationMenuItem` shall render a `<button>` trigger (`ui-navigation-menu__trigger`) holding its `label` and an indicator glyph (`ui-navigation-menu__indicator`), and a panel (`ui-navigation-menu__panel`) after it holding its children. The trigger carries `aria-expanded` and controls the panel, which the trigger names; a closed panel is hidden and its content leaves the tab order. The item publishes `data-open` while its panel is open and `data-disabled` while `isDisabled`. A disabled item's trigger refuses presses and hover, and its panel stays closed.

Implementation: `src/components/navigation-menu/navigation-menu-items.tsx`
Verification: `src/components/navigation-menu/navigation-menu.test.tsx`, `e2e/navigation-menu.spec.ts`

### UIC-NAVIGATION-MENU-1.3 - Links

`NavigationMenuLink` shall render the library `Link` (`ui-navigation-menu__link`), so it navigates through the provider's router with `routerOptions`, keeps native link behaviour (modified clicks, the context menu, a new tab), and says when it opens a new tab. `isCurrent` gives it `aria-current="page"` and `data-current`. At the top level it is wrapped in an `<li>` item, which also publishes `data-current`; inside a panel it is panel content without an item of its own.

Implementation: `src/components/navigation-menu/navigation-menu-items.tsx`
Verification: `src/components/navigation-menu/navigation-menu.test.tsx`, `e2e/navigation-menu.spec.ts`

## UIC-NAVIGATION-MENU-2 - Opening and closing

### UIC-NAVIGATION-MENU-2.1 - One open panel

At most one panel shall be open. `openKey` (controlled) or `defaultOpenKey` (uncontrolled) is the `id` of the item whose panel is open, `null` for none, and `onOpenKeyChange` is called with the new key, or `null` when the open panel closes. Opening an item closes the one open before it. The root publishes `data-open` while a panel is open.

Implementation: `src/components/navigation-menu/navigation-menu.tsx`
Verification: `src/components/navigation-menu/navigation-menu.test.tsx`

### UIC-NAVIGATION-MENU-2.2 - Press and keyboard

Pressing a trigger, by pointer, touch, Enter or Space, shall open its panel, or close it when open. Focus stays on the trigger, and Tab moves into the open panel's content in document order, then on to the next item. Opening by press works without hover, so touch and keyboard use never depend on it.

Implementation: `src/components/navigation-menu/navigation-menu-items.tsx`
Verification: `src/components/navigation-menu/navigation-menu.test.tsx`, `e2e/navigation-menu.spec.ts`

### UIC-NAVIGATION-MENU-2.3 - Pointer intent

With `openOnHover` (the default), a mouse or pen resting on an item for `openDelay` milliseconds (200 by default) shall open its panel; while a panel the pointer opened is open, moving onto another item switches to it at once. The panel stays open while the pointer is anywhere in the item, the trigger or its panel, and closes `closeDelay` milliseconds (300 by default) after the pointer leaves the item, so crossing a gap between the trigger and a panel placed away from it does not close it. A pointer coming back within the delay keeps it open. A touch never opens by hover. A press on a trigger whose panel the pointer opened pins the panel instead of closing it: a pinned panel ignores the pointer leaving and closes by press, Escape or dismissal. Hover has no animation of its own, so reduced motion changes nothing here.

Implementation: `src/components/navigation-menu/navigation-menu.tsx`, `src/components/navigation-menu/navigation-menu-items.tsx`
Verification: `src/components/navigation-menu/navigation-menu.test.tsx`, `e2e/navigation-menu.spec.ts`

### UIC-NAVIGATION-MENU-2.4 - Dismissal

Escape, with focus in an item's trigger or panel, shall close the open panel and move focus to its trigger. A press outside the menu, focus moving to an element outside the menu, and a press on a `NavigationMenuLink` shall close the open panel. Focus that lands on nothing, as after a press on a panel's text, leaves it open.

Implementation: `src/components/navigation-menu/navigation-menu.tsx`, `src/components/navigation-menu/navigation-menu-items.tsx`
Verification: `src/components/navigation-menu/navigation-menu.test.tsx`, `e2e/navigation-menu.spec.ts`

### UIC-NAVIGATION-MENU-2.5 - Removed items

An open key that names no rendered item, such as an item removed while open, shall leave every panel closed and the root without `data-open`. The key itself is the caller's: it is not reset, so the item opens again if it comes back under the same `id`.

Implementation: `src/components/navigation-menu/navigation-menu.tsx`
Verification: `src/components/navigation-menu/navigation-menu.test.tsx`

## UIC-NAVIGATION-MENU-3 - Layout

### UIC-NAVIGATION-MENU-3.1 - Measured panel size

While a panel is open, the root shall publish its border box as `--ui-navigation-menu-panel-width` and `--ui-navigation-menu-panel-height` (in pixels), updated as the panel's content resizes, so a stylesheet can size and animate one shared box under the list across items. Without an open panel, or before the first measurement, neither is set.

Implementation: `src/components/navigation-menu/navigation-menu.tsx`, `labs/reference/navigation-menu.css`
Verification: `src/components/navigation-menu/navigation-menu.test.tsx`, `e2e/navigation-menu.spec.ts`

### UIC-NAVIGATION-MENU-3.2 - Direction and responsive layout

The menu has no direction of its own: in a right-to-left locale the list and the panels follow the document's direction, and the stylesheet places panels with logical properties. A host may lay the list out in a row on wide screens and in a column on narrow ones; the behaviour does not depend on the layout.

Implementation: `labs/reference/navigation-menu.css`
Verification: `e2e/navigation-menu.spec.ts`

## Hooks

| Hook                                | Kind      | Values | Description                                                         |
| ----------------------------------- | --------- | ------ | ------------------------------------------------------------------- |
| `ui-navigation-menu`                | root      |        | The `<nav>` landmark.                                               |
| `ui-navigation-menu__list`          | slot      |        | The `<ul>` of top-level items.                                      |
| `ui-navigation-menu__item`          | slot      |        | An `<li>`: an item with a panel, or a top-level link.               |
| `ui-navigation-menu__trigger`       | slot      |        | The button that opens and closes an item's panel.                   |
| `ui-navigation-menu__indicator`     | slot      |        | The trigger's chevron.                                              |
| `ui-navigation-menu__panel`         | slot      |        | An item's panel of links and content.                               |
| `ui-navigation-menu__link`          | slot      |        | A link, top-level or in a panel.                                    |
| `data-open`                         | attribute |        | On the root while a panel is open; on the item whose panel is open. |
| `data-disabled`                     | attribute |        | On a disabled item and its trigger.                                 |
| `data-current`                      | attribute |        | On the current page's link and its top-level item.                  |
| `data-hovered`                      | state     |        | The trigger is hovered.                                             |
| `data-pressed`                      | state     |        | The trigger is pressed.                                             |
| `data-focused`                      | state     |        | The trigger has focus.                                              |
| `data-focus-visible`                | state     |        | The trigger has keyboard focus.                                     |
| `data-expanded`                     | state     |        | The trigger's panel is open.                                        |
| `data-focus-visible-within`         | state     |        | Keyboard focus is inside the panel.                                 |
| `data-focus-within`                 | state     |        | Focus is inside the panel.                                          |
| `--ui-navigation-menu-panel-width`  | property  |        | The open panel's border-box width, in pixels.                       |
| `--ui-navigation-menu-panel-height` | property  |        | The open panel's border-box height, in pixels.                      |
