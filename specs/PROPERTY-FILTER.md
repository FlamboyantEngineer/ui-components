# Property Filter

`PropertyFilter` is a [Property Panel](PROPERTY-PANEL.md) whose header holds a search box that filters every section, group, card and row in it, through a [Property Scope](PROPERTY-SCOPE.md). It is meant for long panels of settings; searching a list, a tree or a table uses a search field on its own.

## UIC-PROPERTY-FILTER-1 - Contract

### UIC-PROPERTY-FILTER-1.1 - Panel and search box

`PropertyFilter` shall render a `PropertyPanel` named by its `aria-label`, whose header holds a React Aria `SearchField` (`ui-property-filter__search`) named by the provider string `filterLabel` from that label (`Filter <label>` in lower case), with a decorative search glyph before the input and the `placeholder` in it. Typing filters the panel's children by the query as a `PropertyScope` does.

Implementation: `src/components/property-filter/property-filter.tsx`, `src/core/strings.ts`
Verification: `src/components/property-filter/property-filter.test.tsx`, `e2e/property-filter.spec.ts`

### UIC-PROPERTY-FILTER-1.2 - Clearing

While the query is not empty a clear button (`ui-property-filter__clear`, an `IconButton` with the `close` glyph named by the provider string `clear`) shall follow the input; pressing it, or Escape in the input, empties the query and leaves focus in the input. The no-match message's clear button empties the query and moves focus to the input, so focus never falls to the page when the message goes away.

Implementation: `src/components/property-filter/property-filter.tsx`
Verification: `src/components/property-filter/property-filter.test.tsx`, `e2e/property-filter.spec.ts`

### UIC-PROPERTY-FILTER-1.3 - Hooks and caller attributes

The panel's root shall carry `ui-property-filter` beside the panel's hooks, append the caller's `className`, and take `id`, caller `data-*` attributes and `labelLayout` as a `PropertyPanel` does.

Implementation: `src/components/property-filter/property-filter.tsx`
Verification: `src/components/property-filter/property-filter.test.tsx`

## Hooks

| Hook                         | Kind  | Values | Description                                           |
| ---------------------------- | ----- | ------ | ----------------------------------------------------- |
| `ui-property-filter`         | root  |        | The panel's `<section>` (also `ui-property-panel`).   |
| `ui-property-filter__search` | slot  |        | The search field.                                     |
| `ui-property-filter__icon`   | slot  |        | The search glyph (also `ui-glyph`).                   |
| `ui-property-filter__input`  | slot  |        | The search input.                                     |
| `ui-property-filter__clear`  | slot  |        | The clear button (also `ui-icon-button`).             |
| `data-empty`                 | state | `true` | On the search field: the query is empty (React Aria). |
| `data-hovered`               | state | `true` | On the input: pointer over it (React Aria).           |
| `data-focused`               | state | `true` | On the input: focused (React Aria).                   |
| `data-focus-visible`         | state | `true` | On the input: keyboard focus (React Aria).            |
