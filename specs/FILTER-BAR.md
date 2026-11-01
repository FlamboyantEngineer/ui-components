# Filter Bar

`FilterBar` narrows a collection by structured filters shown as a row of chips: each chip reads one condition (`Status is any of Open, In progress`) and opens an editor for it. An add menu lists the fields, each chip removes its filter, a clear button removes them all, and a free-text search can lead the row. The value is plain data, a list of `{ field, operator, value }` conditions; the host filters its records with it, or with `createFilterMatcher`. [Condition Builder](CONDITION-BUILDER.md) edits nested groups of the same conditions.

## UIC-FILTER-BAR-1 - Fields and conditions

### UIC-FILTER-BAR-1.1 - Field types and operators

A field (`{ id, label, type, operators?, options? }`) shall be of type `text`, `number`, `date`, `choice`, `person` or `boolean`, and offer the operators listed for it in `operators`, or else every operator of its type in this order: `text` contains, does not contain, is, is not, starts with, is empty, is not empty; `number` is, is not, is less than, is at most, is greater than, is at least, is between, is empty, is not empty; `date` is, is before, is after, is between, is empty, is not empty; `choice` and `person` is any of, is none of, is empty, is not empty; `boolean` is. Operators read through the provider string `filterOperator`.

Implementation: `src/components/filter-bar/filter-model.ts`, `src/core/strings/query.ts`
Verification: `src/components/filter-bar/filter-model.test.ts`, `src/components/filter-bar/filter-bar.test.tsx`

### UIC-FILTER-BAR-1.2 - Condition values

A condition's value shall take the shape its operator needs on its field's type: text for a `text` field, a number, a `{ min, max }` range for `number` with `between`, a `YYYY-MM-DD` date, a `{ start, end }` range of dates for `date` with `between`, a list of option values for `choice` and `person`, a boolean, and `null` for `empty` and `not-empty`. A new condition takes the field's first operator and an empty value of its shape (a boolean starts at `true`), a range or list of its own that no other condition shares; changing the operator keeps the value when the new operator takes the same shape and empties it otherwise. A condition is complete when its field offers its operator and it holds every value its operator needs (`isFilterConditionComplete`); a range needs both ends. A value of another shape, such as `null` for a list, a value saved in an older shape or one kept after the field's type or operators changed, leaves the condition incomplete, so it filters nothing; the editors (Filter Bar and Condition Builder) show it as that shape's empty value, a boolean as unanswered, and the first edit replaces it.

Implementation: `src/components/filter-bar/filter-model.ts`
Verification: `src/components/filter-bar/filter-model.test.ts`

### UIC-FILTER-BAR-1.3 - Controlled value

`value` with `onChange` shall control the conditions, and `defaultValue` start an uncontrolled list; `onChange` receives a new list after each change, conditions in the order they were added. Conditions on fields not in `fields` are kept in the value but draw no chip.

Implementation: `src/components/filter-bar/filter-bar.tsx`
Verification: `src/components/filter-bar/filter-bar.test.tsx`

## UIC-FILTER-BAR-2 - Chips and editor

### UIC-FILTER-BAR-2.1 - Chips

Each condition on a known field shall draw a chip (`ui-filter-bar__chip`, a list item publishing `data-field`) holding a button that reads the field's label, the operator and the value, each in its own slot; dates read in the locale's medium style, numbers in the locale's format, ranges through the provider string `filterRange`, option values by their labels and booleans through `valueTrue` and `valueFalse`. A condition missing its value reads only its field and operator and publishes `data-incomplete` on its chip.

Implementation: `src/components/filter-bar/filter-chip.tsx`, `src/components/filter-bar/filter-format.ts`, `src/core/strings/query.ts`
Verification: `src/components/filter-bar/filter-bar.test.tsx`, `src/components/filter-bar/filter-format.test.tsx`, `e2e/filter-bar.spec.ts`

### UIC-FILTER-BAR-2.2 - Editor

Pressing a chip's button shall open a [Popover](POPOVER.md) titled with the field's label (`ui-filter-bar__editor`, while the chip publishes `data-open`) holding a select of the field's operators (`ui-filter-bar__operator`, left out when the field offers one operator) and the value control the operator takes (`ui-filter-bar__value`): a text field, a number field, two number fields for a range, a date field, a date range field, a multiple select of the options for `choice`, a multiple [People Picker](PEOPLE-PICKER.md) of the options for `person`, searching their names for the typed text ignoring case and composition as [Text Match](TEXT-MATCH.md) normalizes text, which knows the chosen people from the options (UIC-PEOPLE-PICKER-3.5) so their chips read their names before any search, segmented true and false for `boolean`, and nothing for `empty` and `not-empty`. Each edit reports a new value at once, and the chip follows it. When a controlled host removes the open chip's condition, its editor is gone for good: a condition of the same field added later in the same place does not open its editor.

Implementation: `src/components/filter-bar/filter-chip.tsx`, `src/components/filter-bar/filter-editor.tsx`, `src/components/filter-bar/filter-bar.tsx`
Verification: `src/components/filter-bar/filter-bar.test.tsx`, `src/components/filter-bar/filter-editor.test.tsx`, `e2e/filter-bar.spec.ts`

### UIC-FILTER-BAR-2.3 - Adding

The add button (`ui-filter-bar__add`, a [Dropdown Menu](DROPDOWN-MENU.md) named by the provider string `addFilter`) shall list the fields in order, behind a search field once there are more than ten fields (`FILTERABLE_LIST_LENGTH`, shared with [Select Field](SELECT-FIELD.md) and [Facet List](FACET-LIST.md)). Choosing a field appends a new condition on it and opens that condition's editor; closing the editor keeps the condition, complete or not.

Implementation: `src/components/filter-bar/filter-bar.tsx`
Verification: `src/components/filter-bar/filter-bar.test.tsx`, `e2e/filter-bar.spec.ts`

### UIC-FILTER-BAR-2.4 - Removing and clearing

Each chip shall end with a remove button (`ui-filter-bar__chip-remove`) named by the provider string `removeFilter` with the chip's text, which removes its condition. While there is a condition, a clear button (`ui-filter-bar__clear`, the provider string `clearAllFilters`) removes every condition. Either moves focus to the add button, so focus never falls to the page.

Implementation: `src/components/filter-bar/filter-bar.tsx`, `src/components/filter-bar/filter-chip.tsx`
Verification: `src/components/filter-bar/filter-bar.test.tsx`, `e2e/filter-bar.spec.ts`

### UIC-FILTER-BAR-2.5 - Search slot

`search` shall render first in the bar, in a `ui-filter-bar__search` slot, for a free-text search such as a [Search Field](SEARCH-FIELD.md) that the caller controls.

Implementation: `src/components/filter-bar/filter-bar.tsx`
Verification: `src/components/filter-bar/filter-bar.test.tsx`, `e2e/filter-bar.spec.ts`

### UIC-FILTER-BAR-2.6 - Hooks and caller attributes

The bar shall carry the hooks below, publish `data-empty` while it holds no condition, append the caller's `className`, and forward `id`, caller `data-*` attributes and the ARIA labelling attributes to its root.

Implementation: `src/components/filter-bar/filter-bar.tsx`, `src/components/filter-bar/filter-bar-hooks.ts`
Verification: `src/components/filter-bar/filter-bar.test.tsx`

## UIC-FILTER-BAR-3 - Matching

### UIC-FILTER-BAR-3.1 - Matching one condition

`matchesFilterCondition(value, condition, field)` shall test a record's value for the field against a condition: text without case and as written, spaces included (contains, starts with, is), numbers by comparison or an inclusive range, dates by day (a `Date` in local time, read as a four-digit `YYYY-MM-DD` day in years 1 to 9999 and as no day outside them, or a text starting with `YYYY-MM-DD`) before, after, on or within an inclusive range, option values by membership, booleans by equality, and `empty` as `null`, `undefined`, an empty text or an empty list. A list value passes when one of its entries passes, and a negated operator (`not-contains`, `not-equals`, `none-of`) fails when one of its entries matches. A condition missing its value passes every record.

Implementation: `src/components/filter-bar/filter-matching.ts`
Verification: `src/components/filter-bar/filter-matching.test.ts`

### UIC-FILTER-BAR-3.2 - Matching a record

`createFilterMatcher({ conditions, fields, getValue })` shall return a test that a record passes when it passes every condition, reading each field's value with `getValue(record, fieldId)`; conditions on unknown fields are left out.

Implementation: `src/components/filter-bar/filter-matching.ts`
Verification: `src/components/filter-bar/filter-matching.test.ts`, `e2e/filter-bar.spec.ts`

## UIC-FILTER-BAR-4 - Accessibility

### UIC-FILTER-BAR-4.1 - Named group of chips

The bar shall be a group named by its `aria-label`, its `aria-labelledby`, or else the provider string `filters`; its chips are a list, each chip's button is named by its text and announces the popup it opens, and the editor is a dialog named by the field's label that takes focus on open and returns it on close.

Implementation: `src/components/filter-bar/filter-bar.tsx`, `src/components/filter-bar/filter-chip.tsx`
Verification: `src/components/filter-bar/filter-bar.test.tsx`, `e2e/filter-bar.spec.ts`

## Hooks

| Hook                           | Kind  | Values | Description                                                            |
| ------------------------------ | ----- | ------ | ---------------------------------------------------------------------- |
| `ui-filter-bar`                | root  |        | The bar's group.                                                       |
| `ui-filter-bar__search`        | slot  |        | Holds the caller's search.                                             |
| `ui-filter-bar__list`          | slot  |        | The list of chips.                                                     |
| `ui-filter-bar__chip`          | slot  |        | One chip, a list item.                                                 |
| `ui-filter-bar__chip-button`   | slot  |        | The chip's button that opens its editor (also `ui-button`).            |
| `ui-filter-bar__chip-field`    | slot  |        | The field's label in the chip.                                         |
| `ui-filter-bar__chip-operator` | slot  |        | The operator in the chip.                                              |
| `ui-filter-bar__chip-value`    | slot  |        | The value in the chip, while the condition has one.                    |
| `ui-filter-bar__chip-remove`   | slot  |        | The chip's remove button (also `ui-button`).                           |
| `ui-filter-bar__editor`        | slot  |        | The editor popover (also `ui-popover`).                                |
| `ui-filter-bar__operator`      | slot  |        | The operator select in the editor (also `ui-select-field`).            |
| `ui-filter-bar__value`         | slot  |        | The value control in the editor, or the group of a range's two fields. |
| `ui-filter-bar__add`           | slot  |        | The add menu's button (also `ui-dropdown-menu`).                       |
| `ui-filter-bar__clear`         | slot  |        | The clear button (also `ui-button`).                                   |
| `data-empty`                   | state | `true` | On the root: no condition.                                             |
| `data-field`                   | state |        | On a chip: its field's id.                                             |
| `data-incomplete`              | state | `true` | On a chip: its condition is missing its value.                         |
| `data-open`                    | state | `true` | On a chip: its editor is open.                                         |
