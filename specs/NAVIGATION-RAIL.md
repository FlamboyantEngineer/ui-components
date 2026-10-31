# Navigation Rail

`NavigationRail` is the side navigation of an application: a `navigation` landmark with a header, sections of links and groups, and a footer. It collapses to a rail of icons with tooltips, can be resized, and keeps both through the provider storage. Items are links drawn through the provider's link renderer, with an icon, a count and the current page marked; groups open and close under a button. A pinned or favourites list is a section like any other.

## UIC-NAVIGATION-RAIL-1 - Rail

### UIC-NAVIGATION-RAIL-1.1 - Structure

`NavigationRail` shall render a `ui-navigation-rail` `<nav>` named by `aria-label` or `aria-labelledby`, holding in order a `ui-navigation-rail__header` holding `header` and the collapse button, a `ui-navigation-rail__body` holding the children (`NavigationRailSection`s), a `ui-navigation-rail__footer` holding `footer` when it has content, and the resize handle when the rail is resizable and expanded.

Implementation: `src/components/navigation-rail/navigation-rail.tsx`
Verification: `src/components/navigation-rail/navigation-rail.test.tsx`, `e2e/navigation-rail.spec.ts`

### UIC-NAVIGATION-RAIL-1.2 - Collapse

The header shall end with a small [Icon Button](BUTTON.md) in the `ui-navigation-rail__toggle` slot, labelled and hinted by the provider's `toggleNavigation` string (`Collapse navigation`, `Expand navigation` while collapsed), with `aria-expanded` and `aria-controls` naming the body. Its glyph points to the inline start while the rail is expanded (`chevron-double-left` left to right) and to the inline end while collapsed. Pressing it collapses or expands the rail, published as `data-collapsed`; `isCollapsed`, `defaultCollapsed` (false) and `onCollapsedChange` make the state controllable. The button keeps focus across the change.

Implementation: `src/components/navigation-rail/navigation-rail.tsx`, `src/components/navigation-rail/navigation-rail-state.ts`, `src/core/strings/common.ts`
Verification: `src/components/navigation-rail/navigation-rail.test.tsx`, `e2e/navigation-rail.spec.ts`

### UIC-NAVIGATION-RAIL-1.3 - Resizing

With `isResizable`, the expanded rail shall publish `data-resizable`, set its width in pixels as `--ui-navigation-rail-width` on its root, and end with a standalone [Resize Handle](SPLIT-VIEW.md#uic-split-view-34---standalone-handle) in the `ui-navigation-rail__resize-handle` slot, named by the provider's `resizeNavigation` string (`Resize navigation`), bounded by `minWidth` (180) and `maxWidth` (400); a stored or controlled width outside them is drawn at the nearest bound. Dragging updates the width live and publishes `data-resizing`; arrow keys step 5 % of `maxWidth` (1 % with Shift) and Home and End jump to the bounds. `onWidthChange` receives the width when a drag ends and after a key step; `width` and `defaultWidth` (240) make it controllable. A collapsed rail draws no handle.

Implementation: `src/components/navigation-rail/navigation-rail.tsx`, `src/components/split-view/split-view.tsx`
Verification: `src/components/navigation-rail/navigation-rail.test.tsx`, `e2e/navigation-rail.spec.ts`

### UIC-NAVIGATION-RAIL-1.4 - Persistence

With `persistKey`, an uncontrolled rail shall restore its collapsed state from the provider storage under `<persistKey>:collapsed` and its width under `<persistKey>:width`, and save each when it changes, never during a drag. A controlled value ignores storage, and an unreadable stored value, or one of the wrong type (a collapsed state that is not a boolean, a width that is not a finite number), falls back to the default.

Implementation: `src/components/navigation-rail/navigation-rail.tsx`, `src/components/navigation-rail/navigation-rail-state.ts`
Verification: `src/components/navigation-rail/navigation-rail.test.tsx`, `e2e/navigation-rail.spec.ts`

### UIC-NAVIGATION-RAIL-1.5 - Keyboard

Tab shall move through the rail's links and group buttons in order. Inside the body, Down and Up arrows also move focus to the next and previous link or group button, and Home and End to the first and last, skipping the items of closed groups.

Implementation: `src/components/navigation-rail/navigation-rail.tsx`
Verification: `src/components/navigation-rail/navigation-rail.test.tsx`, `e2e/navigation-rail.spec.ts`

## UIC-NAVIGATION-RAIL-2 - Sections and items

### UIC-NAVIGATION-RAIL-2.1 - Sections

`NavigationRailSection` shall render a `ui-navigation-rail__section` `<div>` holding its `title` in a `ui-navigation-rail__section-title` element and its children in a `ui-navigation-rail__list` `<ul>` labelled by the title. Without a title the list is unnamed. While the rail is collapsed the title is visually hidden and still names the list.

Implementation: `src/components/navigation-rail/navigation-rail-items.tsx`
Verification: `src/components/navigation-rail/navigation-rail.test.tsx`, `e2e/navigation-rail.spec.ts`

### UIC-NAVIGATION-RAIL-2.2 - Items

`NavigationRailItem` shall render a `ui-navigation-rail__item` `<li>` holding a [Link](LINK.md) in the `ui-navigation-rail__link` slot (secondary, standalone, never underlined) to `href` through the provider's link renderer, which calls `onPress` when pressed. The link holds the `icon` as a decorative [Icon](ICON.md) in the `ui-navigation-rail__icon` slot, then `label` in `ui-navigation-rail__label`. With `isCurrent` the link has `aria-current="page"` and the item publishes `data-current`.

Implementation: `src/components/navigation-rail/navigation-rail-items.tsx`
Verification: `src/components/navigation-rail/navigation-rail.test.tsx`, `e2e/navigation-rail.spec.ts`

### UIC-NAVIGATION-RAIL-2.3 - Counts

A positive `count` shall show after the label as a small count [Badge](BADGE.md) in the `ui-navigation-rail__count` slot, capped as `99+`, inline while the rail is expanded and as an overlay on the icon while collapsed; zero, negative and non-finite counts show nothing. As for a tab ([UIC-TABS-1.2](TABS.md#uic-tabs-12---labels-icons-and-counts)), the link's accessible name is its visible text (the label, then the shown count) and its accessible description is `countLabel`, or the provider's `itemCount` text, with the full count.

Implementation: `src/components/navigation-rail/navigation-rail-items.tsx`
Verification: `src/components/navigation-rail/navigation-rail.test.tsx`, `e2e/navigation-rail.spec.ts`

### UIC-NAVIGATION-RAIL-2.4 - Collapsed items

While the rail is collapsed, an item's label shall be visually hidden and still name the link, and hovering or focusing the link shows the label in a [Tooltip](TOOLTIP.md) at the inline end, which adds no description of its own. An item without an icon shows the label's initials in a decorative `ui-navigation-rail__monogram` in its place. Expanded, no tooltip opens.

Implementation: `src/components/navigation-rail/navigation-rail-items.tsx`
Verification: `src/components/navigation-rail/navigation-rail.test.tsx`, `e2e/navigation-rail.spec.ts`

### UIC-NAVIGATION-RAIL-2.5 - Groups

`NavigationRailGroup` shall render a `ui-navigation-rail__item` `<li>` holding a React Aria disclosure in the `ui-navigation-rail__group` slot (`data-expanded` while open): a button in `ui-navigation-rail__group-trigger` with the `icon`, the `label` and an indicator glyph in `ui-navigation-rail__indicator` (pointing to the inline end, down while open), and a panel in `ui-navigation-rail__group-panel` (a `group` named by the button) holding its children in a `ui-navigation-rail__list`. `isExpanded`, `defaultExpanded` (false) and `onExpandedChange` make it controllable. While a current item is anywhere inside it, nested groups included, its item publishes `data-current`, and an uncontrolled group opens when the current item moves inside.

Implementation: `src/components/navigation-rail/navigation-rail-items.tsx`, `src/components/navigation-rail/navigation-rail-state.ts`
Verification: `src/components/navigation-rail/navigation-rail.test.tsx`, `e2e/navigation-rail.spec.ts`

### UIC-NAVIGATION-RAIL-2.6 - Groups in a collapsed rail

While the rail is collapsed, a group shall stay closed and show its button as an icon tile with the label in a tooltip, as an item does. Pressing it expands the rail and opens the group, reporting both changes.

Implementation: `src/components/navigation-rail/navigation-rail-items.tsx`, `src/components/navigation-rail/navigation-rail.tsx`
Verification: `src/components/navigation-rail/navigation-rail.test.tsx`, `e2e/navigation-rail.spec.ts`

## UIC-NAVIGATION-RAIL-3 - Accessibility

### UIC-NAVIGATION-RAIL-3.1 - Navigation semantics

The rail shall be a named `navigation` landmark of lists of links: links stay links (not menu items or tree items), the current page is `aria-current="page"`, group buttons report `aria-expanded`, and the collapse button reports the rail's state. Every lab state passes axe in the light and dark reference themes.

Implementation: `src/components/navigation-rail/navigation-rail.tsx`, `src/components/navigation-rail/navigation-rail-items.tsx`
Verification: `src/components/navigation-rail/navigation-rail.test.tsx`, `e2e/navigation-rail.spec.ts`

### UIC-NAVIGATION-RAIL-3.2 - Hooks and caller attributes

The rail and its parts shall carry the hooks below and append the caller's `className`; the rail forwards caller `data-*` attributes and `id` to its root, and sections, items and groups to their own root elements.

Implementation: `src/components/navigation-rail/navigation-rail.tsx`, `src/components/navigation-rail/navigation-rail-items.tsx`
Verification: `src/components/navigation-rail/navigation-rail.test.tsx`

## Hooks

| Hook                                | Kind     | Values | Description                                                         |
| ----------------------------------- | -------- | ------ | ------------------------------------------------------------------- |
| `ui-navigation-rail`                | root     |        | The rail's `<nav>`.                                                 |
| `ui-navigation-rail__header`        | slot     |        | The header content and the collapse button.                         |
| `ui-navigation-rail__toggle`        | slot     |        | The collapse button (also `ui-button`).                             |
| `ui-navigation-rail__body`          | slot     |        | The sections.                                                       |
| `ui-navigation-rail__footer`        | slot     |        | The footer content.                                                 |
| `ui-navigation-rail__resize-handle` | slot     |        | The handle at the inline end (also `ui-resize-handle`).             |
| `ui-navigation-rail__section`       | slot     |        | A section's `<div>`.                                                |
| `ui-navigation-rail__section-title` | slot     |        | A section's title, visually hidden while collapsed.                 |
| `ui-navigation-rail__list`          | slot     |        | The `<ul>` of a section or a group.                                 |
| `ui-navigation-rail__item`          | slot     |        | The `<li>` of an item or a group.                                   |
| `ui-navigation-rail__link`          | slot     |        | An item's link (also `ui-link`).                                    |
| `ui-navigation-rail__icon`          | slot     |        | An item's or group's icon (also `ui-icon`).                         |
| `ui-navigation-rail__monogram`      | slot     |        | The initials of an item without an icon, while collapsed.           |
| `ui-navigation-rail__label`         | slot     |        | An item's or group's label, visually hidden while collapsed.        |
| `ui-navigation-rail__count`         | slot     |        | An item's count (also `ui-badge`).                                  |
| `ui-navigation-rail__group`         | slot     |        | A group's disclosure `<div>` (React Aria `Disclosure`).             |
| `ui-navigation-rail__group-trigger` | slot     |        | A group's button.                                                   |
| `ui-navigation-rail__indicator`     | slot     |        | A group's indicator glyph (also `ui-glyph`).                        |
| `ui-navigation-rail__group-panel`   | slot     |        | A group's panel (React Aria `DisclosurePanel`).                     |
| `data-collapsed`                    | state    | `true` | On the rail: it shows icons only.                                   |
| `data-resizable`                    | state    | `true` | On the rail: it has a resize handle while expanded.                 |
| `data-resizing`                     | state    | `true` | On the rail: a drag of the handle is in progress.                   |
| `data-current`                      | state    | `true` | On an item: it is the current page; on a group's item: it holds it. |
| `data-expanded`                     | state    | `true` | On a group: its panel shows (React Aria).                           |
| `data-focus-visible-within`         | state    | `true` | On a group or its panel: keyboard focus inside (React Aria).        |
| `data-hovered`                      | state    | `true` | On a group's button, while the pointer is over it (React Aria).     |
| `data-pressed`                      | state    | `true` | On a group's button, while pressed (React Aria).                    |
| `data-focused`                      | state    | `true` | On a group's button, while focused (React Aria).                    |
| `data-focus-visible`                | state    | `true` | On a group's button, while focused by keyboard (React Aria).        |
| `--ui-navigation-rail-width`        | property |        | On a resizable rail: its expanded width, in pixels.                 |
