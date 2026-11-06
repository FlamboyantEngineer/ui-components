# Decimal Field

`DecimalField` is a [field](FIELD.md) for an exact decimal number held as a string, such as `"9007199254740993"` or `"-0.125"`, for quantities that must not pass through a JavaScript number. It is a spinbutton on React Aria's `TextField` and takes the field's props (`FieldInputProps<string | null>`), so it has a label and layout, validation, dirty state and restore, undo and redo, and the field menu. It reads and writes the locale's separators and digits, and steps, bounds, rounds and validates with exact decimal arithmetic on whole numbers of any size. A [Number Field](NUMBER-FIELD.md) edits a plain `number`, and an [Expression Field](EXPRESSION-FIELD.md) keeps authored text exactly as typed without reading it.

## UIC-DECIMAL-FIELD-1 - Value

### UIC-DECIMAL-FIELD-1.1 - Field control

`DecimalField` shall render a `Field` around a text field element (`ui-decimal-field__box`) holding a group (`ui-decimal-field__group`) with a decrement button, the input (`ui-decimal-field__input`) and an increment button. Its root is the field's root, which carries `ui-decimal-field` beside `ui-field`. The value is a decimal string or `null` for an empty field, which a field given no value, committed value or default starts with and Clear sets. The value, default, committed value, `onChange` and `onCommit` all take and give `string | null`.

Implementation: `src/components/decimal-field/decimal-field.tsx`
Verification: `src/components/decimal-field/decimal-field.test.tsx`, `e2e/decimal-field.spec.ts`

### UIC-DECIMAL-FIELD-1.2 - Canonical decimals

A canonical decimal shall be an optional `-`, the whole digits without leading zeros and, when the value has a fraction, a `.` and its digits without trailing zeros, with no exponent and no `-0` (`0`, `-12.5`, `9007199254740993`). Every value the field sets (from typing, stepping, snapping and rounding) is canonical, and `toCanonicalDecimal(text)` gives the canonical form of any plain decimal text (`+1.50` reads `1.5`) or `null` for other text. A value the host gives is kept as given: a non-canonical decimal (`1.50`) shows and validates as its decimal and is never rewritten until the reader edits or steps it, and text that is no decimal shows as given and reports `decimalUnreadable` with the validity `badInput`. The field never converts a value through `Number` or `parseFloat`: `9007199254740993` and a value with more fraction digits than a number holds round-trip unchanged through typing, `onChange`, `onCommit`, controlled updates and the submitted form value.

Implementation: `src/components/decimal-field/decimal.ts`, `src/components/decimal-field/decimal-field.tsx`
Verification: `src/components/decimal-field/decimal.test.ts`, `src/components/decimal-field/decimal-field.test.tsx`, `e2e/decimal-field.spec.ts`

### UIC-DECIMAL-FIELD-1.3 - Locale text

The input shall show the value in the `UiProvider` locale: the whole part as `Intl.NumberFormat` writes that exact integer (its sign and, with `formatOptions.useGrouping`, `true` by default, its grouping), then the locale's decimal separator and every fraction digit in the locale's digits, padded with zeros to `formatOptions.minimumFractionDigits`. Nothing is rounded for display. Reading the reader's text skips group separators and spaces, reads the locale's digits and minus signs (`−` included) as their ASCII forms and the locale's decimal separator as the decimal point; where the locale does not group with `.`, a `.` reads as the decimal point too, so a pasted `1.5` reads in `fr-FR`. Empty text is an empty value. The input's `inputMode` is `decimal`.

Implementation: `src/components/decimal-field/decimal-locale.ts`
Verification: `src/components/decimal-field/decimal-locale.test.ts`, `src/components/decimal-field/decimal-field.test.tsx`, `e2e/decimal-field.spec.ts`

### UIC-DECIMAL-FIELD-1.4 - Draft and commit

Typing shall change the input's text only: the draft stays apart from the value, which changes when Enter, Tab or focus leaving the field reads the draft, and Enter and leaving the field commit (UIC-FIELD-1.11). A draft that spells a decimal becomes the value, rounded and snapped (UIC-DECIMAL-FIELD-2); a draft that spells none stays in the input and reports `decimalUnreadable` (validity `badInput`) until the reader corrects it, and the value keeps its last decimal. Leaving a field the reader did not edit changes nothing. An Enter that belongs to an input method composition is the input method's. A new controlled value, a restore, undo or the field menu replaces the draft with the value's text.

Implementation: `src/components/decimal-field/decimal-field.tsx`
Verification: `src/components/decimal-field/decimal-field.test.tsx`, `e2e/decimal-field.spec.ts`

### UIC-DECIMAL-FIELD-1.5 - Form value

With `name`, the field shall submit its value through a hidden input as the value text (canonical whenever the field set it), and an empty value as an empty string; the visible input has no name. A disabled field submits nothing. A native form reset puts back the value the field had when it mounted, as for every field.

Implementation: `src/components/decimal-field/decimal-field.tsx`
Verification: `src/components/decimal-field/decimal-field.test.tsx`

## UIC-DECIMAL-FIELD-2 - Exact rules

### UIC-DECIMAL-FIELD-2.1 - Bounds and step

`minValue`, `maxValue` and `step` shall be decimal strings. With `step`, values lie on a step grid that counts from `minValue`, or `0` without one; without `step` there is no grid, values only keep within the bounds, and the arrows and buttons add or subtract `1`. Every comparison and step is exact: steps of `0.1` from `0` reach `0.3`, never `0.30000000000000004`.

Implementation: `src/components/decimal-field/decimal.ts`, `src/components/decimal-field/decimal-field.tsx`
Verification: `src/components/decimal-field/decimal.test.ts`, `src/components/decimal-field/decimal-field.test.tsx`

### UIC-DECIMAL-FIELD-2.2 - Scale and rounding

`scale` shall be the number of fraction digits the value keeps at most. A typed or stepped value with more is rounded to `scale` digits by `roundingMode`: `halfExpand` (the default) rounds half away from zero, `halfEven` rounds half to the even digit and `trunc` drops the extra digits. Without `scale` the field keeps every typed fraction digit.

Implementation: `src/components/decimal-field/decimal.ts`, `src/components/decimal-field/decimal-field.tsx`
Verification: `src/components/decimal-field/decimal.test.ts`, `src/components/decimal-field/decimal-field.test.tsx`

### UIC-DECIMAL-FIELD-2.3 - Commit behavior

`commitBehavior` shall say what reading the draft does with a value outside the rules: `snap` (the default) clamps it into the range and, with a `step`, moves it to the nearest step (half a step away from the origin), so a range end off the grid stops at the last step inside it; `validate` keeps it, rounded to the scale, and the field reports it.

Implementation: `src/components/decimal-field/decimal-rules.ts`, `src/components/decimal-field/decimal.ts`
Verification: `src/components/decimal-field/decimal-field.test.tsx`

### UIC-DECIMAL-FIELD-2.4 - Validation

A value below `minValue` shall report `rangeUnderflow` and one above `maxValue` `rangeOverflow`, with the provider's messages and the bound in the locale; a value off the step grid of a given `step`, or with more fraction digits than `scale`, reports `stepMismatch` with the step (or the scale's smallest step, `0.01` for 2). These checks run before the caller's `validate`, and an empty value passes them; requiring a value is the field's (`isRequired`).

Implementation: `src/components/decimal-field/decimal-field.tsx`
Verification: `src/components/decimal-field/decimal-field.test.tsx`

### UIC-DECIMAL-FIELD-2.5 - Stepping

Arrow Up and Arrow Down, and the increment and decrement buttons, shall step the decimal the input shows (the draft's, or the value while the draft spells none) by one `step` on the grid (by `1` without a `step`), within the bounds, and commit: a value off the grid moves to the next grid value that way, a value at the last grid value inside an end stays, and an empty field starts at `minValue`, or `0` within the bounds. The buttons are named by the provider strings `numberIncrease` and `numberDecrease` followed by the field's label, stay out of the tab order, keep focus in the input and are disabled at the end they point to. `hideStepper` leaves them out (`data-hide-stepper` on the root); the arrows still step.

Implementation: `src/components/decimal-field/decimal-field.tsx`, `src/components/decimal-field/decimal-stepper.tsx`
Verification: `src/components/decimal-field/decimal-field.test.tsx`, `e2e/decimal-field.spec.ts`

## UIC-DECIMAL-FIELD-3 - Accessibility and states

### UIC-DECIMAL-FIELD-3.1 - Spinbutton

The input shall have the role `spinbutton`, be named by the field's label, described by its description and message, and carry `aria-required` and `aria-invalid` as the field's state says. Its `aria-valuetext` is the value's exact locale text and `aria-valuemin`, `aria-valuemax` and `aria-valuenow` approximate the bounds and value as numbers for assistive technology only. A read-only field keeps its text selectable but refuses edits and steps and disables its buttons; a disabled field disables the input and its buttons.

Implementation: `src/components/decimal-field/decimal-field.tsx`
Verification: `src/components/decimal-field/decimal-field.test.tsx`, `e2e/decimal-field.spec.ts`

### UIC-DECIMAL-FIELD-3.2 - Field behaviour

`DecimalField` shall show each validation status, show dirty state with a restore button, undo and redo with the field's chords, and offer the field's menu, whose Clear empties the value, Reset puts the committed value back and Set to default puts the default back.

Implementation: `src/components/decimal-field/decimal-field.tsx`, `src/components/field/field.tsx`
Verification: `src/components/decimal-field/decimal-field.test.tsx`

### UIC-DECIMAL-FIELD-3.3 - Hooks and caller attributes

The field shall carry the hooks below on top of the field's, append the caller's `className` to its root and forward `id`, `ref` and caller `data-*` attributes to it. Each field holds its own draft, so several fields on a page are independent.

Implementation: `src/components/decimal-field/decimal-field.tsx`
Verification: `src/components/decimal-field/decimal-field.test.tsx`

## Hooks

| Hook                          | Kind  | Values | Description                                           |
| ----------------------------- | ----- | ------ | ----------------------------------------------------- |
| `ui-decimal-field`            | root  |        | The field's root (also `ui-field`).                   |
| `ui-decimal-field__box`       | slot  |        | The React Aria text field element around the control. |
| `ui-decimal-field__group`     | slot  |        | The frame around the input and its step buttons.      |
| `ui-decimal-field__input`     | slot  |        | The spinbutton input.                                 |
| `ui-decimal-field__decrement` | slot  |        | The decrement button.                                 |
| `ui-decimal-field__increment` | slot  |        | The increment button.                                 |
| `data-hide-stepper`           | state | `true` | On the root: the step buttons are left out.           |
| `data-invalid`                | state | `true` | On the box, the group and the input (React Aria).     |
| `data-disabled`               | state | `true` | On the box, the group and the input (React Aria).     |
| `data-focus-within`           | state | `true` | On the group: focus is inside it (React Aria).        |
