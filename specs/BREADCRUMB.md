# Breadcrumb

`Breadcrumb` is a location trail: one ordered row of crumbs from the outermost container to the current page, in which every crumb before the current one leads to its destination. It is built on React Aria's `Breadcrumbs`, `Breadcrumb` and `Link`, draws its links through the provider's link renderer and shows a cut label whole in a tooltip. A trail that runs out of room can collapse its middle crumbs into a menu, and a crumb can offer the places beside it in a menu. Switching between sibling views of one page is [Tabs](TABS.md); a single location string is a [Path](PATH.md).

## UIC-BREADCRUMB-1 - Structure

### UIC-BREADCRUMB-1.1 - Trail

`Breadcrumb` shall render a `nav` landmark (the `ui-breadcrumb` root) around an ordered list (`ui-breadcrumb__list`) with one `ui-breadcrumb__item` per entry of `items`, in order. Each crumb's `label` renders in the `ui-breadcrumb__label` slot of its `ui-breadcrumb__link` element.

Implementation: `src/components/breadcrumb/breadcrumb.tsx`
Verification: `src/components/breadcrumb/breadcrumb.test.tsx`, `e2e/breadcrumb.spec.ts`

### UIC-BREADCRUMB-1.2 - Current crumb

The last crumb shall be the current page: it carries `aria-current="page"`, `aria-disabled="true"`, `data-current` and `data-disabled`, renders as a `<span>` rather than an anchor, and is not focusable, whatever its `href`.

Implementation: `src/components/breadcrumb/breadcrumb.tsx`
Verification: `src/components/breadcrumb/breadcrumb.test.tsx`, `e2e/breadcrumb.spec.ts`

### UIC-BREADCRUMB-1.3 - Links

Every other crumb with an `href` shall be a native link in the tab order, rendered through the provider's `renderLink` and navigating through its `navigate` when the host sets one ([PROVIDER.md](PROVIDER.md)). A crumb without an `href` is a focusable element with role `link`. Activating any crumb other than the current one shall call `onAction` with the crumb's `id`, or its index when it has none.

Implementation: `src/components/breadcrumb/breadcrumb.tsx`
Verification: `src/components/breadcrumb/breadcrumb.test.tsx`, `e2e/breadcrumb.spec.ts`

### UIC-BREADCRUMB-1.4 - Separators

Between consecutive crumbs, and never after the last, the trail shall draw a decorative separator in the `ui-breadcrumb__separator` slot, a small [Icon](ICON.md) hidden from assistive technology. It defaults to a chevron pointing along the reading direction (`chevron-right`, or `chevron-left` in right-to-left locales); `separator` replaces it with another icon component or element, and `null` or `false` draws no separator at all.

Implementation: `src/components/breadcrumb/breadcrumb.tsx`
Verification: `src/components/breadcrumb/breadcrumb.test.tsx`, `e2e/breadcrumb.spec.ts`

### UIC-BREADCRUMB-1.5 - Sizes and truncation

`size` (`xs`, `sm`, `md` by default, `lg`) shall publish `data-size` on the root; the reference sheet uses 11, 12, 13 and 14 pixel type on 16, 20, 24 and 28 pixel lines. The full label text stays in the DOM, so a stylesheet that bounds the root and list to the host's width can ellipsize a label (the `ui-breadcrumb__label`) only when the row runs out of room.

Implementation: `src/components/breadcrumb/breadcrumb.tsx`, `labs/reference/breadcrumb.css`
Verification: `src/components/breadcrumb/breadcrumb.test.tsx`, `e2e/breadcrumb.spec.ts`

### UIC-BREADCRUMB-1.6 - Hooks and caller attributes

`Breadcrumb` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id`, `ref` and `hidden` to the `nav`.

Implementation: `src/components/breadcrumb/breadcrumb.tsx`
Verification: `src/components/breadcrumb/breadcrumb.test.tsx`

### UIC-BREADCRUMB-1.7 - Overflow menu

With `overflow="menu"` a trail of three crumbs or more shall render only the crumbs that fit in its list, as [`useOverflowItems`](OVERFLOW-LIST.md) measures them: the first crumb and the current one always stay, however narrow the trail, then as many as fit from the current end, at their natural width. Once every middle crumb is hidden the root publishes `data-collapsed`, and the reference sheet lets the first and current crumbs shrink and ellipsize their labels (read whole in their tooltips) rather than hide them. The current crumb is never listed in the menu and never becomes a link there. While crumbs are hidden, an overflow crumb (`ui-breadcrumb__item` and `ui-breadcrumb__overflow`, an `<li>` followed by a separator) after the first crumb holds an icon-only [Dropdown Menu](DROPDOWN-MENU.md) named by the provider's `moreItems` text with the count, listing the hidden crumbs by their text (`textValue`, or a plain-text label) with their links; choosing one navigates to its link and calls `onAction` with its `id`. Hidden crumbs stay in the trail's collection. `overflow` publishes `data-overflow` (`truncate` by default, or `menu`) on the root.

Implementation: `src/components/breadcrumb/breadcrumb.tsx`, `src/components/breadcrumb/crumb-overflow.tsx`, `src/components/overflow-list/visible-collection.tsx`, `labs/reference/breadcrumb.css`
Verification: `src/components/breadcrumb/breadcrumb.test.tsx`, `e2e/breadcrumb.spec.ts`

### UIC-BREADCRUMB-1.8 - Menus of nearby places

A crumb with a non-empty `menu` shall draw, after its link, an icon-only [Dropdown Menu](DROPDOWN-MENU.md) in the `ui-breadcrumb__menu` slot (a `chevron-down` trigger named by the provider's `placesBeside` text with the crumb's text) whose entries, as [Menu](MENU.md) takes them, list the places beside it: siblings to jump to, with their own links and actions. Choosing an entry also calls the trail's `onAction` with that entry's `id`, including entries in submenus. The menu button is its own tab stop; the arrow keys move between crumb links only.

Implementation: `src/components/breadcrumb/breadcrumb.tsx`
Verification: `src/components/breadcrumb/breadcrumb.test.tsx`, `e2e/breadcrumb.spec.ts`

## UIC-BREADCRUMB-2 - Behaviour

### UIC-BREADCRUMB-2.1 - Landmark name

The `nav` shall be named by `aria-label`, or `aria-labelledby`, or else a localized "Breadcrumbs". The list itself carries no second name.

Implementation: `src/components/breadcrumb/breadcrumb.tsx`
Verification: `src/components/breadcrumb/breadcrumb.test.tsx`, `e2e/breadcrumb.spec.ts`

### UIC-BREADCRUMB-2.2 - Arrow-key navigation

While a crumb has focus, the arrow key along the reading direction (ArrowRight, or ArrowLeft in right-to-left locales) and the opposite key shall move focus to the next and previous crumb other than the current one, stopping at both ends; Home and End shall move to the first and last of them. The current crumb and disabled crumbs are skipped. These keys with Alt, Control or Meta, or during a text composition, are left to the browser and the system, so Alt+ArrowLeft still goes back. The set follows re-renders that change the trail.

Implementation: `src/components/breadcrumb/breadcrumb.tsx`
Verification: `src/components/breadcrumb/breadcrumb.test.tsx`, `e2e/breadcrumb.spec.ts`

### UIC-BREADCRUMB-2.3 - Disabled

`isDisabled` shall disable every crumb: each renders as text with `aria-disabled="true"` and `data-disabled` on its item and link, leaves the tab order and ignores activation. The overflow menu and the crumbs' menus of nearby places are disabled too.

Implementation: `src/components/breadcrumb/breadcrumb.tsx`
Verification: `src/components/breadcrumb/breadcrumb.test.tsx`

### UIC-BREADCRUMB-2.4 - Interaction states

Crumb links shall publish their states: `data-hovered`, `data-pressed`, `data-focused` and `data-focus-visible` (keyboard focus only).

Implementation: `src/components/breadcrumb/breadcrumb.tsx`
Verification: `src/components/breadcrumb/breadcrumb.test.tsx`, `e2e/breadcrumb.spec.ts`

### UIC-BREADCRUMB-2.5 - Full-label tooltip

Each crumb's label shall be a [Truncation Tooltip](TRUNCATION-TOOLTIP.md): while the stylesheet cuts it, resting a mouse or pen on it, or keyboard focus reaching its crumb (by Tab or the arrow keys), shows the whole label in a tooltip, the current crumb's included. A label that fits shows none. The tooltip is visual only: the label already names the crumb, so it adds no description and never moves focus.

Implementation: `src/components/breadcrumb/breadcrumb.tsx`, `src/components/truncation-tooltip/truncation-tooltip.tsx`
Verification: `src/components/breadcrumb/breadcrumb.test.tsx`, `e2e/breadcrumb.spec.ts`

## Hooks

| Hook                       | Kind      | Values                 | Description                                                       |
| -------------------------- | --------- | ---------------------- | ----------------------------------------------------------------- |
| `ui-breadcrumb`            | root      |                        | The `<nav>` landmark.                                             |
| `ui-breadcrumb__list`      | slot      |                        | The ordered list (`<ol>`).                                        |
| `ui-breadcrumb__item`      | slot      |                        | One crumb (`<li>`).                                               |
| `ui-breadcrumb__link`      | slot      |                        | A crumb's link (`<a>`), or text (`<span>`) for the current one.   |
| `ui-breadcrumb__label`     | slot      |                        | A crumb's label text (also `ui-truncation-tooltip`).              |
| `ui-breadcrumb__menu`      | slot      |                        | A crumb's menu of nearby places (also `ui-dropdown-menu`).        |
| `ui-breadcrumb__overflow`  | slot      |                        | The overflow crumb holding the menu of hidden crumbs (an `<li>`). |
| `ui-breadcrumb__separator` | slot      |                        | The decorative separator after a crumb (also `ui-icon`).          |
| `data-size`                | attribute | `xs`, `sm`, `md`, `lg` | Type scale.                                                       |
| `data-overflow`            | attribute | `truncate`, `menu`     | What a trail that runs out of room does.                          |
| `data-collapsed`           | state     | `true`                 | An overflow menu holds every middle crumb.                        |
| `data-current`             | state     | `true`                 | The current crumb's item and link (React Aria).                   |
| `data-disabled`            | state     | `true`                 | A crumb that cannot be activated, including the current one.      |
| `data-hovered`             | state     | `true`                 | Pointer over a link.                                              |
| `data-pressed`             | state     | `true`                 | A link is being pressed.                                          |
| `data-focused`             | state     | `true`                 | A link is focused.                                                |
| `data-focus-visible`       | state     | `true`                 | A link has keyboard focus.                                        |
