# Overflow List

`OverflowList` shows one row of items and keeps as many as fit; the rest go to an indicator at one end of the row, such as a "+N" count or a "more" menu built with [Dropdown Menu](DROPDOWN-MENU.md). It measures itself and draws nothing but its items and the indicator: the stylesheet lays the row out on one line with the items at their natural size (`flex: none`). Components with their own markup (a breadcrumb trail, a tab list, a toolbar) use the same measurement through `useOverflowItems`, and `resolveOverflowCount` is the pure rule both use.

## UIC-OVERFLOW-LIST-1 - Fitting items

### UIC-OVERFLOW-LIST-1.1 - Measured row

`OverflowList` shall render each of `items` through `renderItem(item, index)` in a `ui-overflow-list__item` element inside its `ui-overflow-list` root. While all of them fit in the root's content box it renders them all and no indicator. Otherwise it renders as many as fit from the kept end beside a `ui-overflow-list__overflow` element holding `renderOverflow(hiddenItems)`, publishes `data-overflowing`, and does not render the hidden items, which reach the user only through the indicator.

Implementation: `src/components/overflow-list/overflow-list.tsx`, `src/utils/use-overflow-items.ts`, `labs/reference/overflow-list.css`
Verification: `src/components/overflow-list/overflow-list.test.tsx`, `e2e/overflow-list.spec.ts`

### UIC-OVERFLOW-LIST-1.2 - Collapsing end

`collapseFrom` shall choose the end hidden items leave from and publish it in `data-collapse-from`: `end` (the default) keeps the first items and puts the indicator after them; `start` keeps the last items and puts the indicator before them. `index` is always the item's position in `items`.

Implementation: `src/components/overflow-list/overflow-list.tsx`, `src/utils/use-overflow-items.ts`
Verification: `src/components/overflow-list/overflow-list.test.tsx`, `e2e/overflow-list.spec.ts`

### UIC-OVERFLOW-LIST-1.3 - Measuring again

The row shall solve again when its content box or a rendered item or indicator changes size, from the sizes it last measured for hidden items. A new item list (another length, or another entry at some position) renders every item once and measures it before the browser paints. The indicator stays mounted while the row measures, so focus on it and a menu it opened survive.

Implementation: `src/utils/use-overflow-items.ts`
Verification: `src/components/overflow-list/overflow-list.test.tsx`, `e2e/overflow-list.spec.ts`

### UIC-OVERFLOW-LIST-1.4 - Sizes and the shared rule

An item's size shall be its border-box width plus its inline margins, and the root's `column-gap` separates neighbouring items and the last kept item from the indicator. `resolveOverflowCount({ sizes, available, gap, indicatorSize, collapseFrom })` returns how many items fit: all of them when they fit together, otherwise as many as fit from the kept end beside the indicator, possibly none. `useOverflowItems({ items, collapseFrom })` returns `visibleItems`, `hiddenItems` and the `containerRef` for a container whose element children are the rendered items, one element each and in order, plus the indicator at the collapsing end while `hiddenItems` is not empty.

Implementation: `src/utils/use-overflow-items.ts`
Verification: `src/components/overflow-list/overflow-list.test.tsx`

## UIC-OVERFLOW-LIST-2 - Composition

### UIC-OVERFLOW-LIST-2.1 - Swapping the root

`render(props, state)` shall replace the root `<div>` as [COMPOSITION.md](COMPOSITION.md) describes: the caller's element receives the root's hooks, caller attributes and the ref the row measures with, and `state.isOverflowing`. A React Aria `Toolbar` rendered this way gives the visible items and the indicator arrow-key focus.

Implementation: `src/components/overflow-list/overflow-list.tsx`, `src/utils/render-element.ts`
Verification: `src/components/overflow-list/overflow-list.test.tsx`, `e2e/overflow-list.spec.ts`

### UIC-OVERFLOW-LIST-2.2 - Hooks, caller attributes and semantics

`OverflowList` shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes, `id`, ARIA attributes and `ref` to its root, and keep its own hook values over caller attributes of the same name. It adds no role: the caller gives the row its semantics (a group, a toolbar) and names the indicator, for example "3 more fruit".

Implementation: `src/components/overflow-list/overflow-list.tsx`
Verification: `src/components/overflow-list/overflow-list.test.tsx`, `e2e/overflow-list.spec.ts`

## Hooks

| Hook                         | Kind      | Values         | Description                                          |
| ---------------------------- | --------- | -------------- | ---------------------------------------------------- |
| `ui-overflow-list`           | root      |                | The row.                                             |
| `ui-overflow-list__item`     | slot      |                | One kept item.                                       |
| `ui-overflow-list__overflow` | slot      |                | The indicator for the hidden items.                  |
| `data-collapse-from`         | attribute | `end`, `start` | The end hidden items leave from.                     |
| `data-overflowing`           | state     | `true`         | Some items do not fit and are left to the indicator. |
