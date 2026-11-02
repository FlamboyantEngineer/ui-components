# Property Filter

`PropertyFilter` is a [Property Panel](PROPERTY-PANEL.md) whose header holds a search box that filters every section, group, card and row in it, through a [Property Scope](PROPERTY-SCOPE.md). It is meant for long panels of settings; searching a list, a tree or a table uses a search field on its own.

## UIC-PROPERTY-FILTER-1 - Contract

### UIC-PROPERTY-FILTER-1.1 - Panel and search box

`PropertyFilter` shall render a `PropertyPanel` named by its `aria-label`, whose header holds a [Search Field](SEARCH-FIELD.md) (`ui-property-filter__search`) named by the provider string `filterLabel` from that label (`Filter <label>` in lower case), with the `placeholder` in it. Typing filters the panel's children by the query as a `PropertyScope` does.

Implementation: `src/components/property-filter/property-filter.tsx`, `src/core/strings.ts`
Verification: `src/components/property-filter/property-filter.test.tsx`, `e2e/property-filter.spec.ts`

### UIC-PROPERTY-FILTER-1.2 - Clearing

While the query is not empty the search field's clear button shall follow the input; pressing it, or Escape in the input, empties the query and leaves focus in the input. The no-match message's clear button empties the query and moves focus to the input, so focus never falls to the page when the message goes away.

Implementation: `src/components/property-filter/property-filter.tsx`
Verification: `src/components/property-filter/property-filter.test.tsx`, `e2e/property-filter.spec.ts`

### UIC-PROPERTY-FILTER-1.3 - Hooks and caller attributes

The panel's root shall carry `ui-property-filter` beside the panel's hooks, append the caller's `className`, and take `id`, caller `data-*` attributes and `labelLayout` as a `PropertyPanel` does.

Implementation: `src/components/property-filter/property-filter.tsx`
Verification: `src/components/property-filter/property-filter.test.tsx`, `e2e/property-filter.spec.ts`

### UIC-PROPERTY-FILTER-1.4 - Controlled query and matching

`query` with `onQueryChange` shall control the search box's query, so a host can restore or link to a search, and `defaultQuery` start an uncontrolled one; `onQueryChange` reports every change, typing and clearing alike. `filter` shall pass to the scope ([UIC-PROPERTY-SCOPE-1.6](PROPERTY-SCOPE.md#uic-property-scope-16---custom-matching)).

Implementation: `src/components/property-filter/property-filter.tsx`
Verification: `src/components/property-filter/property-filter.test.tsx`, `e2e/property-filter.spec.ts`

## Hooks

| Hook                         | Kind | Values | Description                                                                     |
| ---------------------------- | ---- | ------ | ------------------------------------------------------------------------------- |
| `ui-property-filter`         | root |        | The panel's `<section>` (also `ui-property-panel`).                             |
| `ui-property-filter__search` | slot |        | The search field (also `ui-search-field`, with its slots and state attributes). |
