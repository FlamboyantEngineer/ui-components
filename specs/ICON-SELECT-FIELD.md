# Icon Select Field

`IconSelectField` is a single select over a short list of options that each lead with an icon, such as a choice of symbol or file type. It renders a [Select Field](SELECT-FIELD.md) and keeps its field behaviour, trigger, list and hooks; it only fixes single selection, requires an icon on every option, leaves filtering off unless asked and keeps a no-icon choice through `emptyLabel`.

## UIC-ICON-SELECT-FIELD-1 - Contract

### UIC-ICON-SELECT-FIELD-1.1 - Icon options

Every option of an `IconSelectField` shall carry an `icon` (a built-in glyph name or any icon node). The open list draws each option's icon before its label, and the trigger shows the chosen option's icon before its label. The field always chooses one value or none.

Implementation: `src/components/icon-select-field/icon-select-field.tsx`
Verification: `src/components/icon-select-field/icon-select-field.test.tsx`, `e2e/icon-select-field.spec.ts`

### UIC-ICON-SELECT-FIELD-1.2 - Filtering

An `IconSelectField` shall draw no filter input, however many options it has, unless `filterable` is set.

Implementation: `src/components/icon-select-field/icon-select-field.tsx`
Verification: `src/components/icon-select-field/icon-select-field.test.tsx`

### UIC-ICON-SELECT-FIELD-1.3 - No-icon choice

With `emptyLabel` (for example `No icon`), the list shall start with an option of that label that stands for no value: the trigger shows it while the value is `null`, and picking it commits `null`.

Implementation: `src/components/icon-select-field/icon-select-field.tsx`, `src/components/select-field/select-control.tsx`
Verification: `src/components/icon-select-field/icon-select-field.test.tsx`, `e2e/icon-select-field.spec.ts`

### UIC-ICON-SELECT-FIELD-1.4 - Hooks and caller attributes

The field root shall carry `ui-icon-select-field` beside the select field's hooks, followed by the caller's `className`; every other prop reaches the select field.

Implementation: `src/components/icon-select-field/icon-select-field.tsx`
Verification: `src/components/icon-select-field/icon-select-field.test.tsx`

## Hooks

| Hook                   | Kind | Values | Description                                             |
| ---------------------- | ---- | ------ | ------------------------------------------------------- |
| `ui-icon-select-field` | root |        | The field root (also `ui-field` and `ui-select-field`). |
