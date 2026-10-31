# Pin Input

`PinInput` is a [field](FIELD.md) for a short code of a fixed length, such as a PIN or a one-time code: one single-character input per character, in a group named by the label. Typing advances to the next cell, Backspace erases and moves back, the arrow keys move between cells, and a paste fills the cells from the focused one. It takes the field's props (`FieldInputProps<string>`), so it has a label and layout, a description, validation, dirty state and restore, undo and redo, and the field menu. A free-length text is a [Text Field](TEXT-FIELD.md) (with `type="password"` for a secret).

## UIC-PIN-INPUT-1 - Contract

### UIC-PIN-INPUT-1.1 - Field control

`PinInput` shall render a `Field` around a React Aria `Group` (`ui-pin-input__group`, role `group`) holding `length` cells (`ui-pin-input__cell`, React Aria `Input` elements), built with `useFieldControl`. Its root element is the field's root, which carries `ui-pin-input` beside `ui-field`. The value is the cells' characters joined from the first cell, with no gap: a field given no value, committed value or default starts empty, and Clear empties it. Cell `n` shows the value's `n`th character, and publishes `data-filled` while it holds one; the root publishes `data-complete` while the value is a full code: exactly `length` characters, each one its cells take (UIC-PIN-INPUT-2.6).

Implementation: `src/components/pin-input/pin-input.tsx`, `src/components/pin-input/pin-input-cells.tsx`, `labs/reference/pin-input.css`
Verification: `src/components/pin-input/pin-input.test.tsx`, `e2e/pin-input.spec.ts`

### UIC-PIN-INPUT-1.2 - Accessibility

The group shall be named by the field label (`aria-labelledby`, or `aria-label` in the `control-only` layout), and each cell by the provider string `characterPosition` from its position and the length ("Character 2 of 6"). Each cell is described by the field's description, decoration and message and carries `aria-required` while required and `aria-invalid` with `aria-errormessage` while invalid. The label points at the first cell, so pressing it focuses that cell, and the first cell is the element a restore, a form's submit validation and the native behavior's custom validity (UIC-FIELD-3.10) use. While invalid, disabled or read-only, the group publishes React Aria's `data-invalid`, `data-disabled` or `data-readonly`.

Implementation: `src/components/pin-input/pin-input-cells.tsx`, `src/core/strings/field.ts`
Verification: `src/components/pin-input/pin-input.test.tsx`, `e2e/pin-input.spec.ts`

### UIC-PIN-INPUT-1.3 - Character type

`type` shall choose the characters a cell takes: `numeric` (the default) takes the digits 0 to 9 and gives the cells `inputMode="numeric"`; `alphanumeric` takes Latin letters and digits, and `alphabetic` Latin letters, both with `inputMode="text"`. Other characters are dropped from typing, pasting and autofill; a value the caller supplies is checked, not rewritten (UIC-PIN-INPUT-2.6).

Implementation: `src/components/pin-input/pin-input-cells.tsx`, `src/components/pin-input/pin-value.ts`
Verification: `src/components/pin-input/pin-input.test.tsx`, `src/components/pin-input/pin-value.test.ts`, `e2e/pin-input.spec.ts`

### UIC-PIN-INPUT-1.4 - Mask and placeholder

With `mask`, the cells shall be password inputs that hide their characters. `placeholder` shows in each empty cell.

Implementation: `src/components/pin-input/pin-input-cells.tsx`
Verification: `src/components/pin-input/pin-input.test.tsx`, `e2e/pin-input.spec.ts`

### UIC-PIN-INPUT-1.5 - Autocomplete

`autoComplete` shall go on the first cell (`off` by default), so `one-time-code` lets the browser offer a code it received by message; the other cells never autocomplete. A code filled into one cell at once spreads across the cells from that one, as a paste does. The cell tells autofill from typing by the input event, not by the text's length: typing (`insertText`) writes only the event's `data`, beside the cell's old character when that was not selected, while any other change to the cell's text (autofill, a replacement, an input event with no type) counts whole, even when it holds the old character, so a two-character code autofilled into a filled cell keeps both characters.

Implementation: `src/components/pin-input/pin-input-cells.tsx`, `src/components/pin-input/pin-value.ts`
Verification: `src/components/pin-input/pin-input.test.tsx`, `src/components/pin-input/pin-value.test.ts`

### UIC-PIN-INPUT-1.6 - Form value

With `name`, a form shall submit the joined value under that name through one hidden input; a disabled field submits nothing. The cells have no name. The name also shows the nearest form's external errors for it (UIC-FIELD-3.9).

Implementation: `src/components/pin-input/pin-input-cells.tsx`
Verification: `src/components/pin-input/pin-input.test.tsx`, `e2e/pin-input.spec.ts`

### UIC-PIN-INPUT-1.7 - Read-only and disabled

A read-only field's cells shall be natively read-only and refuse typing, pasting and Backspace, while the arrow keys still move between them; a disabled field's cells are natively disabled.

Implementation: `src/components/pin-input/pin-input-cells.tsx`
Verification: `src/components/pin-input/pin-input.test.tsx`

### UIC-PIN-INPUT-1.8 - Hooks and caller attributes

`PinInput` shall carry the hooks below on top of the field's, append the caller's `className` to its root and forward caller `data-*` attributes to it. A caller `id` goes on the root, and the first cell's id derives from it (`<id>-control`).

Implementation: `src/components/pin-input/pin-input.tsx`, `src/components/pin-input/pin-value.ts`
Verification: `src/components/pin-input/pin-input.test.tsx`

## UIC-PIN-INPUT-2 - Entering a code

### UIC-PIN-INPUT-2.1 - Typing

A character typed into a cell shall replace that cell's character and move focus to the next cell; the last cell keeps focus. Typing the character a cell already holds moves on without a change. A focused cell selects its character, so typing replaces it. Text an input method is composing stays in its cell, provisional: it changes no value and moves no focus until the composition ends, when its text is entered once, filtered by the type, as typed text is; a cancelled composition puts the cell's character back. Focus follows the value the field renders: a caller that changes the typed value (to upper case, say) still moves it on, and a change the caller refuses moves nothing, then or later.

Implementation: `src/components/pin-input/pin-input-cells.tsx`, `src/components/pin-input/pin-value.ts`
Verification: `src/components/pin-input/pin-input.test.tsx`, `src/components/pin-input/pin-value.test.ts`, `e2e/pin-input.spec.ts`

### UIC-PIN-INPUT-2.2 - Backspace

Backspace shall erase the focused cell's character, or in an empty cell the previous cell's, and move focus back one cell, preventing the key's default. Characters after an erased one move up a cell, so the value keeps no gap.

Implementation: `src/components/pin-input/pin-input-cells.tsx`
Verification: `src/components/pin-input/pin-input.test.tsx`, `e2e/pin-input.spec.ts`

### UIC-PIN-INPUT-2.3 - Moving between cells

Left and Right Arrow shall move focus to the previous and next cell (mirrored in a right-to-left locale), Home to the first cell and End to the active cell: the first empty cell, or the last cell once every cell is filled. One cell is in the tab order, the focused cell while focus is in the code and the active cell otherwise, so Tab moves into and out of the code in one step. Focus never lands past the active cell: a press on a later cell focuses the active one. A key that belongs to an input method composition (`isComposing`, or key code 229), as in a text cell, is the input method's: it neither moves focus nor erases.

Implementation: `src/components/pin-input/pin-input-cells.tsx`, `src/components/pin-input/pin-value.ts`
Verification: `src/components/pin-input/pin-input.test.tsx`, `src/components/pin-input/pin-value.test.ts`, `e2e/pin-input.spec.ts`

### UIC-PIN-INPUT-2.4 - Paste

A paste into a cell shall write the pasted characters the cells take over the cells from that one on, keeping the characters after them and dropping what does not fit, and move focus to the cell after the last pasted character (the last cell when it is filled).

Implementation: `src/components/pin-input/pin-input-cells.tsx`, `src/components/pin-input/pin-value.ts`
Verification: `src/components/pin-input/pin-input.test.tsx`, `src/components/pin-input/pin-value.test.ts`, `e2e/pin-input.spec.ts`

### UIC-PIN-INPUT-2.5 - Completion

An edit from the cells whose rendered value is a full code (UIC-PIN-INPUT-2.6) shall commit it and call `onComplete` once with it. Both follow the value the field renders after the caller accepts, changes or refuses the edit: a caller that changes the typed value (to upper case, say) gets its own value back, an edit the caller cuts to a partial code commits nothing until focus leaves the field, an edit it refuses does nothing, and a value the caller sets on its own is not an edit, so it neither completes nor commits. Focus leaving the field also commits the value (UIC-FIELD-1.11); Tab from the cells reaches the restore button first.

Implementation: `src/components/pin-input/pin-input-cells.tsx`
Verification: `src/components/pin-input/pin-input.test.tsx`, `e2e/pin-input.spec.ts`

### UIC-PIN-INPUT-2.6 - Partly filled code

A value shall be checked as it is, whether typed, supplied as `value`, `defaultValue` or `committedValue`, and again when `length` or `type` changes, before the caller's `validate`: a character its cells do not take makes it invalid with the provider string `patternMismatch` (validity `patternMismatch`), then more characters than `length` with `tooLong` and fewer with `tooShort` for the length. The field never rewrites a supplied value: the cells show its first `length` characters, the error blocks a form's submit, and the form value stays the value. An empty value is valid unless the field is required.

Implementation: `src/components/pin-input/pin-input.tsx`, `src/components/pin-input/pin-value.ts`
Verification: `src/components/pin-input/pin-input.test.tsx`, `src/components/pin-input/pin-value.test.ts`, `e2e/pin-input.spec.ts`

### UIC-PIN-INPUT-2.7 - Field behaviour

`PinInput` shall show each validation status, show dirty state with a restore button, undo and redo with the field's chords from its cells, and offer the field menu, whose Clear empties the code.

Implementation: `src/components/pin-input/pin-input.tsx`, `src/components/field/field.tsx`
Verification: `src/components/pin-input/pin-input.test.tsx`, `e2e/pin-input.spec.ts`

### UIC-PIN-INPUT-2.8 - Native deletion

A native deletion that empties a cell, such as Delete or Cut on its selected character or another deleting input event, shall remove that cell's character and keep focus on the cell; characters after it move up a cell, so the value keeps no gap. The new value goes through `onChange`, the field state and the form value like any edit, and a shorter code never calls `onComplete`. An empty cell, a read-only or a disabled field change nothing, and Backspace keeps its own handling (UIC-PIN-INPUT-2.2), erasing once.

Implementation: `src/components/pin-input/pin-input-cells.tsx`
Verification: `src/components/pin-input/pin-input.test.tsx`, `e2e/pin-input.spec.ts`

## Hooks

| Hook                  | Kind  | Values | Description                                                         |
| --------------------- | ----- | ------ | ------------------------------------------------------------------- |
| `ui-pin-input`        | root  |        | The field's root (also `ui-field`).                                 |
| `ui-pin-input__group` | slot  |        | The group of cells (role `group`).                                  |
| `ui-pin-input__cell`  | slot  |        | One cell's `<input>`.                                               |
| `data-complete`       | state | `true` | On the root: every cell holds a character.                          |
| `data-filled`         | state | `true` | On a cell: it holds a character.                                    |
| `data-invalid`        | state | `true` | On the group and the cells: invalid (React Aria).                   |
| `data-disabled`       | state | `true` | On the group and the cells: disabled (React Aria).                  |
| `data-readonly`       | state | `true` | On the group: read-only (React Aria).                               |
| `data-hovered`        | state | `true` | On the group and the cells: under the pointer (React Aria).         |
| `data-focus-within`   | state | `true` | On the group: focus is inside it (React Aria).                      |
| `data-focused`        | state | `true` | On a cell: focused (React Aria).                                    |
| `data-focus-visible`  | state | `true` | On the group and the cells: focused from the keyboard (React Aria). |
