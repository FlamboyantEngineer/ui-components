# Text Field

`TextField` is a [field](FIELD.md) for a plain string, on one line or several. It is built on React Aria's `TextField` with an `Input` or a `TextArea`, and takes the field's props (`FieldInputProps<string>`), so it has a label and layout, validation, dirty state and restore, undo and redo, and the field menu. It commits on blur and on Enter, reverts an edit on Escape, and checks length and format with the field's string rules. A query that filters or finds is a [Search Field](SEARCH-FIELD.md), and a number is a [Number Field](NUMBER-FIELD.md).

## UIC-TEXT-FIELD-1 - Contract

### UIC-TEXT-FIELD-1.1 - Field control

`TextField` shall render a `Field` around a React Aria text field, built with `useFieldControl`, and take the field's props: the label, layout, description, help, decoration and menu, the value, default, committed and empty values with `onChange` and `onCommit`, `validate`, `isRequired`, `isReadOnly`, `isDisabled` and `isPending`. Its root element is the field's root, which carries `ui-text-field` beside `ui-field`. Typing changes the value; a field given no value, committed value or default starts empty, and Clear empties it.

Implementation: `src/components/text-field/text-field.tsx`, `src/components/field/field-control.ts`
Verification: `src/components/text-field/text-field.test.tsx`

### UIC-TEXT-FIELD-1.2 - One line or several

`TextField` shall edit one line in an `<input>` (`ui-text-field__input`) inside the React Aria text field element (`ui-text-field__box`). With `multiline` it shall edit several lines in a `<textarea>` instead and publish `data-multiline` on its root. `placeholder` shows while the control is empty, and React Aria's text field props (`type`, `name`, `autoComplete`, `inputMode`, `spellCheck`, `autoFocus`, `onKeyDown`, `onFocus`, `onBlur` and the others) pass through to it.

Implementation: `src/components/text-field/text-field.tsx`, `labs/reference/text-field.css`
Verification: `src/components/text-field/text-field.test.tsx`, `e2e/text-field.spec.ts`

### UIC-TEXT-FIELD-1.3 - Accessibility

The control shall be named by the field label, described by the field's description, decoration and message, and carry `aria-required` while required and `aria-invalid` with `aria-errormessage` while invalid. A read-only control is natively read-only, keeping its text selectable, and a disabled one natively disabled. Editing is the native control's, so typing, selection and the caret behave as in any input.

Implementation: `src/components/text-field/text-field.tsx`
Verification: `src/components/text-field/text-field.test.tsx`, `e2e/text-field.spec.ts`

### UIC-TEXT-FIELD-1.4 - Hooks and caller attributes

`TextField` shall carry the hooks below on top of the field's, append the caller's `className` to its root and forward caller `data-*` attributes to it. A caller `id` goes on the root, and the control's id derives from it (`<id>-control`).

Implementation: `src/components/text-field/text-field.tsx`
Verification: `src/components/text-field/text-field.test.tsx`

## UIC-TEXT-FIELD-2 - Editing

### UIC-TEXT-FIELD-2.1 - Commit

`TextField` shall commit its value when the control loses focus and when Enter is pressed on a single line; Enter in a multiline field inserts a line break, and blur still commits. An Enter that confirms an input method composition does not commit. `onCommit` runs only for a value that differs from the committed value, so a repeated Enter or the blur after an Enter commits nothing again.

Implementation: `src/components/text-field/text-field.tsx`
Verification: `src/components/text-field/text-field.test.tsx`, `e2e/text-field.spec.ts`

### UIC-TEXT-FIELD-2.2 - Escape reverts

Escape pressed while the field is dirty shall put the committed value back, prevent the key's default and stop it there, so an enclosing dialog that closes on Escape stays open. With nothing to revert, Escape goes on to the enclosing surface.

Implementation: `src/components/text-field/text-field.tsx`
Verification: `src/components/text-field/text-field.test.tsx`, `e2e/text-field.spec.ts`

### UIC-TEXT-FIELD-2.3 - Length and format

`minLength`, `maxLength`, `pattern` and `trim` shall check the value with `validateString` ([FIELD.md](FIELD.md#uic-field-7---string-rules)) and the provider's messages, before the caller's `validate`. They are not native constraints: a text longer than `maxLength` can be typed or pasted, and the field reports it.

Implementation: `src/components/text-field/text-field.tsx`
Verification: `src/components/text-field/text-field.test.tsx`

### UIC-TEXT-FIELD-2.4 - Field behaviour

`TextField` shall show each validation status (invalid, warning and pending), show dirty state with a restore button, undo and redo with the field's chords, and offer the field menu, whose Clear empties the text and Set to default puts the default back.

Implementation: `src/components/text-field/text-field.tsx`, `src/components/field/field.tsx`
Verification: `src/components/text-field/text-field.test.tsx`, `e2e/text-field.spec.ts`

## Hooks

| Hook                   | Kind  | Values | Description                                             |
| ---------------------- | ----- | ------ | ------------------------------------------------------- |
| `ui-text-field`        | root  |        | The field's root (also `ui-field`).                     |
| `ui-text-field__box`   | slot  |        | The React Aria text field element around the control.   |
| `ui-text-field__input` | slot  |        | The `<input>` or `<textarea>`.                          |
| `data-multiline`       | state | `true` | On the root: the field edits several lines.             |
| `data-invalid`         | state | `true` | On the box and the control: invalid (React Aria).       |
| `data-required`        | state | `true` | On the box: a value is required (React Aria).           |
| `data-readonly`        | state | `true` | On the box: read-only (React Aria).                     |
| `data-disabled`        | state | `true` | On the box and the control: disabled (React Aria).      |
| `data-hovered`         | state | `true` | On the control: under the pointer (React Aria).         |
| `data-focused`         | state | `true` | On the control: focused (React Aria).                   |
| `data-focus-visible`   | state | `true` | On the control: focused from the keyboard (React Aria). |
