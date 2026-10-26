# Disclosure

`Disclosure` is a collapsible section built on React Aria's `Disclosure`: a heading whose trigger shows or hides a panel. Given a `title` it draws its own title and panel; without one, the caller composes it from `DisclosureTitle`, `DisclosureHeader` and `DisclosurePanel`, for example to put actions beside the trigger. `DisclosureGroup` (React Aria's `DisclosureGroup`) expands its disclosures together, one at a time as an accordion or several at once. A section whose header also carries a description and actions is a collapsible [Section](SECTION-HEADER.md); a property panel's categories are [Property Panel](PROPERTY-PANEL.md) sections.

## UIC-DISCLOSURE-1 - Disclosure

### UIC-DISCLOSURE-1.1 - Parts

`Disclosure` shall render a `ui-disclosure` element. Given a `title`, it holds a `ui-disclosure__heading` heading around the `ui-disclosure__trigger` button, which holds the `ui-disclosure__indicator` glyph and the title in a `ui-disclosure__title` element, followed by a `ui-disclosure__panel` holding its `children`. A `title` of `null` or `undefined` draws neither: the `children` are then the parts ([UIC-DISCLOSURE-2](#uic-disclosure-2---composed-disclosures)).

Implementation: `src/components/disclosure/disclosure.tsx`, `src/components/disclosure/disclosure-parts.tsx`
Verification: `src/components/disclosure/disclosure.test.tsx`, `e2e/disclosure.spec.ts`

### UIC-DISCLOSURE-1.2 - Expanding and collapsing

Pressing the trigger shall toggle the panel. The root publishes `data-expanded` while the panel shows. A collapsed panel stays mounted with `hidden="until-found"`, so its content keeps its state. The building block sets `--disclosure-panel-height` and `--disclosure-panel-width` on the panel (the measured size while it opens or closes, `auto` once open, `0px` once closed), so the stylesheet can animate the panel's size; React Aria waits for those animations before hiding the panel.

Implementation: `src/components/disclosure/disclosure.tsx`, `src/components/disclosure/disclosure-parts.tsx`, `labs/reference/disclosure.css`
Verification: `src/components/disclosure/disclosure.test.tsx`, `e2e/disclosure.spec.ts`

### UIC-DISCLOSURE-1.3 - Controlled and uncontrolled state

A disclosure shall start collapsed unless `defaultExpanded` is set. `isExpanded` controls the state, and `onExpandedChange` receives each requested state, also while controlled.

Implementation: `src/components/disclosure/disclosure.tsx`
Verification: `src/components/disclosure/disclosure.test.tsx`, `e2e/disclosure.spec.ts`

### UIC-DISCLOSURE-1.4 - Indicator position

`indicatorPosition` shall place the indicator glyph before the title (`start`, the default) or after it (`end`), in document order, and publish `data-indicator-position` on the root and on the trigger. A start indicator points to the inline end while collapsed (`chevron-right`, or `chevron-left` right to left) and down while expanded (`chevron-down`); an end indicator points down while collapsed (`chevron-down`) and up while expanded (`chevron-up`). The glyph is decorative and carries `data-glyph` with its name.

Implementation: `src/components/disclosure/disclosure-parts.tsx`, `src/components/expand-toggle/expand-toggle.tsx`, `labs/reference/disclosure.css`
Verification: `src/components/disclosure/disclosure.test.tsx`, `e2e/disclosure.spec.ts`

### UIC-DISCLOSURE-1.5 - Heading levels

The title's heading shall take `headingLevel` 1 to 6, by default the automatic level of [UIC-SECTION-HEADER-2.1](SECTION-HEADER.md#uic-section-header-21---automatic-heading-levels): one below the enclosing section, card or disclosure, else 3. The panel publishes the disclosure's level to its content, so a disclosure nested in a panel takes the next level.

Implementation: `src/components/disclosure/disclosure.tsx`, `src/components/disclosure/disclosure-parts.tsx`
Verification: `src/components/disclosure/disclosure.test.tsx`, `e2e/disclosure.spec.ts`

### UIC-DISCLOSURE-1.6 - Disabled

`isDisabled` shall disable the trigger, so it neither toggles nor takes focus, and publish `data-disabled` on the root and the trigger. The panel keeps its current state.

Implementation: `src/components/disclosure/disclosure.tsx`
Verification: `src/components/disclosure/disclosure.test.tsx`, `e2e/disclosure.spec.ts`

### UIC-DISCLOSURE-1.7 - Hooks and caller attributes

The disclosure parts shall carry the hooks below and append the caller's `className`. `Disclosure` forwards caller `data-*` attributes and `ref` to its root and takes `render`, typed `ElementRender<'div', DisclosureRenderState>` (`isExpanded`, `isFocusVisibleWithin`, `isDisabled`); its `id`, a `Key`, is its key in a group and stays off the element. `DisclosureGroup` forwards `id`, `ref` and caller `data-*` attributes to its root and takes `render`, typed `ElementRender<'div', DisclosureGroupRenderState>` (`isDisabled`). `DisclosureHeader`, `DisclosureTitle` (on its heading) and `DisclosurePanel` forward `id` and caller `data-*` attributes; caller attributes never replace a hook attribute.

Implementation: `src/components/disclosure/disclosure.tsx`, `src/components/disclosure/disclosure-parts.tsx`
Verification: `src/components/disclosure/disclosure.test.tsx`

## UIC-DISCLOSURE-2 - Composed disclosures

### UIC-DISCLOSURE-2.1 - Title and panel parts

Without `title`, a `DisclosureTitle` child shall draw the heading, trigger, indicator and title of [UIC-DISCLOSURE-1.1](#uic-disclosure-11---parts) with the disclosure's level and indicator position, and a `DisclosurePanel` child the panel, with its `role` (`group` by default, or `region`) and `render`, typed `ElementRender<'div', DisclosurePanelRenderState>` (`isFocusVisibleWithin`).

Implementation: `src/components/disclosure/disclosure-parts.tsx`
Verification: `src/components/disclosure/disclosure.test.tsx`, `e2e/disclosure.spec.ts`

### UIC-DISCLOSURE-2.2 - Header with actions

`DisclosureHeader` shall render a `ui-disclosure__header` element around a `DisclosureTitle` and the controls the caller puts beside it. Those controls stay outside the trigger: pressing them never toggles the disclosure, and they are not part of the trigger's name.

Implementation: `src/components/disclosure/disclosure-parts.tsx`, `labs/reference/disclosure.css`
Verification: `src/components/disclosure/disclosure.test.tsx`, `e2e/disclosure.spec.ts`

## UIC-DISCLOSURE-3 - Disclosure group

### UIC-DISCLOSURE-3.1 - Accordion

`DisclosureGroup` shall render a `ui-disclosure-group` element whose disclosures expand by their `id`: by default opening one closes the one open before, and `allowsMultipleExpanded` lets several stay open.

Implementation: `src/components/disclosure/disclosure.tsx`
Verification: `src/components/disclosure/disclosure.test.tsx`, `e2e/disclosure.spec.ts`

### UIC-DISCLOSURE-3.2 - Expanded keys

`expandedKeys` shall control which disclosures are open, `defaultExpandedKeys` start them, and `onExpandedChange` receive the requested set of keys (a `Set<Key>`) after each toggle. Keys are the disclosures' `id`s as given, of the type given: any `Key` names a disclosure, `0` and `''` included. A disclosure's own `isExpanded` and `defaultExpanded` give way to the group's keys.

Implementation: `src/components/disclosure/disclosure.tsx`
Verification: `src/components/disclosure/disclosure.test.tsx`, `e2e/disclosure.spec.ts`

### UIC-DISCLOSURE-3.3 - Disabled group

`isDisabled` on the group shall disable every disclosure in it as [UIC-DISCLOSURE-1.6](#uic-disclosure-16---disabled) does, and publish `data-disabled` on the group.

Implementation: `src/components/disclosure/disclosure.tsx`
Verification: `src/components/disclosure/disclosure.test.tsx`, `e2e/disclosure.spec.ts`

## UIC-DISCLOSURE-4 - Accessibility

### UIC-DISCLOSURE-4.1 - Roles and names

The trigger shall be a button inside the heading, named by the title, with `aria-expanded` and `aria-controls` naming the panel. The panel has `role="group"` (or the `role` given), is labelled by the trigger and is hidden from assistive technology while collapsed. The indicator is hidden from assistive technology.

Implementation: `src/components/disclosure/disclosure-parts.tsx`
Verification: `src/components/disclosure/disclosure.test.tsx`, `e2e/disclosure.spec.ts`

### UIC-DISCLOSURE-4.2 - Keyboard

Each enabled trigger shall be one tab stop, and Enter or Space toggles its disclosure. Inside a group, ArrowDown and ArrowUp move focus to the next and previous enabled trigger of the same group, wrapping at the ends, and Home and End to the first and last; triggers of groups nested in a panel and disabled triggers are skipped. A trigger outside a group ignores these keys.

Implementation: `src/components/disclosure/disclosure.tsx`, `src/components/disclosure/disclosure-parts.tsx`
Verification: `src/components/disclosure/disclosure.test.tsx`, `e2e/disclosure.spec.ts`

### UIC-DISCLOSURE-4.3 - Find in page

When the browser's find in page matches text in a collapsed panel, the disclosure shall expand (the `beforematch` event of `hidden="until-found"`), through the group's keys inside a group.

Implementation: `src/components/disclosure/disclosure.tsx`
Verification: `src/components/disclosure/disclosure.test.tsx`, `e2e/disclosure.spec.ts`

## Hooks

| Hook                        | Kind      | Values         | Description                                                       |
| --------------------------- | --------- | -------------- | ----------------------------------------------------------------- |
| `ui-disclosure`             | root      |                | A disclosure's `<div>` (React Aria `Disclosure`).                 |
| `ui-disclosure__header`     | slot      |                | A `DisclosureHeader`: the title and the controls beside it.       |
| `ui-disclosure__heading`    | slot      |                | The heading around the trigger.                                   |
| `ui-disclosure__trigger`    | slot      |                | The trigger button.                                               |
| `ui-disclosure__indicator`  | slot      |                | The indicator glyph (also `ui-glyph`).                            |
| `ui-disclosure__title`      | slot      |                | The title inside the trigger.                                     |
| `ui-disclosure__panel`      | slot      |                | The panel (React Aria `DisclosurePanel`).                         |
| `ui-disclosure-group`       | root      |                | A group's `<div>` (React Aria `DisclosureGroup`).                 |
| `data-indicator-position`   | attribute | `start`, `end` | On a disclosure and its trigger: where the indicator sits.        |
| `data-expanded`             | state     | `true`         | On a disclosure: the panel shows (React Aria).                    |
| `data-disabled`             | state     | `true`         | On a group, a disclosure and its trigger: disabled (React Aria).  |
| `data-focus-visible-within` | state     | `true`         | On a disclosure or its panel: keyboard focus inside (React Aria). |
| `data-hovered`              | state     | `true`         | On the trigger, while the pointer is over it (React Aria).        |
| `data-pressed`              | state     | `true`         | On the trigger, while pressed (React Aria).                       |
| `data-focused`              | state     | `true`         | On the trigger, while focused (React Aria).                       |
| `data-focus-visible`        | state     | `true`         | On the trigger, while focused by keyboard (React Aria).           |
