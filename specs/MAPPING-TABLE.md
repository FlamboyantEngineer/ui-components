# Mapping Table

`MappingTable` maps the columns of imported data, such as the columns of a spreadsheet, to the fields they are imported into. Each source column is a row with its name, a few sample values and a choice of target field, with a "Don't import" choice. The caller's suggestion function proposes targets, required targets must be mapped before the mapping is complete, a target chosen for several columns warns on each, and a summary counts what is mapped. The mapping is plain data, and `summarizeMapping` reads the same counts and problems for the caller, for example to enable a wizard's next step.

## UIC-MAPPING-TABLE-1 - Rows and value

### UIC-MAPPING-TABLE-1.1 - One row per source column

The table shall draw a native `<table>` (`ui-mapping-table__table`) headed by the provider strings `sourceColumn`, `sampleValues` and `importAs`, with one row per entry of `columns` (`ui-mapping-table__row`, publishing the column's `id` as `data-key`), in order. A row holds the column's `label` as its row header (`ui-mapping-table__column`), its `samples` (`ui-mapping-table__samples`, one `ui-mapping-table__sample` each) and a single [Select Field](SELECT-FIELD.md) (`ui-mapping-table__select` in the `ui-mapping-table__target` cell) named by the provider string `importColumnAs` with the column's label. The select lists the `targets` in order, each required one described by the provider string `requiredTarget`, after a first option reading the provider string `doNotImport` that chooses no target; the trigger reads `doNotImport` while nothing is chosen. A row publishes `data-mapped` while its column maps to a target.

Implementation: `src/components/mapping-table/mapping-table.tsx`, `labs/reference/mapping-table.css`
Verification: `src/components/mapping-table/mapping-table.test.tsx`, `e2e/mapping-table.spec.ts`

### UIC-MAPPING-TABLE-1.2 - Plain mapping value

The value shall be a record from column ids to target ids, where `null` or a missing column means the column is not imported and an id that is not among `targets` reads as not imported. `value` with `onChange` controls the mapping and `defaultValue` starts an uncontrolled one; each choice calls `onChange` with a new record holding every earlier entry and the changed column's target, `null` for "Don't import".

Implementation: `src/components/mapping-table/mapping-table.tsx`, `src/components/mapping-table/mapping.ts`
Verification: `src/components/mapping-table/mapping-table.test.tsx`, `src/components/mapping-table/mapping.test.ts`, `e2e/mapping-table.spec.ts`

### UIC-MAPPING-TABLE-1.3 - Suggestions

`getSuggestion(column, targets)` shall propose a target id for a column, or `null`. `suggestMapping(columns, targets, getSuggestion)` returns the mapping the suggestions make, ignoring ids that are not among `targets`, and an uncontrolled table without `defaultValue` starts from it. A row whose chosen target is its column's suggestion publishes `data-suggested` and shows a small [Badge](BADGE.md) (`ui-mapping-table__suggested`) reading the provider string `suggestedTarget`; choosing another target removes the mark.

Implementation: `src/components/mapping-table/mapping-table.tsx`, `src/components/mapping-table/mapping.ts`
Verification: `src/components/mapping-table/mapping-table.test.tsx`, `src/components/mapping-table/mapping.test.ts`, `e2e/mapping-table.spec.ts`

### UIC-MAPPING-TABLE-1.4 - Read-only

`isReadOnly` shall draw every select read-only, so the mapping shows without changing.

Implementation: `src/components/mapping-table/mapping-table.tsx`
Verification: `src/components/mapping-table/mapping-table.test.tsx`

### UIC-MAPPING-TABLE-1.5 - Any string id

Column and target ids shall be any unique strings, including names such as `constructor`, `__proto__` and `toString`: the table reads only the entries the mapping value and the summary hold themselves, never ones an object inherits, so such an id maps, warns as a duplicate and stops warning like any other. `summarizeMapping` returns `duplicates` as an object that inherits nothing.

Implementation: `src/components/mapping-table/mapping.ts`, `src/components/mapping-table/mapping-table.tsx`, `src/utils/read-own.ts`
Verification: `src/components/mapping-table/mapping-table.test.tsx`, `src/utils/read-own.test.ts`

## UIC-MAPPING-TABLE-2 - Checks and summary

### UIC-MAPPING-TABLE-2.1 - Summary

After the table, a polite status (`ui-mapping-table__summary`) shall count the mapped columns with the provider string `mappedColumns` and, when some are not imported, the skipped ones with `skippedColumns`, joined in one line by the `countsSummary` string (`ui-mapping-table__counts`, `3 of 5 columns mapped · 1 not imported`).

Implementation: `src/components/mapping-table/mapping-table.tsx`, `src/components/mapping-table/mapping.ts`
Verification: `src/components/mapping-table/mapping-table.test.tsx`, `e2e/mapping-table.spec.ts`

### UIC-MAPPING-TABLE-2.2 - Required targets

While a target with `isRequired` has no column mapped to it, the summary shall add a line (`ui-mapping-table__problem`) naming those targets in target order with the provider string `unmappedRequiredTargets`; once every required target is mapped the table publishes `data-complete`.

Implementation: `src/components/mapping-table/mapping-table.tsx`, `src/components/mapping-table/mapping.ts`
Verification: `src/components/mapping-table/mapping-table.test.tsx`, `src/components/mapping-table/mapping.test.ts`, `e2e/mapping-table.spec.ts`

### UIC-MAPPING-TABLE-2.3 - Duplicate targets

When several columns map to one target, each of their rows shall publish `data-duplicate` and its select shows a warning, the provider string `duplicateTarget` naming the target and the other columns; a duplicate warns without making the mapping incomplete.

Implementation: `src/components/mapping-table/mapping-table.tsx`, `src/components/mapping-table/mapping.ts`
Verification: `src/components/mapping-table/mapping-table.test.tsx`, `src/components/mapping-table/mapping.test.ts`, `e2e/mapping-table.spec.ts`

### UIC-MAPPING-TABLE-2.4 - Summary as data

`summarizeMapping(columns, targets, value)` shall return `mappedCount`, `skippedCount`, `unmappedRequired` (the ids of the required targets no column maps to, in target order), `duplicates` (for each target more than one column maps to, those columns' ids in column order) and `isComplete` (no required target unmapped), the same reading the table shows.

Implementation: `src/components/mapping-table/mapping.ts`
Verification: `src/components/mapping-table/mapping.test.ts`

## UIC-MAPPING-TABLE-3 - Accessibility

### UIC-MAPPING-TABLE-3.1 - Names and announcements

The table shall be a group named by `aria-label` or `aria-labelledby`, else by the provider string `columnMapping`. Column headers are `<th scope="col">` and each column's name a `<th scope="row">`, every select is named after its column, and the summary is a polite live region, so changes to the counts and problems are announced.

Implementation: `src/components/mapping-table/mapping-table.tsx`
Verification: `src/components/mapping-table/mapping-table.test.tsx`, `e2e/mapping-table.spec.ts`

## Hooks

| Hook                          | Kind  | Values | Description                                             |
| ----------------------------- | ----- | ------ | ------------------------------------------------------- |
| `ui-mapping-table`            | root  |        | The table's group.                                      |
| `ui-mapping-table__table`     | slot  |        | The `<table>`.                                          |
| `ui-mapping-table__row`       | slot  |        | One source column's row.                                |
| `ui-mapping-table__column`    | slot  |        | The column's name, the row header.                      |
| `ui-mapping-table__samples`   | slot  |        | The cell of the column's sample values.                 |
| `ui-mapping-table__sample`    | slot  |        | One sample value.                                       |
| `ui-mapping-table__target`    | slot  |        | The cell of the target choice.                          |
| `ui-mapping-table__select`    | slot  |        | The target select (also `ui-select-field`).             |
| `ui-mapping-table__suggested` | slot  |        | The mark of a suggested choice (also `ui-badge`).       |
| `ui-mapping-table__summary`   | slot  |        | The status after the table.                             |
| `ui-mapping-table__counts`    | slot  |        | The line counting mapped and skipped columns.           |
| `ui-mapping-table__problem`   | slot  |        | The line naming the required targets left unmapped.     |
| `data-complete`               | state | `true` | On the table: every required target is mapped.          |
| `data-key`                    | state |        | On a row: its column's `id`.                            |
| `data-mapped`                 | state | `true` | On a row: its column maps to a target.                  |
| `data-suggested`              | state | `true` | On a row: the chosen target is the column's suggestion. |
| `data-duplicate`              | state | `true` | On a row: other columns map to the same target.         |
