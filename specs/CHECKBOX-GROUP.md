# Checkbox Group

`CheckboxGroup` is a [field](FIELD.md) for a list of values, drawn as a group of [checkboxes](CHECKBOX.md) on React Aria's `CheckboxGroup`. It takes the field's props (`FieldInputProps<string[]>`), so it has a group label and layout, a description, validation, dirty state and restore, undo and redo, and the field menu. Each option is a `Checkbox`; an optional parent box ticks or clears every option. A single true-or-false value is a [Boolean Field](BOOLEAN-FIELD.md).

## UIC-CHECKBOX-GROUP-1 - Contract

### UIC-CHECKBOX-GROUP-1.1 - Field control

`CheckboxGroup` shall render a `Field` around a React Aria checkbox group (`ui-checkbox-group__box`, role `group`, named by the field label), built with `useFieldControl`, holding one `Checkbox` per entry of `options`, in order, named by its `label`. Its root element is the field's root, which carries `ui-checkbox-group` beside `ui-field`. The value is the list of ticked values: a field given no value, committed value or default starts with none ticked, and Clear empties it. Toggling a box sets the new list and commits it. An option with `isDisabled` cannot be toggled.

Implementation: `src/components/checkbox-group/checkbox-group.tsx`, `labs/reference/checkbox-group.css`
Verification: `src/components/checkbox-group/checkbox-group.test.tsx`, `e2e/checkbox-group.spec.ts`

### UIC-CHECKBOX-GROUP-1.2 - Form value

With `name`, a form shall submit each ticked option's `value` under that name. React Aria's checkbox group props (`name`, `form`, `onFocus`, `onBlur` and the others) pass through.

Implementation: `src/components/checkbox-group/checkbox-group.tsx`
Verification: `src/components/checkbox-group/checkbox-group.test.tsx`

### UIC-CHECKBOX-GROUP-1.3 - Validation and accessibility

A required group with nothing ticked shall be invalid (UIC-FIELD-3.1). The group is described by the field's description, decoration and message; while invalid it and its boxes publish React Aria's `data-invalid` and the boxes report `aria-invalid`. The group carries no `aria-errormessage`, which its role does not take. The field's control reference is the first enabled option's input, so a restore, a form's submit validation and the native behavior's custom validity (UIC-FIELD-3.10) use it.

Implementation: `src/components/checkbox-group/checkbox-group.tsx`
Verification: `src/components/checkbox-group/checkbox-group.test.tsx`, `e2e/checkbox-group.spec.ts`

### UIC-CHECKBOX-GROUP-1.4 - Select all

With `selectAllLabel`, the group shall draw a parent `Checkbox` first (`ui-checkbox-group__select-all`), named by that label and outside the group's value: ticked while every enabled option is ticked, mixed while only some are, empty otherwise. Pressing it ticks every enabled option, or clears them all when all are ticked, keeping disabled options as they are, and commits. It follows the field's read-only and disabled states and is disabled when no option is enabled.

Implementation: `src/components/checkbox-group/checkbox-group.tsx`
Verification: `src/components/checkbox-group/checkbox-group.test.tsx`, `e2e/checkbox-group.spec.ts`

### UIC-CHECKBOX-GROUP-1.5 - Field behaviour

`CheckboxGroup` shall show each validation status, refuse toggles while read-only or disabled, show dirty state with a restore button, undo and redo with the field's chords from its boxes, and offer the field menu, whose Clear empties the list.

Implementation: `src/components/checkbox-group/checkbox-group.tsx`, `src/components/field/field.tsx`
Verification: `src/components/checkbox-group/checkbox-group.test.tsx`, `e2e/checkbox-group.spec.ts`

### UIC-CHECKBOX-GROUP-1.6 - Hooks and caller attributes

`CheckboxGroup` shall carry the hooks below on top of the field's and the checkboxes', append the caller's `className` to its root and forward caller `data-*` attributes to it. A caller `id` goes on the root, and the group's id derives from it (`<id>-control`).

Implementation: `src/components/checkbox-group/checkbox-group.tsx`
Verification: `src/components/checkbox-group/checkbox-group.test.tsx`

## Hooks

| Hook                            | Kind  | Values | Description                                   |
| ------------------------------- | ----- | ------ | --------------------------------------------- |
| `ui-checkbox-group`             | root  |        | The field's root (also `ui-field`).           |
| `ui-checkbox-group__box`        | slot  |        | The React Aria checkbox group (role `group`). |
| `ui-checkbox-group__select-all` | slot  |        | The parent box (also `ui-checkbox`).          |
| `data-invalid`                  | state | `true` | On the box: invalid (React Aria).             |
| `data-required`                 | state | `true` | On the box: a value is required (React Aria). |
| `data-readonly`                 | state | `true` | On the box: read-only (React Aria).           |
| `data-disabled`                 | state | `true` | On the box: disabled (React Aria).            |
