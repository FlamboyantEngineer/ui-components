# Boolean Field

`BooleanField` is a [field](FIELD.md) for a true-or-false value that may also be unset (`null`). It draws the value as a [Checkbox](CHECKBOX.md), a React Aria `Switch`, a [Segmented Choice](SEGMENTED-CHOICE.md) of two named values, the [Select Field](SELECT-FIELD.md)'s control with the named values as options, or a React Aria `ToggleButton` that shows the current value's name, and takes the field's props (`FieldInputProps<boolean | null>`), so it has a label and layout, validation, dirty state and restore, undo and redo, and the field menu. A tick box that only reports whether it is ticked, with no field around it, is the [Checkbox](CHECKBOX.md) on its own.

## UIC-BOOLEAN-FIELD-1 - Contract

### UIC-BOOLEAN-FIELD-1.1 - Field control

`BooleanField` shall render a `Field` around its control, built with `useFieldControl`, and take the field's props. Its root element is the field's root, which carries `ui-boolean-field` beside `ui-field` and publishes the value in `data-value` (`true`, `false` or `unset`). A field given no value, committed value or default starts `false` when it is a two-state control (the `checkbox`, `switch` or `toggle-button` variant without `allowsUnset`), and unset otherwise (the `segmented` and `dropdown` variants, and any variant with `allowsUnset`), so an ordinary checkbox never starts mixed. `isRequired` asks a two-state control for consent: only `true` fills it, like a required native checkbox, so `false` leaves it invalid with the required message. It asks the other variants for an answer: they are invalid while unset, and `false` is a value. An explicit `null` value still shows unset in any variant.

Implementation: `src/components/boolean-field/boolean-field.tsx`, `src/components/boolean-field/boolean-controls.tsx`, `src/components/field/field-control.ts`
Verification: `src/components/boolean-field/boolean-field.test.tsx`

### UIC-BOOLEAN-FIELD-1.2 - Variants

`variant` shall choose the control and publish `data-variant`: `checkbox` (the default) draws a `Checkbox` with no text of its own, mixed while unset; `switch` draws a React Aria switch (`ui-boolean-field__switch`, a `<label>` around a native input with role `switch`) with a track (`ui-boolean-field__track`) and a thumb (`ui-boolean-field__thumb`), on while true; `segmented` draws a `SegmentedChoice` with a false and a true segment, the selected one matching the value, with an explicit unset segment when allowsUnset is enabled; `dropdown` draws a select of the named values (UIC-BOOLEAN-FIELD-3.1); `toggle-button` draws a toggle button pressed while true (UIC-BOOLEAN-FIELD-3.2). The checkbox and the segments take the field's `size`.

Implementation: `src/components/boolean-field/boolean-field.tsx`, `src/components/boolean-field/boolean-controls.tsx`, `labs/reference/boolean-field.css`
Verification: `src/components/boolean-field/boolean-field.test.tsx`, `e2e/boolean-field.spec.ts`

### UIC-BOOLEAN-FIELD-1.3 - Labels

`trueLabel` and `falseLabel` shall name the true and false values (the provider strings `valueTrue` and `valueFalse` by default): the segments' text, the dropdown's options, the toggle button's caption and the switch caption. `unsetLabel` (the provider string `valueUnset` by default) names the unset value where a variant shows it. A switch shows its state by position, so it draws a caption (`ui-boolean-field__caption`) only when the caller gives a label, or while unset, when it shows `unsetLabel`. A checkbox draws no caption.

Implementation: `src/components/boolean-field/boolean-field.tsx`, `src/components/boolean-field/boolean-controls.tsx`, `src/core/strings.ts`
Verification: `src/components/boolean-field/boolean-field.test.tsx`

### UIC-BOOLEAN-FIELD-1.4 - Accessibility

The checkbox and the switch shall be named by the field label, which is a native label for their input, so pressing the label text works the control as pressing the box does. The segmented choice is a radio group named by the label. Each control is described by the field's description, decoration and message, and reports required, invalid, read-only and disabled states.

Implementation: `src/components/boolean-field/boolean-field.tsx`, `src/components/boolean-field/boolean-controls.tsx`
Verification: `src/components/boolean-field/boolean-field.test.tsx`, `e2e/boolean-field.spec.ts`

### UIC-BOOLEAN-FIELD-1.5 - Form value

With `name`, a form shall submit the value the same way whatever the `variant`: `true` or `false` from a hidden input (`ui-boolean-field__form-value`, the shared field form value of UIC-FIELD-8.4), and nothing while unset or disabled. The checkbox's and the switch's own native input carries no name.

Implementation: `src/components/boolean-field/boolean-field.tsx`, `src/components/boolean-field/boolean-controls.tsx`
Verification: `src/components/boolean-field/boolean-field.test.tsx`

### UIC-BOOLEAN-FIELD-1.6 - Hooks and caller attributes

`BooleanField` shall carry the hooks below on top of the field's and its control's, append the caller's `className` to its root and forward caller `data-*` attributes to it. A caller `id` goes on the root, and the control's id derives from it (`<id>-control`).

Implementation: `src/components/boolean-field/boolean-field.tsx`, `src/components/boolean-field/boolean-controls.tsx`
Verification: `src/components/boolean-field/boolean-field.test.tsx`

## UIC-BOOLEAN-FIELD-2 - Interaction

### UIC-BOOLEAN-FIELD-2.1 - Toggling

Pressing the checkbox or the switch, or pressing Space on it, shall flip the value and commit it; an unset value becomes true. Picking a segment sets and commits its value.

Implementation: `src/components/boolean-field/boolean-field.tsx`, `src/components/boolean-field/boolean-controls.tsx`
Verification: `src/components/boolean-field/boolean-field.test.tsx`, `e2e/boolean-field.spec.ts`

### UIC-BOOLEAN-FIELD-2.2 - Returning to unset

With `allowsUnset`, the checkbox, the switch and the toggle button shall cycle unset, true, false and unset again (`cycleCheckState`), the segmented choice offers an explicit unset segment, the dropdown lists an unset option (UIC-BOOLEAN-FIELD-3.1), and the field menu's Clear unsets the value. Without it, a press or pick never unsets the value and Clear is unavailable.

Implementation: `src/components/boolean-field/boolean-field.tsx`, `src/components/boolean-field/boolean-controls.tsx`, `src/components/checkbox/checkbox.tsx`
Verification: `src/components/boolean-field/boolean-field.test.tsx`, `e2e/boolean-field.spec.ts`

### UIC-BOOLEAN-FIELD-2.3 - Field behaviour

In every variant, `BooleanField` shall show each validation status, refuse presses and picks while read-only or disabled, show dirty state with a restore button, undo and redo with the field's chords from its control, and offer the field menu. Every variant registers its control with the field, so `autoFocus`, a form's focus on its first invalid field and the restore button reach it; the segmented choice takes focus on its selected segment, else its first enabled one, and a change of variant registers the new control.

Implementation: `src/components/boolean-field/boolean-field.tsx`, `src/components/boolean-field/boolean-controls.tsx`, `src/components/field/field.tsx`
Verification: `src/components/boolean-field/boolean-field.test.tsx`, `e2e/boolean-field.spec.ts`

## UIC-BOOLEAN-FIELD-3 - Dropdown and toggle button

### UIC-BOOLEAN-FIELD-3.1 - Dropdown

The `dropdown` variant shall draw the [Select Field](SELECT-FIELD.md)'s control bound to the field: React Aria's `Select` with the select field's trigger, list and hooks (`ui-select-field__select`, `__trigger`, `__value`, `__popover`, `__option`, …), whose options are the true value then the false value, named by `trueLabel` and `falseLabel`. The trigger is named by its value and the field's label; while unset it shows `unsetLabel` as its placeholder. With `allowsUnset`, the list leads with an option named `unsetLabel` that picks unset. Picking an option sets and commits its value; the list never filters.

Implementation: `src/components/boolean-field/boolean-controls.tsx`, `src/components/select-field/select-field.tsx`
Verification: `src/components/boolean-field/boolean-field.test.tsx`, `e2e/boolean-field.spec.ts`

### UIC-BOOLEAN-FIELD-3.2 - Toggle button

The `toggle-button` variant shall draw a React Aria `ToggleButton` (`ui-boolean-field__toggle-button`, a `<button>` with `aria-pressed`), pressed while true, holding a caption (`ui-boolean-field__caption`) with the current value's name: `trueLabel`, `falseLabel` or, while unset, `unsetLabel`. Like the dropdown's trigger, the button is named by its caption followed by the field's label, so its accessible name holds its visible text, and it is described by the field's description, decoration and message. Pressing it, or Space or Enter on it, gives the other value (or, with `allowsUnset`, the next value of the cycle) and commits it. A disabled field disables the button; a read-only one keeps it focusable and refuses presses.

Implementation: `src/components/boolean-field/boolean-controls.tsx`
Verification: `src/components/boolean-field/boolean-field.test.tsx`, `e2e/boolean-field.spec.ts`

### UIC-BOOLEAN-FIELD-3.3 - Toggle button width

The toggle button shall measure the widest of its three names in the caption's font (`useWidestTextWidth`, [MEASUREMENT.md](MEASUREMENT.md)) and publish it, in pixels, as `--ui-boolean-field-caption-width` on the caption. The reference sheet keeps the caption at least that wide, so the button keeps its width as the value changes.

Implementation: `src/components/boolean-field/boolean-controls.tsx`, `src/utils/use-widest-text-width.ts`, `labs/reference/boolean-field.css`
Verification: `src/components/boolean-field/boolean-field.test.tsx`, `e2e/boolean-field.spec.ts`

### UIC-BOOLEAN-FIELD-3.4 - Previous value

While the field is dirty, the dropdown shall show the committed value's option before its trigger as the select field does (`ui-select-field__previous`, UIC-SELECT-FIELD-2.3), and the toggle button shall show the committed value's name as a `FieldPreviousValue` (`ui-boolean-field__previous`) before the button, outside it, so the button's name and caption remain its current value.

Implementation: `src/components/boolean-field/boolean-controls.tsx`, `src/components/select-field/select-trigger.tsx`
Verification: `src/components/boolean-field/boolean-field.test.tsx`, `e2e/boolean-field.spec.ts`

### UIC-BOOLEAN-FIELD-3.5 - Explicit tri-state displays

`allowsUnset` offers all three states in every variant. Checkbox, switch and toggle-button cycle unset → true → false → unset. Segmented mode offers an explicit unset segment and dropdown mode an unset option, named by `unsetLabel`. The checkbox is mixed, the switch thumb has a middle position with a caption, and the toggle button shows the unset caption and an indeterminate hook. The reference segmented labels reserve enough width to keep False and other labels fully visible.

Implementation: `src/components/boolean-field/boolean-controls.tsx`, `labs/reference/boolean-field.css`, `labs/reference/segmented-choice.css`
Verification: `src/components/boolean-field/boolean-tristate.test.tsx`, `e2e/boolean-field.spec.ts`

## Hooks

| Hook                               | Kind      | Values                                                         | Description                                                                                 |
| ---------------------------------- | --------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `ui-boolean-field`                 | root      |                                                                | The field's root (also `ui-field`).                                                         |
| `ui-boolean-field__switch`         | slot      |                                                                | The switch's `<label>`, around its input.                                                   |
| `ui-boolean-field__track`          | slot      |                                                                | The switch track.                                                                           |
| `ui-boolean-field__thumb`          | slot      |                                                                | The switch thumb, inside the track.                                                         |
| `ui-boolean-field__caption`        | slot      |                                                                | The switch caption, or the toggle button's name of the value.                               |
| `ui-boolean-field__toggle-button`  | slot      |                                                                | The toggle button (`aria-pressed`).                                                         |
| `ui-boolean-field__previous`       | slot      |                                                                | The committed value's name before a dirty toggle button (also `ui-field-previous-value`).   |
| `ui-boolean-field__form-value`     | slot      |                                                                | The hidden input of a named field, in every variant.                                        |
| `data-variant`                     | attribute | `checkbox`, `switch`, `segmented`, `dropdown`, `toggle-button` | On the root: how the value is drawn.                                                        |
| `data-value`                       | state     | `true`, `false`, `unset`                                       | On the root: the value.                                                                     |
| `data-selected`                    | state     | `true`                                                         | On the switch or toggle button: on (React Aria).                                            |
| `data-pressed`                     | state     | `true`                                                         | On the switch or toggle button: being pressed (React Aria).                                 |
| `data-hovered`                     | state     | `true`                                                         | On the switch or toggle button: under the pointer (React Aria).                             |
| `data-focused`                     | state     | `true`                                                         | On the switch or toggle button: focused (React Aria).                                       |
| `data-focus-visible`               | state     | `true`                                                         | On the switch or toggle button: focused from the keyboard (React Aria).                     |
| `data-disabled`                    | state     | `true`                                                         | On the switch or toggle button: disabled (React Aria).                                      |
| `data-readonly`                    | state     | `true`                                                         | On the switch: read-only (React Aria).                                                      |
| `data-invalid`                     | state     | `true`                                                         | On the switch: invalid (React Aria).                                                        |
| `data-required`                    | state     | `true`                                                         | On the switch: a value is required (React Aria).                                            |
| `--ui-boolean-field-caption-width` | property  |                                                                | On the toggle button's caption: the width of its widest name, in pixels.                    |
| `data-indeterminate`               | state     | `true`                                                         | On the switch and toggle button while unset; the reference switch thumb sits in the middle. |
