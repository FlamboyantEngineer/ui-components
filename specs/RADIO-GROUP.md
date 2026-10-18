# Radio Group

`RadioGroup` is a [field](FIELD.md) for one value picked from a list of radios, built on React Aria's `RadioGroup`. It takes the field's props (`FieldInputProps<string | null>`), so it has a group label and layout, a description, validation, dirty state and restore, undo and redo, and the field menu. Each option is a `Radio`, on React Aria's `RadioField` and `RadioButton`: a native radio input inside a `<label>` with a drawn indicator, plain or rich label content and an optional description. A list of values is a [Checkbox Group](CHECKBOX-GROUP.md); a run of toggle-style segments is a [Segmented Choice](SEGMENTED-CHOICE.md).

## UIC-RADIO-GROUP-1 - Contract

### UIC-RADIO-GROUP-1.1 - Field control

`RadioGroup` shall render a `Field` around a React Aria radio group (`ui-radio-group__box`, role `radiogroup`, named by the field label), built with `useFieldControl`, holding its `children`, the `Radio` elements. Its root element is the field's root, which carries `ui-radio-group` beside `ui-field`. The value is the selected radio's `value`, or `null` while none is: a field given no value, committed value or default starts with none selected, and Clear selects none. Selecting a radio sets its value and commits it.

Implementation: `src/components/radio-group/radio-group.tsx`, `labs/reference/radio-group.css`
Verification: `src/components/radio-group/radio-group.test.tsx`, `e2e/radio-group.spec.ts`

### UIC-RADIO-GROUP-1.2 - Radio

`Radio` shall render React Aria's `RadioField` (`ui-radio`) holding a `<label>` (`ui-radio__button`, React Aria's `RadioButton`) around a visually hidden native radio input, a drawn indicator (`ui-radio__indicator`, hidden from assistive technology) and its children in `ui-radio__label`, which may be rich content (an icon, a badge, a price). Pressing the indicator or the label selects the radio. React Aria's radio props pass through: `value`, `isDisabled`, `inputRef`, `aria-label` for a radio without text, `render` and the others; a caller `id` goes on the input. A `Radio` renders inside a `RadioGroup`.

Implementation: `src/components/radio-group/radio-group.tsx`, `labs/reference/radio-group.css`
Verification: `src/components/radio-group/radio-group.test.tsx`, `e2e/radio-group.spec.ts`

### UIC-RADIO-GROUP-1.3 - Description

A radio's `description` shall render in `ui-radio__description` after its `<label>`, through React Aria's description slot, and describe its input (`aria-describedby`).

Implementation: `src/components/radio-group/radio-group.tsx`
Verification: `src/components/radio-group/radio-group.test.tsx`, `e2e/radio-group.spec.ts`

### UIC-RADIO-GROUP-1.4 - Orientation and size

`orientation` (React Aria's, `vertical` by default, or `horizontal`) shall lay the radios out in a column or a row, publish React Aria's `data-orientation` on the box and set `aria-orientation` on the group. `size` (`sm`, `md` by default, `lg`) shall publish `data-size` on the root.

Implementation: `src/components/radio-group/radio-group.tsx`, `labs/reference/radio-group.css`
Verification: `src/components/radio-group/radio-group.test.tsx`, `e2e/radio-group.spec.ts`

### UIC-RADIO-GROUP-1.5 - Form value

With `name`, a form shall submit the selected radio's `value` under that name, and nothing while none is selected. Without one, React Aria gives the radios a generated name so they still form one group. React Aria's radio group props (`name`, `form`, `onFocus`, `onBlur` and the others) pass through.

Implementation: `src/components/radio-group/radio-group.tsx`
Verification: `src/components/radio-group/radio-group.test.tsx`

### UIC-RADIO-GROUP-1.6 - Hooks and caller attributes

`RadioGroup` and `Radio` shall carry the hooks below, append the caller's `className` to their root and forward caller `data-*` attributes to it. A caller `id` on `RadioGroup` goes on the root, and the group's id derives from it (`<id>-control`).

Implementation: `src/components/radio-group/radio-group.tsx`
Verification: `src/components/radio-group/radio-group.test.tsx`

## UIC-RADIO-GROUP-2 - Accessibility and keyboard

### UIC-RADIO-GROUP-2.1 - Names and states

The group shall be named by the field label and described by the field's description, decoration and message; while invalid it carries `aria-invalid="true"` and `aria-errormessage` naming the message, and while required `aria-required="true"`. Each radio input is named by its label content, or by `aria-label`. The group and its radios publish React Aria's `data-invalid`, `data-required`, `data-readonly` and `data-disabled`; each radio and its button publish `data-selected` while selected, and the button `data-hovered`, `data-pressed`, `data-focused` and `data-focus-visible` (keyboard focus only).

Implementation: `src/components/radio-group/radio-group.tsx`
Verification: `src/components/radio-group/radio-group.test.tsx`, `e2e/radio-group.spec.ts`

### UIC-RADIO-GROUP-2.2 - Keyboard

Tab shall enter the group as one stop, on the selected radio, or on the first enabled radio while none is selected, and leave it with the next Tab. The arrow keys move focus to the next or previous enabled radio, wrapping at the ends (Right and Left mirrored in right-to-left locales), and select it; Space selects the focused radio. Disabled radios are skipped.

Implementation: `src/components/radio-group/radio-group.tsx`
Verification: `src/components/radio-group/radio-group.test.tsx`, `e2e/radio-group.spec.ts`

### UIC-RADIO-GROUP-2.3 - Disabled and read-only

A radio's `isDisabled` shall disable its input natively and take it out of the arrow keys' path. A disabled group (`isDisabled`, or a disabled `Fieldset` around it) disables every radio. A read-only group keeps its radios focusable and its selection shown but refuses every pick, and its group carries `aria-readonly="true"`.

Implementation: `src/components/radio-group/radio-group.tsx`, `src/components/field/field-state.ts`
Verification: `src/components/radio-group/radio-group.test.tsx`

## UIC-RADIO-GROUP-3 - Field behaviour

### UIC-RADIO-GROUP-3.1 - Validation, dirty state and undo

A required group with no radio selected shall be invalid (UIC-FIELD-3.1). `RadioGroup` shows each validation status, shows dirty state with a restore button, undoes and redoes with the field's chords from its radios, and offers the field menu, whose Clear selects none.

Implementation: `src/components/radio-group/radio-group.tsx`, `src/components/field/field.tsx`
Verification: `src/components/radio-group/radio-group.test.tsx`, `e2e/radio-group.spec.ts`

### UIC-RADIO-GROUP-3.2 - Control reference

The field's control reference shall be the selected radio's input, or the first enabled radio's input while none is selected, the radio Tab reaches: a restore and a form's submit validation focus it, and the native behavior's custom validity (UIC-FIELD-3.10) blocks a native submit through it. A value set from outside the radios (restore, undo, redo, a menu action) while focus is in the group moves focus to the newly selected radio, as the arrow keys do.

Implementation: `src/components/radio-group/radio-group.tsx`
Verification: `src/components/radio-group/radio-group.test.tsx`, `e2e/radio-group.spec.ts`

## Hooks

| Hook                    | Kind      | Values                   | Description                                                           |
| ----------------------- | --------- | ------------------------ | --------------------------------------------------------------------- |
| `ui-radio-group`        | root      |                          | The field's root (also `ui-field`).                                   |
| `ui-radio-group__box`   | slot      |                          | The React Aria radio group (role `radiogroup`).                       |
| `ui-radio`              | root      |                          | A radio's `<div>`, around its button and description.                 |
| `ui-radio__button`      | slot      |                          | The `<label>` around the hidden input, the indicator and the label.   |
| `ui-radio__indicator`   | slot      |                          | The drawn indicator.                                                  |
| `ui-radio__label`       | slot      |                          | The label content.                                                    |
| `ui-radio__description` | slot      |                          | The radio's description.                                              |
| `data-size`             | attribute | `sm`, `md`, `lg`         | On the group's root: radio size.                                      |
| `data-orientation`      | attribute | `horizontal`, `vertical` | On the box: layout and arrow-key axis (React Aria).                   |
| `data-selected`         | state     | `true`                   | On a radio and its button: selected (React Aria).                     |
| `data-hovered`          | state     | `true`                   | On a button: under the pointer (React Aria).                          |
| `data-pressed`          | state     | `true`                   | On a button: being pressed (React Aria).                              |
| `data-focused`          | state     | `true`                   | On a button: its input has focus (React Aria).                        |
| `data-focus-visible`    | state     | `true`                   | On a button: its input has keyboard focus (React Aria).               |
| `data-invalid`          | state     | `true`                   | On the box, a radio and its button: invalid (React Aria).             |
| `data-required`         | state     | `true`                   | On the box, a radio and its button: a value is required (React Aria). |
| `data-readonly`         | state     | `true`                   | On the box, a radio and its button: read-only (React Aria).           |
| `data-disabled`         | state     | `true`                   | On the box, a radio and its button: disabled (React Aria).            |
