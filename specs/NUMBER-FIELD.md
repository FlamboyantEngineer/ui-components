# Number Field

`NumberField` is a [field](FIELD.md) for a number, built on React Aria's `NumberField`. It parses and formats the number for the locale with `Intl.NumberFormat` options (decimals, grouping, currency, percent, units), steps it with buttons and the arrow keys, and reports a value outside its range or off its step. It takes the field's props (`FieldInputProps<number | null>`): an empty field holds `null`, never zero. What a number means (units, currencies, derived values) is the caller's: the field edits a plain number. Literal affixes sit inside its frame as adornments, Shift and Alt step by larger and smaller amounts, and a scrub handle steps the value by dragging.

Pointer ownership and drag lifecycle cleanup follow the shared [drag interaction contract](DRAG-INTERACTIONS.md).

## UIC-NUMBER-FIELD-1 - Contract

### UIC-NUMBER-FIELD-1.1 - Field control

`NumberField` shall render a `Field` around a number field element, built with `useFieldControl`, and take the field's props, its own range, step, format and commit props and `placeholder`. Its root element is the field's root, which carries `ui-number-field` beside `ui-field`. The value is a number or `null` while empty; a field given no value, committed value or default starts empty, and Clear empties it.

Implementation: `src/components/number-field/number-field.tsx`, `src/components/field/field-control.ts`
Verification: `src/components/number-field/number-field.test.tsx`

### UIC-NUMBER-FIELD-1.2 - Locale formatting and parsing

`NumberField` shall show its value formatted with `formatOptions` in the `UiProvider` locale ([PROVIDER.md](PROVIDER.md)), and parse typed and pasted text in that locale, so `1.234,5` is a number in German. It refuses characters that cannot belong to a number in that format; text that does not parse goes back to the formatted value on commit, and emptied text gives `null`. The control is a text input (`ui-number-field__input`) with a numeric input mode, never a native number input, and `placeholder` shows while it is empty.

Implementation: `src/components/number-field/number-field.tsx`
Verification: `src/components/number-field/number-field.test.tsx`, `e2e/number-field.spec.ts`

### UIC-NUMBER-FIELD-1.3 - Steppers

`NumberField` shall draw a decrement and an increment button (`ui-number-field__decrement` with the `minus` glyph and `ui-number-field__increment` with the `plus` glyph) around the input, inside a group (`ui-number-field__group`). They are named from the field label (`Decrease <label>`, `Increase <label>`), stay out of the tab order, keep focus in the input when pressed with a pointer, and are disabled when the value cannot move further. Arrow Up and Arrow Down step the value from the keyboard, by `step` (1 by default). `hideStepper` leaves the buttons out and publishes `data-hide-stepper` on the root; the keys still step.

Implementation: `src/components/number-field/number-field.tsx`, `labs/reference/number-field.css`
Verification: `src/components/number-field/number-field.test.tsx`, `e2e/number-field.spec.ts`

### UIC-NUMBER-FIELD-1.4 - Accessibility

The input shall be named by the field label, described by the field's description, decoration and message, and carry `aria-required` while required and `aria-invalid` with `aria-errormessage` while invalid. A read-only field keeps its value readable and refuses edits and steps; a disabled one is natively disabled.

Implementation: `src/components/number-field/number-field.tsx`
Verification: `src/components/number-field/number-field.test.tsx`

### UIC-NUMBER-FIELD-1.5 - Hooks and caller attributes

`NumberField` shall carry the hooks below on top of the field's, append the caller's `className` to its root and forward caller `data-*` attributes to it. A caller `id` goes on the root, and the input's id derives from it (`<id>-control`).

Implementation: `src/components/number-field/number-field.tsx`
Verification: `src/components/number-field/number-field.test.tsx`

## UIC-NUMBER-FIELD-2 - Value and validation

### UIC-NUMBER-FIELD-2.1 - Commit

`NumberField` shall keep the text being typed apart from its value: the text becomes the value, through `onChange`, and commits, through `onCommit`, only when the input loses focus, when Enter is pressed and on each step. Intermediate text such as `-` or `1.` never becomes a value. A value set from outside the input (a controlled value, restore, undo or a menu action) replaces the text without being clamped or snapped during render, so the displayed number remains the value being validated. A snapping commit on blur or Enter also corrects an unchanged external value.

Implementation: `src/components/number-field/number-field.tsx`
Verification: `src/components/number-field/number-field.test.tsx`, `e2e/number-field.spec.ts`

### UIC-NUMBER-FIELD-2.2 - Range and step

`minValue`, `maxValue` and `step` shall bound the value. `commitBehavior` (`NumberFieldCommitBehavior`) chooses what a commit does: by default (`snap`) a committed value is clamped into the range and snapped to the nearest step. With `commitBehavior="validate"` it is kept as typed, and the field reports a value below the minimum, above the maximum or off the step (counted from the minimum, or from zero) as an error with the provider strings `rangeUnderflow`, `rangeOverflow` and `stepMismatch`, given the bound formatted like the value. Any value outside the rules, a controlled one included, reports the same way, before the caller's `validate`. Snapping uses the minimum as its origin (zero without a minimum), keeps the result on a valid step at an off-step maximum, and preserves decimal and scientific-notation precision.

Implementation: `src/components/number-field/number-field.tsx`, `src/components/number-field/snap-number-value.ts`, `src/core/strings.ts`
Verification: `src/components/number-field/number-field.test.tsx`, `src/components/number-field/snap-number-value.test.ts`, `e2e/number-field.spec.ts`

### UIC-NUMBER-FIELD-2.3 - Field behaviour

`NumberField` shall show each validation status (invalid, warning and pending), show dirty state with a restore button, undo and redo with the field's chords, and offer the field menu, whose Clear empties the value and Set to default puts the default back.

Implementation: `src/components/number-field/number-field.tsx`, `src/components/field/field.tsx`
Verification: `src/components/number-field/number-field.test.tsx`, `e2e/number-field.spec.ts`

## UIC-NUMBER-FIELD-3 - Affixes and fast steps

### UIC-NUMBER-FIELD-3.1 - Literal affixes

`startAdornment` and `endAdornment` shall render the caller's content in `ui-number-field__start` and `ui-number-field__end`, inside the group, around the input and within the step buttons, so a literal the locale formats cannot produce (`$ 1,000 /mo`) frames the number without becoming part of its text. The locale's own formats (currency, units, grouping such as the `en-IN` lakh) stay `formatOptions`' and the locale's.

Implementation: `src/components/number-field/number-field.tsx`, `labs/reference/number-field.css`
Verification: `src/components/number-field/number-field.test.tsx`, `e2e/number-field.spec.ts`

### UIC-NUMBER-FIELD-3.2 - Modifier steps

With `largeStep`, Shift with Arrow Up or Arrow Down shall step the value by `largeStep`; with `smallStep`, Alt with the arrows steps it by `smallStep`. Each step keeps the value within `minValue` and `maxValue`, rounds it to the precision of the value and the step, prevents the key's default and commits. Scientific notation retains its decimal precision; values finer than the platform's fixed-decimal limit retain their arithmetic result instead of throwing. An empty value steps to the minimum, or zero. A read-only or disabled field refuses the steps, and without the matching prop a modified arrow does nothing.

Implementation: `src/components/number-field/number-field.tsx`, `src/components/number-field/number-field-parts.tsx`
Verification: `src/components/number-field/number-field.test.tsx`, `e2e/number-field.spec.ts`

### UIC-NUMBER-FIELD-3.3 - Scrub handle

`showScrubber` shall draw a scrub handle (`ui-number-field__scrubber`, holding the `scrub` glyph, hidden from assistive technology, which steps with the arrow keys) after the decrement button. Pressing it with the primary pointer button and dragging sideways steps the value once every 4 pixels toward the end of the line (rightward in left-to-right text, leftward in right-to-left text) by `step`, or by `largeStep` with Shift and `smallStep` with Alt, within the range; the field's value follows the drag through `onChange` and commits once when the drag ends. The handle captures the pointer and opts out of touch panning (`touch-action: none`). A read-only or disabled field refuses the drag. Becoming read-only or disabled releases capture and abandons an active scrub without a commit; unlocking requires a new press.

Implementation: `src/components/number-field/number-field.tsx`, `src/components/number-field/number-field-parts.tsx`, `src/core/glyphs.tsx`, `labs/reference/number-field.css`
Verification: `src/components/number-field/number-field.test.tsx`, `e2e/number-field.spec.ts`

## Hooks

| Hook                         | Kind  | Values | Description                                                    |
| ---------------------------- | ----- | ------ | -------------------------------------------------------------- |
| `ui-number-field`            | root  |        | The field's root (also `ui-field`).                            |
| `ui-number-field__box`       | slot  |        | The React Aria number field element.                           |
| `ui-number-field__group`     | slot  |        | The group around the input and the step buttons.               |
| `ui-number-field__decrement` | slot  |        | The decrement button.                                          |
| `ui-number-field__scrubber`  | slot  |        | The scrub handle.                                              |
| `ui-number-field__start`     | slot  |        | The start adornment.                                           |
| `ui-number-field__input`     | slot  |        | The text input.                                                |
| `ui-number-field__end`       | slot  |        | The end adornment.                                             |
| `ui-number-field__increment` | slot  |        | The increment button.                                          |
| `data-hide-stepper`          | state | `true` | On the root: the step buttons are left out.                    |
| `data-invalid`               | state | `true` | On the box, the group and the input: invalid (React Aria).     |
| `data-required`              | state | `true` | On the box: a value is required (React Aria).                  |
| `data-readonly`              | state | `true` | On the box and the group: read-only (React Aria).              |
| `data-disabled`              | state | `true` | On the box, the group, the input and the buttons (React Aria). |
| `data-hovered`               | state | `true` | On the group, the input and the buttons: hovered (React Aria). |
| `data-focus-within`          | state | `true` | On the group: focus is inside it (React Aria).                 |
| `data-focused`               | state | `true` | On the input and the buttons: focused (React Aria).            |
| `data-focus-visible`         | state | `true` | On the group, the input and the buttons (React Aria).          |
| `data-pressed`               | state | `true` | On the buttons: being pressed (React Aria).                    |
