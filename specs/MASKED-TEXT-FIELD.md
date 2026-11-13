# Masked Text Field

`MaskedTextField` is a [Text Field](TEXT-FIELD.md) with a fixed token mask, such as `(999) 999-9999` or `AAA-9999`, for text whose shape is known: its value is the raw characters the mask's slots hold, and the input shows them formatted with the mask's literal separators. It takes the text field's props but those of a multiline, completing, counted or revealed field, so it has a label and layout, validation, dirty state and restore, undo and redo, and the field menu. The mask only shapes the text: what the characters mean (a country's phone numbers, a checksum) is the host's to validate. The mask code lives in its own module, so a plain `TextField` does not carry it.

## UIC-MASKED-TEXT-FIELD-1 - Mask and values

### UIC-MASKED-TEXT-FIELD-1.1 - Mask

`mask` shall be a pattern of slots and literals: `9` takes a digit, `a` a letter, `A` a letter written in upper case and `*` a letter or a digit; every other character is a literal separator, and `\` makes the next character a literal (`\9`). `tokens` replaces the default tokens (`defaultMaskTokens`) with the caller's, each a one-character `pattern` with an optional `transform`. The field renders a `TextField` whose root also carries `ui-masked-text-field`; without a `placeholder` it shows the mask with `_` in each slot (`(___) ___-____`), and without an `inputMode` a mask of digit slots only asks for the numeric keyboard.

Implementation: `src/components/masked-text-field/masked-text-field.tsx`, `src/components/masked-text-field/text-mask.ts`
Verification: `src/components/masked-text-field/text-mask.test.ts`, `src/components/masked-text-field/masked-text-field.test.tsx`, `e2e/masked-text-field.spec.ts`

### UIC-MASKED-TEXT-FIELD-1.2 - Raw value and formatted text

The value shall be the raw characters, in slot order and after each token's transform, without any literal: `5551234567` for `(555) 123-4567`. `value`, `defaultValue`, `committedValue`, `onChange`, `onCommit` and `validate` all take and give raw values. The input shows the formatted text: each character in its slot, and each literal written once a slot after it is filled, so a partial value never ends in a separator (`(555`, then `(555) 1`). Reading a text through the mask keeps, character by character, the literal at its place and each character the next slot accepts, and drops the rest; characters past the last slot are dropped. A value the host gives (`value`, `defaultValue`, `committedValue`) is read as raw first: when it is no longer than the mask's slots and each character is one its slot accepts, in order, it is the raw value, else it is read through the mask as typed text. So a raw or a formatted value shows alike, also when a literal is a character a slot accepts (`ICE` under `ID-AAA` shows `ID-ICE`), and the host's value is kept as given until an edit.

Implementation: `src/components/masked-text-field/masked-text-field.tsx`, `src/components/masked-text-field/text-mask.ts`
Verification: `src/components/masked-text-field/text-mask.test.ts`, `src/components/masked-text-field/masked-text-field.test.tsx`

### UIC-MASKED-TEXT-FIELD-1.3 - Completeness

A value shall be complete when it fills every slot; the root then publishes `data-complete`. A value that is neither empty nor complete reports the provider's `maskIncomplete` message with the validity `patternMismatch`, before the caller's `validate`, and shows as the field shows any error (UIC-FIELD-4); an empty value passes, and requiring one is the field's (`isRequired`).

Implementation: `src/components/masked-text-field/masked-text-field.tsx`, `src/core/strings.ts`
Verification: `src/components/masked-text-field/text-mask.test.ts`, `src/components/masked-text-field/masked-text-field.test.tsx`, `e2e/masked-text-field.spec.ts`

### UIC-MASKED-TEXT-FIELD-1.4 - Form value

With `name`, the field shall submit the raw value (`formValue="raw"`, the default) through a hidden input beside the field, or the formatted text (`formValue="formatted"`) from the input itself. A disabled field submits nothing, nor does one inside a disabled fieldset or form scope.

Implementation: `src/components/masked-text-field/masked-text-field.tsx`
Verification: `src/components/masked-text-field/masked-text-field.test.tsx`, `e2e/masked-text-field.spec.ts`

## UIC-MASKED-TEXT-FIELD-2 - Editing

### UIC-MASKED-TEXT-FIELD-2.1 - Typing and the caret

Typing, pasting, dropping and autofill shall edit the input natively and then read the text through the mask (the text field's input transform, UIC-TEXT-FIELD-4.1), so a character no slot takes at its place changes nothing, and a selection is replaced by what is typed or pasted. The caret stays after the same accepted characters: after the character just typed, before the literals that follow it. Literal separators stay where the mask puts them as characters come and go.

Implementation: `src/components/masked-text-field/masked-text-field.tsx`, `src/components/text-field/use-input-transform.ts`
Verification: `src/components/masked-text-field/masked-text-field.test.tsx`, `e2e/masked-text-field.spec.ts`

### UIC-MASKED-TEXT-FIELD-2.2 - Backspace and Delete

Backspace with a collapsed caret right after one or more literals shall remove the nearest slot character before them, and Delete right before literals the nearest slot character after them, putting the caret where that character was; elsewhere both keys delete natively. A key with a selection deletes the selection natively.

Implementation: `src/components/masked-text-field/masked-text-field.tsx`, `src/components/masked-text-field/text-mask.ts`
Verification: `src/components/masked-text-field/text-mask.test.ts`, `src/components/masked-text-field/masked-text-field.test.tsx`, `e2e/masked-text-field.spec.ts`

### UIC-MASKED-TEXT-FIELD-2.3 - Composition, autofill and replacements

An input method composition shall go through untouched and be read through the mask once it ends, and keys that belong to a composition are not handled as Backspace or Delete. A value the browser autofills is read like a paste. A controlled value the host replaces shows formatted at once.

Implementation: `src/components/masked-text-field/masked-text-field.tsx`, `src/components/text-field/use-input-transform.ts`
Verification: `src/components/masked-text-field/masked-text-field.test.tsx`, `e2e/masked-text-field.spec.ts`

### UIC-MASKED-TEXT-FIELD-2.4 - Field behaviour

Enter and leaving the field shall commit, Escape revert, and undo and redo step through raw values with the field's chords, as in a text field (UIC-TEXT-FIELD-2). A read-only field refuses edits, Backspace and Delete included, and a disabled one is natively disabled. Each field holds its own value, so several masked fields on a page are independent. The field appends the caller's `className` to its root and forwards `ref`, `id` and caller `data-*` attributes as a text field does.

Implementation: `src/components/masked-text-field/masked-text-field.tsx`
Verification: `src/components/masked-text-field/masked-text-field.test.tsx`

## Hooks

The control's hooks are the [Text Field](TEXT-FIELD.md#hooks)'s.

| Hook                   | Kind  | Values | Description                              |
| ---------------------- | ----- | ------ | ---------------------------------------- |
| `ui-masked-text-field` | root  |        | The field's root (also `ui-text-field`). |
| `data-complete`        | state | `true` | On the root: the value fills every slot. |
