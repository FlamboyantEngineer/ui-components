# Display Options

`DisplayOptions` is a button that opens a [Popover](POPOVER.md) of how a collection shows its rows: the property they are grouped by and the property and direction they are sorted by ([Select Field](SELECT-FIELD.md) and [Segmented Choice](SEGMENTED-CHOICE.md)), the properties shown and their order (a [List View](LIST-ROW.md) whose rows reorder by drag and drop, each with a [Checkbox](CHECKBOX.md) that shows or hides its property), and the row spacing. Its value is plain data that the caller applies to a table, a board or a timeline, and may store in a saved view ([View Switcher](VIEW-SWITCHER.md)).

## UIC-DISPLAY-OPTIONS-1 - Options

### UIC-DISPLAY-OPTIONS-1.1 - Button and popover

`DisplayOptions` shall render a `<span>` root (`ui-display-options`) holding a [Button](BUTTON.md) (`ui-display-options__trigger`) led by the `adjustments` glyph and reading `label`, else the provider's `display` string, which opens a [Popover](POPOVER.md) (`ui-display-options__popover`) below its end titled by the provider's `displayOptions` string. The popover holds, in order, the grouping, sorting, properties and density sections below.

Implementation: `src/components/display-options/display-options.tsx`, `src/core/view-strings.ts`
Verification: `src/components/display-options/display-options.test.tsx`, `e2e/display-options.spec.ts`

### UIC-DISPLAY-OPTIONS-1.2 - Value

The value (`{ groupBy, sort, properties, density }`: the grouping property's `id` or `null`, a `SortDescriptor` or `null`, the shown properties' `id`s in order, and a density) shall be controlled by `value` or start at `defaultValue`, else at every property shown in declared order, ungrouped, unsorted and at the `default` density; each change in the popover calls `onChange` with the whole new value.

Implementation: `src/components/display-options/display-options.tsx`, `src/components/display-options/display-options-model.ts`
Verification: `src/components/display-options/display-options.test.tsx`

### UIC-DISPLAY-OPTIONS-1.3 - Grouping

When some property has `allowsGrouping`, the popover shall start with a [Select Field](SELECT-FIELD.md) (`ui-display-options__group-by`) labelled by the provider's `groupBy` string offering the provider's `noGrouping` choice, which sets `groupBy` to `null`, then those properties; it shows no dirty state of its own, since each choice applies at once.

Implementation: `src/components/display-options/display-options-sections.tsx`, `src/core/view-strings.ts`
Verification: `src/components/display-options/display-options.test.tsx`, `e2e/display-options.spec.ts`

### UIC-DISPLAY-OPTIONS-1.4 - Sorting

When some property has `allowsSorting`, a sort group (`ui-display-options__sort`) shall follow with a Select Field (`ui-display-options__sort-by`) labelled by the provider's `sortBy` string offering `noSorting`, which sets `sort` to `null`, then those properties; choosing one sorts by it, keeping the direction, ascending at first. A small [Segmented Choice](SEGMENTED-CHOICE.md) (`ui-display-options__direction`) named by `sortDirection` offers the two directions with their `sort-ascending` and `sort-descending` glyphs and `sortDirectionName` labels; it is disabled while unsorted.

Implementation: `src/components/display-options/display-options-sections.tsx`, `src/core/view-strings.ts`
Verification: `src/components/display-options/display-options.test.tsx`, `e2e/display-options.spec.ts`

### UIC-DISPLAY-OPTIONS-1.5 - Shown properties

The properties section (`ui-display-options__properties`) shall hold a label (`ui-display-options__properties-label`) reading the provider's `shownProperties` string, which names a [List View](LIST-ROW.md) of every property (`ui-display-options__property`, publishing `data-shown` while shown): the shown ones in their order, then the hidden ones in declared order. Each row ends with a [Checkbox](CHECKBOX.md) (`ui-display-options__visibility`) named by the provider's `showProperty` string for the label and ticked while the property is shown; ticking it, or activating the row (a press or Enter), shows or hides the property, and a property shown again joins the shown ones where its row stands. The rows reorder one at a time by drag and drop, by pointer or from a row's drag handle by keyboard, and a move changes the order of the shown properties (hidden ones keep their declared order). A shown `id` no property names is dropped from the list.

Implementation: `src/components/display-options/display-options-sections.tsx`, `src/components/display-options/display-options-model.ts`, `src/core/view-strings.ts`
Verification: `src/components/display-options/display-options.test.tsx`, `e2e/display-options.spec.ts`

### UIC-DISPLAY-OPTIONS-1.6 - Density

With `densities` (from `compact`, `default` and `comfortable`), the popover shall end with a density group (`ui-display-options__density`) whose label (`ui-display-options__density-label`) reads the provider's `density` string and names a small [Segmented Choice](SEGMENTED-CHOICE.md) of those densities, labelled by `densityName`. Without them it offers no density.

Implementation: `src/components/display-options/display-options-sections.tsx`, `src/core/view-strings.ts`
Verification: `src/components/display-options/display-options.test.tsx`, `e2e/display-options.spec.ts`

### UIC-DISPLAY-OPTIONS-1.7 - Disabled

With `isDisabled`, the button shall be disabled and the root publish `data-disabled`.

Implementation: `src/components/display-options/display-options.tsx`
Verification: `src/components/display-options/display-options.test.tsx`

### UIC-DISPLAY-OPTIONS-1.8 - Hooks and caller attributes

`DisplayOptions` shall carry the hooks below, append the caller's `className`, and forward `id` and caller `data-*` attributes to its root.

Implementation: `src/components/display-options/display-options.tsx`
Verification: `src/components/display-options/display-options.test.tsx`

## UIC-DISPLAY-OPTIONS-2 - Accessibility

### UIC-DISPLAY-OPTIONS-2.1 - Names and focus

The button shall report the popover in `aria-expanded`; the popover is a dialog named by its title that takes focus when it opens, keeps Tab inside, closes on Escape and returns focus to the button ([Popover](POPOVER.md)). Each control is named by its label, and the properties list is one tab stop whose arrow keys move between rows, ArrowRight reaching a row's drag handle and checkbox.

Implementation: `src/components/display-options/display-options.tsx`, `src/components/display-options/display-options-sections.tsx`
Verification: `src/components/display-options/display-options.test.tsx`, `e2e/display-options.spec.ts`

## Hooks

| Hook                                   | Kind  | Values | Description                                           |
| -------------------------------------- | ----- | ------ | ----------------------------------------------------- |
| `ui-display-options`                   | root  |        | The display options (`<span>`).                       |
| `ui-display-options__trigger`          | slot  |        | The button that opens the popover (also `ui-button`). |
| `ui-display-options__popover`          | slot  |        | The popover (also `ui-popover`).                      |
| `ui-display-options__group-by`         | slot  |        | The grouping field (also `ui-select-field`).          |
| `ui-display-options__sort`             | slot  |        | The sorting field and direction.                      |
| `ui-display-options__sort-by`          | slot  |        | The sorting field (also `ui-select-field`).           |
| `ui-display-options__direction`        | slot  |        | The sort direction (also `ui-segmented-choice`).      |
| `ui-display-options__properties`       | slot  |        | The shown properties section.                         |
| `ui-display-options__properties-label` | slot  |        | The properties section's label.                       |
| `ui-display-options__property`         | slot  |        | One property's row (also `ui-list-view-item`).        |
| `ui-display-options__visibility`       | slot  |        | A property's show checkbox (also `ui-checkbox`).      |
| `ui-display-options__density`          | slot  |        | The density section.                                  |
| `ui-display-options__density-label`    | slot  |        | The density section's label.                          |
| `data-shown`                           | state | `true` | On a property's row: the property is shown.           |
| `data-disabled`                        | state | `true` | The button is disabled.                               |
