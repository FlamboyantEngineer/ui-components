# Field Row List

`FieldRowList` lays out an ordered list of rows whose fields the caller draws, such as a select and the numeric field it chooses, with an add button after the list and a remove button on each row. The caller owns the rows, gives each a stable `id` and applies every add and remove; the list numbers and names the rows, bounds their count by `minRows` and `maxRows`, moves focus after an edit and disables every field at once through its native fieldset. Use [Step List Editor](STEP-LIST-EDITOR.md) for rows of free text the editor itself inserts, moves and duplicates.

## UIC-FIELD-ROW-LIST-1 - Rows

### UIC-FIELD-ROW-LIST-1.1 - Numbered rows of caller fields

The list shall draw `rows` in order as an ordered list (`ui-field-row-list__rows`) of rows (`ui-field-row-list__row`, publishing the row's `id` as `data-key`). Each row draws its number (`ui-field-row-list__number`, from `formatOutlineNumber` of its position, so the first row is `1`, hidden from assistive technology), then a group (`ui-field-row-list__fields`) named by the provider string `fieldRowLabel` with the row's number, holding what `renderRow(row, { index, isDisabled })` returns. Rows are keyed by their `id`, so a row's fields keep their own state, such as focus or text being typed, while rows are added or removed around it.

Implementation: `src/components/field-row-list/field-row-list.tsx`, `labs/reference/field-row-list.css`
Verification: `src/components/field-row-list/field-row-list.test.tsx`, `e2e/field-row-list.spec.ts`

### UIC-FIELD-ROW-LIST-1.2 - No rows

While `rows` is empty, the list shall draw a small [Empty State](EMPTY-STATE.md) (`ui-field-row-list__empty`) reading the provider string `noFieldRows` in place of the list.

Implementation: `src/components/field-row-list/field-row-list.tsx`
Verification: `src/components/field-row-list/field-row-list.test.tsx`, `e2e/field-row-list.spec.ts`

### UIC-FIELD-ROW-LIST-1.3 - Fieldset, name and caller attributes

The list shall be a [Fieldset](FIELD.md#uic-field-10---fieldset) (`ui-fieldset`, `ui-field-row-list`) named by `legend`, drawn in its `<legend>`, else by `aria-label` or `aria-labelledby`, else by the provider string `fieldRows`. It appends the caller's `className` and forwards `id`, caller `data-*` attributes, the ARIA labelling attributes and `ref` to the `<fieldset>`.

Implementation: `src/components/field-row-list/field-row-list.tsx`, `src/components/field/fieldset.tsx`
Verification: `src/components/field-row-list/field-row-list.test.tsx`, `e2e/field-row-list.spec.ts`

## UIC-FIELD-ROW-LIST-2 - Adding and removing

### UIC-FIELD-ROW-LIST-2.1 - Caller-applied edits

The list shall never change `rows` itself: its add button calls `onAdd()` and a row's remove button calls `onRemove(id)` with the row's `id` as given, and the rows change only when the caller passes new ones. Without `onAdd` the list draws no add button, and without `onRemove` no remove buttons.

Implementation: `src/components/field-row-list/field-row-list.tsx`
Verification: `src/components/field-row-list/field-row-list.test.tsx`, `e2e/field-row-list.spec.ts`

### UIC-FIELD-ROW-LIST-2.2 - Add and remove buttons

The add button (`ui-field-row-list__add`, a [Button](BUTTON.md)) shall follow the list and read `addLabel`, else the provider string `addFieldRow`. Each row ends with a remove button (`ui-field-row-list__remove`, an icon [Button](BUTTON.md)) named by the provider string `removeFieldRow` with the row's number.

Implementation: `src/components/field-row-list/field-row-list.tsx`
Verification: `src/components/field-row-list/field-row-list.test.tsx`, `e2e/field-row-list.spec.ts`

### UIC-FIELD-ROW-LIST-2.3 - Row count bounds

While the list holds `maxRows` rows or more (no limit by default), the add button shall be disabled; while it holds `minRows` rows or fewer (0 by default), every remove button shall be disabled. Rows the caller passes beyond either bound are drawn as given.

Implementation: `src/components/field-row-list/field-row-list.tsx`
Verification: `src/components/field-row-list/field-row-list.test.tsx`, `e2e/field-row-list.spec.ts`

### UIC-FIELD-ROW-LIST-2.4 - Focus after an edit

Once the caller has applied an add, focus shall move to the first control the Tab key reaches in the new row's fields (a row whose `id` was not listed when the button was pressed). Once the caller has removed a row, focus shall move to the first such control of the row that took its place, else of the row before it, else to the add button. The move uses `useFocusRequest` ([UIC-STEP-LIST-EDITOR-4.2](STEP-LIST-EDITOR.md#uic-step-list-editor-42---focus-after-an-edit)): while the caller has not applied the edit, the request waits, and when it never does, focus stays where it is.

Implementation: `src/components/field-row-list/field-row-list.tsx`, `src/utils/use-focus-request.ts`
Verification: `src/components/field-row-list/field-row-list.test.tsx`, `e2e/field-row-list.spec.ts`

## UIC-FIELD-ROW-LIST-3 - Disabled

### UIC-FIELD-ROW-LIST-3.1 - Disabled list

`isDisabled` shall disable the fieldset natively and through the field scope ([UIC-FIELD-10.2](FIELD.md#uic-field-102---shared-disabled-state)), so the native controls and library fields the rows hold are disabled while still showing their values, disable the add and remove buttons, publish `data-disabled` on the list and pass `isDisabled: true` to `renderRow`, for controls that resolve their disabled state from props alone.

Implementation: `src/components/field-row-list/field-row-list.tsx`, `src/components/field/fieldset.tsx`
Verification: `src/components/field-row-list/field-row-list.test.tsx`, `e2e/field-row-list.spec.ts`

### UIC-FIELD-ROW-LIST-T1.1 - A row's choice switches its numeric field

In the lab's typed rows, choosing another kind in a row's select shall replace the row's numeric field with that kind's field, under its own label, unit and bounds, while the other rows keep their values; a value outside the chosen kind's bounds shows the caller's validation message, and adding rows up to the maximum disables the add button.

Implementation: `labs/src/field-row-list.lab.tsx`
Verification: `e2e/field-row-list.spec.ts`

## Hooks

| Hook                        | Kind  | Values | Description                                             |
| --------------------------- | ----- | ------ | ------------------------------------------------------- |
| `ui-field-row-list`         | root  |        | The list's `<fieldset>` (also `ui-fieldset`).           |
| `ui-field-row-list__rows`   | slot  |        | The ordered list of rows.                               |
| `ui-field-row-list__row`    | slot  |        | One row (`<li>`).                                       |
| `ui-field-row-list__number` | slot  |        | A row's number.                                         |
| `ui-field-row-list__fields` | slot  |        | The group of a row's caller fields.                     |
| `ui-field-row-list__remove` | slot  |        | A row's remove button (also `ui-button`).               |
| `ui-field-row-list__empty`  | slot  |        | What a list with no rows shows (also `ui-empty-state`). |
| `ui-field-row-list__add`    | slot  |        | The add button (also `ui-button`).                      |
| `data-disabled`             | state | `true` | On the list: it is disabled.                            |
| `data-key`                  | state |        | On a row: its `id`.                                     |
