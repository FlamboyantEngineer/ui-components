# Outline

`Outline` lists a document's headings as a navigation landmark of nested links, for a long document, a specification or a help page. It marks the heading being read, either from the caller or by following the scroll of the viewport that holds the document ([`useScrollSpy`](SCROLL-REGION.md#uic-scroll-region-45---scroll-spy)); following an entry scrolls its heading into view; sections collapse and expand; and entries can carry their outline numbers ([`formatOutlineNumber`](OUTLINE-NUMBER.md)). Headings are plain data in document order (`id`, `label`, `level`); the outline nests them itself.

## UIC-OUTLINE-1 - Structure

### UIC-OUTLINE-1.1 - Navigation landmark

`Outline` shall render a `<nav>` named by `aria-label`, by `aria-labelledby`, or else by the provider's `outline` string. It holds an ordered list (`ui-outline__list`, `<ol>`) of the top entries; each entry is a `ui-outline__item` `<li>` publishing its heading's level in `data-level`, whose `ui-outline__row` holds a link (`ui-outline__link`, `<a href="#id">`) to the heading, with the heading's `label` in `ui-outline__label`, followed by the list of its own entries, if any.

Implementation: `src/components/outline/outline.tsx`, `src/core/strings/content.ts`
Verification: `src/components/outline/outline.test.tsx`, `e2e/outline.spec.ts`

### UIC-OUTLINE-1.2 - Nesting

Each heading shall nest under the nearest heading before it with a lower level, so a skipped level nests one step deeper, and a heading with no lower-level heading before it is a top entry.

Implementation: `src/components/outline/outline-tree.ts`
Verification: `src/components/outline/outline.test.tsx`

### UIC-OUTLINE-1.3 - Numbering

`isNumbered` shall publish `data-numbered` and start each link with the entry's number in `ui-outline__number`, written by `formatOutlineNumber` from the entry's position among its siblings at each depth, with `numberOptions` (styles, start, separator), and separated from the label by a space, so the number is part of the link's name.

Implementation: `src/components/outline/outline.tsx`, `src/utils/outline-number.ts`
Verification: `src/components/outline/outline.test.tsx`, `e2e/outline.spec.ts`

### UIC-OUTLINE-1.4 - Loading and empty

`isPending` shall set `aria-busy="true"` and `data-pending` on the outline. An outline without headings shows a small [Empty State](EMPTY-STATE.md) (also `ui-outline__empty`): a loading one reading the provider's `loading` string while pending, else `emptyMessage`, and nothing without it.

Implementation: `src/components/outline/outline.tsx`
Verification: `src/components/outline/outline.test.tsx`, `e2e/outline.spec.ts`

## UIC-OUTLINE-2 - Current heading

### UIC-OUTLINE-2.1 - Marking the current heading

The current heading's link shall carry `aria-current="location"` and its item `data-current`; the items of the entries it nests under publish `data-current-within`, so a collapsed section still shows that it holds the reader's place. `currentKey` sets the current heading; `null` marks none.

Implementation: `src/components/outline/outline.tsx`
Verification: `src/components/outline/outline.test.tsx`, `e2e/outline.spec.ts`

### UIC-OUTLINE-2.2 - Scroll tracking

When `currentKey` is not given, `viewportRef`, the scrolling element that holds the headings, shall make the current heading the one `useScrollSpy` reports over every heading's id: the last whose top has reached `trackingOffset` pixels (0 by default) below the viewport's top, the first before any has, and the last at the end. It updates as the viewport scrolls or resizes. Without either prop no heading is current.

Implementation: `src/components/outline/outline.tsx`, `src/components/scroll-region/use-scroll-spy.ts`
Verification: `src/components/outline/outline.test.tsx`, `e2e/outline.spec.ts`

## UIC-OUTLINE-3 - Navigation

### UIC-OUTLINE-3.1 - Following an entry

Following an entry's link with a plain primary click or Enter shall call `onNavigate(id)`, then scroll the document element with that id into view (`scrollIntoView({ block: 'start' })`) and, when the element has a `tabindex`, move focus to it without scrolling again, instead of the browser's fragment navigation; the address does not change. A click with a modifier key or another button keeps the browser's behaviour (a new tab, a copied address), as does a click a handler already prevented.

Implementation: `src/components/outline/outline.tsx`
Verification: `src/components/outline/outline.test.tsx`, `e2e/outline.spec.ts`

## UIC-OUTLINE-4 - Collapse

### UIC-OUTLINE-4.1 - Section toggles

When any entry has entries under it, each row shall start with an extra-small [Expand Toggle](EXPAND-TOGGLE.md): entries with children get a toggle named by the provider's `sectionsIn` string for their label (`Sections in Design`), reporting `aria-expanded` and controlling their list (`aria-controls`), which is `hidden` while collapsed; other entries get the toggle's empty placeholder, so labels stay aligned. An expanded entry's item publishes `data-expanded`. An outline with no nesting draws no toggles.

Implementation: `src/components/outline/outline.tsx`, `src/core/strings/content.ts`
Verification: `src/components/outline/outline.test.tsx`, `e2e/outline.spec.ts`

### UIC-OUTLINE-4.2 - Expanded entries

Every entry with children shall start expanded, unless `collapseBelowLevel` collapses those whose heading level is that level or deeper, or `defaultExpandedKeys` lists the ids to expand at first. A level rule also applies to headings that arrive later, until the reader toggles them. `expandedKeys` controls the expanded entries, and `onExpandedChange` receives the ids of every expanded entry after each toggle.

Implementation: `src/components/outline/use-outline-expansion.ts`
Verification: `src/components/outline/outline.test.tsx`, `e2e/outline.spec.ts`

## UIC-OUTLINE-5 - Accessibility and hooks

### UIC-OUTLINE-5.1 - Keyboard and reading order

Each visible link and toggle shall be one tab stop in document order: a toggle before its link. Enter follows a link; Enter and Space press a toggle. Entries of a collapsed section are out of the tab order and the accessibility tree.

Implementation: `src/components/outline/outline.tsx`
Verification: `src/components/outline/outline.test.tsx`, `e2e/outline.spec.ts`

### UIC-OUTLINE-5.2 - Hooks and caller attributes

`Outline` shall carry the hooks below, append the caller's `className`, and forward `id`, caller `data-*` attributes and the ARIA labelling attributes to its `<nav>`.

Implementation: `src/components/outline/outline.tsx`
Verification: `src/components/outline/outline.test.tsx`

## Hooks

| Hook                  | Kind      | Values | Description                                              |
| --------------------- | --------- | ------ | -------------------------------------------------------- |
| `ui-outline`          | root      |        | The navigation landmark (`<nav>`).                       |
| `ui-outline__empty`   | slot      |        | The loading or empty notice (also `ui-empty-state`).     |
| `ui-outline__list`    | slot      |        | A list of entries (`<ol>`): the top one, or a section's. |
| `ui-outline__item`    | slot      |        | One entry (`<li>`): its row, then its section's list.    |
| `ui-outline__row`     | slot      |        | The entry's toggle and link.                             |
| `ui-outline__link`    | slot      |        | The link to the heading (`<a>`).                         |
| `ui-outline__number`  | slot      |        | The entry's outline number, with `isNumbered`.           |
| `ui-outline__label`   | slot      |        | The heading's text.                                      |
| `data-numbered`       | attribute | `true` | On the root: entries carry their numbers.                |
| `data-pending`        | state     | `true` | On the root: headings are loading.                       |
| `data-level`          | state     |        | On an item: the heading's level.                         |
| `data-current`        | state     | `true` | On an item: its heading is the current one.              |
| `data-current-within` | state     | `true` | On an item: the current heading is in its section.       |
| `data-expanded`       | state     | `true` | On an item: its section is expanded.                     |
