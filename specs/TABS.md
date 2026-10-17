# Tabs

`Tabs` switches between peer sections of one surface. It is a family built on React Aria's `Tabs`, `TabList`, `Tab` and `TabPanel`: `Tabs` holds the selection, `TabList` the row (or column) of `Tab`s, and each `TabPanel` the content of the tab with the same `id`. Picking one of a few values of a setting is a [Segmented Choice](SEGMENTED-CHOICE.md); showing where a page sits in a hierarchy is a [Breadcrumb](BREADCRUMB.md).

## UIC-TABS-1 - Structure

### UIC-TABS-1.1 - Tabs, list and panels

`Tabs` shall render its root, a `TabList` with role `tablist` named by its `aria-label` or `aria-labelledby`, one `Tab` per section with role `tab` named by its label, and the `TabPanel` of the selected tab with role `tabpanel`, labelled by its tab. Each selected tab carries `aria-selected="true"` and `aria-controls` naming its panel. `selectedKey` with `onSelectionChange` controls the selection and `defaultSelectedKey` sets it when uncontrolled; without either, the first enabled tab is selected.

Implementation: `src/components/tabs/tabs.tsx`
Verification: `src/components/tabs/tabs.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-1.2 - Labels, icons and counts

A tab's children shall render in the `ui-tabs__label` slot, which publishes plain-text labels in `data-label` so a stylesheet can reserve the width of a heavier selected weight. `icon` (a built-in glyph name or any icon node) draws a decorative [Icon](ICON.md) in the `ui-tabs__icon` slot before the label. `count` shows a positive whole number after the label in the `ui-tabs__count` slot, capped at `countMax` (99 by default) as `<max>+`; zero, negative and non-finite counts show nothing. The tab's accessible name is its visible text (the label, then the shown count), and its accessible description is `countLabel`, or the provider's `itemCount` text, with the full count.

Implementation: `src/components/tabs/tabs.tsx`
Verification: `src/components/tabs/tabs.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-1.3 - Selection indicator

The selected tab shall contain React Aria's selection indicator in the `ui-tabs__indicator` slot. When the selection moves, React Aria animates the indicator from the previous tab's position through any `translate` or size transition the stylesheet declares, so one bar appears to slide between tabs.

Implementation: `src/components/tabs/tabs.tsx`, `labs/reference.css`
Verification: `src/components/tabs/tabs.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-1.4 - Orientation and sizes

`orientation` (`horizontal` by default, or `vertical`) shall lay the tabs out in a row or a column and publish React Aria's `data-orientation` on the root and the list. `size` (`sm`, `md` by default, `lg`) shall publish `data-size` on the root; the reference sheet draws 30, 36 and 42 pixel tabs.

Implementation: `src/components/tabs/tabs.tsx`, `labs/reference.css`
Verification: `src/components/tabs/tabs.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-1.5 - Hooks and caller attributes

Each family member shall carry its hooks below and append the caller's `className`. `Tabs`, `TabList`, `Tab` and `TabPanel` forward caller `data-*` attributes, `ref` and DOM event handlers (such as `onContextMenu`) to their elements; `Tabs` also forwards `id`.

Implementation: `src/components/tabs/tabs.tsx`
Verification: `src/components/tabs/tabs.test.tsx`

## UIC-TABS-2 - Behaviour

### UIC-TABS-2.1 - Pointer and keyboard selection

Pressing a tab shall select it. Focus roves: only the selected tab is in the tab order. The arrow keys of the list's orientation (mirrored in right-to-left locales for a horizontal list) shall move to the previous or next enabled tab, wrapping at both ends, and Home and End to the first and last enabled tab. With the default `keyboardActivation="automatic"` moving focus also selects; with `manual`, Space or Enter selects the focused tab.

Implementation: `src/components/tabs/tabs.tsx`
Verification: `src/components/tabs/tabs.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-2.2 - Disabled tabs

A `Tab` with `isDisabled` (or listed in `disabledKeys`) shall carry `aria-disabled="true"` and `data-disabled`, ignore presses and be skipped by keyboard navigation. `isDisabled` on `Tabs` disables every tab.

Implementation: `src/components/tabs/tabs.tsx`
Verification: `src/components/tabs/tabs.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-2.3 - Tab links

A `Tab` with `href` shall render an `<a>` that keeps tab semantics. Selecting it navigates to its `href`, through the provider's `navigate` when the host sets one ([PROVIDER.md](PROVIDER.md)).

Implementation: `src/components/tabs/tabs.tsx`
Verification: `src/components/tabs/tabs.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-2.4 - Overflow

While its tabs do not fit, the list shall publish `data-overflowing`, re-measured when the list resizes or its tabs change. Whenever the selection changes, and on first render, an overflowing list shall scroll the selected tab toward its middle, clamped to the list's scroll range so the last tab ends flush with the list's end, smoothly unless the reader prefers reduced motion.

Implementation: `src/components/tabs/tabs.tsx`, `labs/reference.css`
Verification: `src/components/tabs/tabs.test.tsx`, `e2e/tabs.spec.ts`

### UIC-TABS-2.5 - Interaction states

The family shall publish React Aria's states: on the root `data-focused` and `data-focus-visible` while focus is within it and `data-disabled` while every tab is disabled; on each tab `data-selected`, `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible` and `data-disabled`; on the indicator `data-entering` and `data-exiting`; and on each panel `data-focused`, `data-focus-visible`, `data-inert` (a force-mounted panel that is not selected), `data-entering` and `data-exiting`.

Implementation: `src/components/tabs/tabs.tsx`
Verification: `src/components/tabs/tabs.test.tsx`, `e2e/tabs.spec.ts`

## Hooks

| Hook                 | Kind      | Values                   | Description                                                               |
| -------------------- | --------- | ------------------------ | ------------------------------------------------------------------------- |
| `ui-tabs`            | root      |                          | The `Tabs` element holding the list and panels.                           |
| `ui-tabs__list`      | slot      |                          | The `TabList` (`role="tablist"`).                                         |
| `ui-tabs__tab`       | slot      |                          | One `Tab` (`role="tab"`, an `<a>` with `href`).                           |
| `ui-tabs__indicator` | slot      |                          | The selection indicator inside the selected tab.                          |
| `ui-tabs__icon`      | slot      |                          | A tab's leading icon (also `ui-icon`).                                    |
| `ui-tabs__label`     | slot      |                          | A tab's label.                                                            |
| `ui-tabs__count`     | slot      |                          | A tab's shown count.                                                      |
| `ui-tabs__panel`     | slot      |                          | One `TabPanel` (`role="tabpanel"`).                                       |
| `data-size`          | attribute | `sm`, `md`, `lg`         | Tab block size, on the root.                                              |
| `data-orientation`   | attribute | `horizontal`, `vertical` | Layout and arrow-key axis, on the root and the list (React Aria).         |
| `data-label`         | attribute |                          | A plain-text label, on the label slot.                                    |
| `data-key`           | attribute |                          | A tab's `id`, written by React Aria.                                      |
| `data-collection`    | attribute |                          | React Aria's collection identifier on the list and tabs; not for styling. |
| `data-overflowing`   | state     | `true`                   | The list's tabs do not fit.                                               |
| `data-selected`      | state     | `true`                   | The selected tab.                                                         |
| `data-disabled`      | state     | `true`                   | A disabled tab, or every tab on the root.                                 |
| `data-hovered`       | state     | `true`                   | Pointer over a tab.                                                       |
| `data-pressed`       | state     | `true`                   | A tab is being pressed.                                                   |
| `data-focused`       | state     | `true`                   | A focused tab or panel, or focus within the root.                         |
| `data-focus-visible` | state     | `true`                   | Keyboard focus on a tab or panel, or within the root.                     |
| `data-inert`         | state     | `true`                   | A force-mounted panel that is not selected.                               |
| `data-entering`      | state     | `true`                   | The indicator or a panel is entering (React Aria animation hook).         |
| `data-exiting`       | state     | `true`                   | The indicator or a panel is exiting (React Aria animation hook).          |
