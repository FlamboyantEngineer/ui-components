# Facet List

`FacetList` shows the values of one facet of a collection, such as a status or a city, as checkboxes with the number of records holding each, for narrowing the collection by ticking values. Long facets fold past a limit behind a "show more" button, can be searched, and can list the ticked values first.

## UIC-FACET-LIST-1 - Facet list

### UIC-FACET-LIST-1.1 - Heading and values

`FacetList` shall render its `label` as a heading (`ui-facet-list__label`, role `heading` at the automatic level of [Section Header](SECTION-HEADER.md#uic-section-header-21---automatic-heading-levels)) that names a group of checkboxes (`ui-facet-list__options`, React Aria `CheckboxGroup`), one per option in order (`ui-facet-list__option`), each showing its label (`ui-facet-list__option-label`) and, when the option has a `count`, the count formatted for the locale (`ui-facet-list__count`). A disabled option cannot be ticked.

Implementation: `src/components/facet-list/facet-list.tsx`
Verification: `src/components/facet-list/facet-list.test.tsx`, `e2e/facet-list.spec.ts`

### UIC-FACET-LIST-1.2 - Ticked values

`value` with `onChange` shall control the ticked values and `defaultValue` start an uncontrolled list; `onChange` receives the ticked values in option order after each tick, followed by any ticked values no option shows, in their previous order, so a value whose option is gone for now stays ticked.

Implementation: `src/components/facet-list/facet-list.tsx`
Verification: `src/components/facet-list/facet-list.test.tsx`, `e2e/facet-list.spec.ts`

### UIC-FACET-LIST-1.3 - Search

A `filterable` list (by default, one with more than 10 options) shall start with a [Search Field](SEARCH-FIELD.md) (`ui-facet-list__search`) named by the provider string `filterLabel` from the label, which narrows the options to those whose label contains the query, ignoring case and composition as [Text Match](TEXT-MATCH.md) normalizes text, shows every match whatever the limit, and shows the provider string `noResults` (`ui-facet-list__empty`) when none matches. Ticked values hidden by the search stay ticked. The query narrows the options only while the field shows: when the list stops being filterable (its options shrink to 10 or fewer by default), every option shows again and folds as usual.

Implementation: `src/components/facet-list/facet-list.tsx`, `src/components/facet-list/facet-options.ts`
Verification: `src/components/facet-list/facet-list.test.tsx`, `src/components/facet-list/facet-options.test.ts`, `e2e/facet-list.spec.ts`

### UIC-FACET-LIST-1.4 - Folding

With more options than `limit` (5 by default) and no query, the list shall show the first `limit` options and end with a toggle (`ui-facet-list__toggle`, reporting `aria-expanded` and controlling the group) that reads the provider string `showMoreValues` with the number of hidden options, shows them all, publishes `data-expanded` on the root, and then reads `showLess` to fold them again.

Implementation: `src/components/facet-list/facet-list.tsx`, `src/components/facet-list/facet-options.ts`
Verification: `src/components/facet-list/facet-list.test.tsx`, `src/components/facet-list/facet-options.test.ts`, `e2e/facet-list.spec.ts`

### UIC-FACET-LIST-1.5 - Selected first

`selectedFirst` shall list the ticked values before the others, each part in option order. The order is taken when focus enters the list and held until focus leaves it, so ticking or clearing a value never moves it under the reader.

Implementation: `src/components/facet-list/facet-list.tsx`, `src/components/facet-list/facet-options.ts`
Verification: `src/components/facet-list/facet-list.test.tsx`, `src/components/facet-list/facet-options.test.ts`, `e2e/facet-list.spec.ts`

### UIC-FACET-LIST-1.6 - Hooks and caller attributes

The list shall carry the hooks below, append the caller's `className`, and forward `id` and caller `data-*` attributes to its root.

Implementation: `src/components/facet-list/facet-list.tsx`
Verification: `src/components/facet-list/facet-list.test.tsx`

## UIC-FACET-LIST-2 - Accessibility

### UIC-FACET-LIST-2.1 - Counts in the names

A checkbox whose option has a count shall be named by the provider string `labelWithCount` from the label and the formatted count (`Oslo, 96`), so the count is read with the value.

Implementation: `src/components/facet-list/facet-list.tsx`
Verification: `src/components/facet-list/facet-list.test.tsx`, `e2e/facet-list.spec.ts`

## Hooks

| Hook                          | Kind  | Values | Description                                           |
| ----------------------------- | ----- | ------ | ----------------------------------------------------- |
| `ui-facet-list`               | root  |        | The list.                                             |
| `ui-facet-list__label`        | slot  |        | The facet's heading.                                  |
| `ui-facet-list__search`       | slot  |        | The search field (also `ui-search-field`).            |
| `ui-facet-list__options`      | slot  |        | The group of checkboxes.                              |
| `ui-facet-list__option`       | slot  |        | One value's checkbox (also `ui-checkbox`).            |
| `ui-facet-list__option-label` | slot  |        | A value's label.                                      |
| `ui-facet-list__count`        | slot  |        | A value's formatted count.                            |
| `ui-facet-list__empty`        | slot  |        | What shows when the search matches no value.          |
| `ui-facet-list__toggle`       | slot  |        | The show more or show less button (also `ui-button`). |
| `data-expanded`               | state | `true` | Every value shows, past the limit.                    |
