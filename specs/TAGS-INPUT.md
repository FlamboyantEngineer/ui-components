# Tags Input

`TagsInput` is a [field](FIELD.md) for a list of free-text values. The reader types a value and presses Enter or a delimiter, or pastes a list, and each value becomes a tag in the library's [Tag Group](TAG-GROUP.md), before the text input in one frame. It takes the field's props (`FieldInputProps<string[]>`), so it has a label and layout, a description, validation, dirty state and restore, undo and redo, and the field menu. It caps the number of tags, refuses duplicates and checks each tag before adding it, showing why it refused one as the field's error. Values picked from suggestions are a multiple [Combobox](COMBOBOX.md) (with `onCreateOption` for new ones); values picked from a fixed list are a multiple [Select Field](SELECT-FIELD.md).

## UIC-TAGS-INPUT-1 - Contract

### UIC-TAGS-INPUT-1.1 - Field control

`TagsInput` shall render a `Field` around a frame (`ui-tags-input__group`, a React Aria `Group` with role `presentation`) that holds the tags and then a text input (`ui-tags-input__input`, a React Aria `Input`), built with `useFieldControl`. Its root element is the field's root, which carries `ui-tags-input` beside `ui-field`. The value is the list of tags, in the order they were added: a field given no value, committed value or default starts with none, and Clear empties it. The tags show in the library's `TagGroup` (`ui-tags-input__tags`, also `ui-tag-group`), one `Tag` per value, which renders only while there is a tag. Adding or removing tags sets the new list and commits it.

Implementation: `src/components/tags-input/tags-input.tsx`, `src/components/tags-input/tags-input-parts.tsx`, `labs/reference/tags-input.css`
Verification: `src/components/tags-input/tags-input.test.tsx`, `e2e/tags-input.spec.ts`

### UIC-TAGS-INPUT-1.2 - Form value

With `name`, a form shall submit each tag under that name, in order, through one hidden input per tag; a disabled field submits nothing, and neither does text typed but not added. The name also shows the nearest form's external errors for it (UIC-FIELD-3.9).

Implementation: `src/components/tags-input/tags-input-parts.tsx`
Verification: `src/components/tags-input/tags-input.test.tsx`, `e2e/tags-input.spec.ts`

### UIC-TAGS-INPUT-1.3 - Accessibility

The input shall be the field's control: named by the field label, described by the field's description, decoration and message, carrying `aria-required` while required and `aria-invalid` with `aria-errormessage` while invalid, natively read-only or disabled while the field is. It is the element a restore, a form's submit validation and the native behavior's custom validity (UIC-FIELD-3.10) use. The tag group is named by the provider string `selectedValues` from the label ("Fruit selected values"). While invalid, disabled or read-only, the frame publishes React Aria's `data-invalid`, `data-disabled` or `data-readonly`.

Implementation: `src/components/tags-input/tags-input-parts.tsx`, `src/core/field-strings.ts`
Verification: `src/components/tags-input/tags-input.test.tsx`, `e2e/tags-input.spec.ts`

### UIC-TAGS-INPUT-1.4 - Hooks and caller attributes

`TagsInput` shall carry the hooks below on top of the field's and the tag group's, append the caller's `className` to its root and forward caller `data-*` attributes to it. A caller `id` goes on the root, and the input's id derives from it (`<id>-control`).

Implementation: `src/components/tags-input/tags-input.tsx`
Verification: `src/components/tags-input/tags-input.test.tsx`

## UIC-TAGS-INPUT-2 - Entering tags

### UIC-TAGS-INPUT-2.1 - Enter and delimiters

Enter in the input shall add its text as tags and prevent the key's default, so an enclosing form does not submit; with nothing but spaces typed Enter does nothing and goes on to the form. Typing one of `delimiters` (a comma by default) shall add the text before it as tags and leave the text after the last delimiter in the input. Each tag is the text between delimiters without its surrounding spaces; empty pieces add nothing. An Enter that confirms an input method composition adds nothing.

Implementation: `src/components/tags-input/tags-input.tsx`, `src/components/tags-input/tags-input-parts.tsx`, `src/components/tags-input/tag-entry.ts`
Verification: `src/components/tags-input/tags-input.test.tsx`, `src/components/tags-input/tag-entry.test.ts`, `e2e/tags-input.spec.ts`

### UIC-TAGS-INPUT-2.2 - Pasting a list

Pasted text that holds a delimiter or a line break shall replace the input's selection and be added whole as tags, split at every delimiter and line break; pasted text without one pastes into the input as typed text.

Implementation: `src/components/tags-input/tags-input-parts.tsx`, `src/components/tags-input/tag-entry.ts`
Verification: `src/components/tags-input/tags-input.test.tsx`, `src/components/tags-input/tag-entry.test.ts`, `e2e/tags-input.spec.ts`

### UIC-TAGS-INPUT-2.3 - Typed text

The input's text shall be the caller's `inputValue` when given, else the field's own, and every change (typing, and the text left after tags are added) shall call `onInputChange` with the new text. `placeholder` shows while the input is empty.

Implementation: `src/components/tags-input/tags-input.tsx`, `src/core/controllable-state.ts`
Verification: `src/components/tags-input/tags-input.test.tsx`

### UIC-TAGS-INPUT-2.4 - Adding on blur

With `addOnBlur`, the input's text shall be added as tags when focus leaves the input for anything but the tags and their buttons, as Enter would add it. Without it the text stays in the input.

Implementation: `src/components/tags-input/tags-input-parts.tsx`
Verification: `src/components/tags-input/tags-input.test.tsx`, `e2e/tags-input.spec.ts`

## UIC-TAGS-INPUT-3 - Refusing tags

### UIC-TAGS-INPUT-3.1 - Refusal

The field shall refuse a tag it would hold past `maxValues` (UIC-TAGS-INPUT-3.2), one equal to a tag it holds (UIC-TAGS-INPUT-3.3), or one `validateTag` refuses (UIC-TAGS-INPUT-3.4), checking each tag of an entry against the tags before it. The other tags of the entry are added; the refused ones stay in the input, joined by the first delimiter and followed by the text still being typed, so the reader can correct them. While the input holds that text and its first refused tag would still be refused, the field shows the refusal as an error with its message, whatever its validation mode (the refusal reveals the field's validation, UIC-FIELD-3.7) and ahead of a required field's own message; changing the text, or removing the tag it duplicates, clears it. Like any error it blocks a form's submit.

Implementation: `src/components/tags-input/tags-input.tsx`, `src/components/tags-input/tag-entry.ts`
Verification: `src/components/tags-input/tags-input.test.tsx`, `src/components/tags-input/tag-entry.test.ts`, `e2e/tags-input.spec.ts`

### UIC-TAGS-INPUT-3.2 - Maximum count

With `maxValues`, a tag that would take the field past that many tags shall be refused with the provider string `tooManyValues` ("Add up to 3 values.", validity `rangeOverflow`). A value the caller sets is not cut.

Implementation: `src/components/tags-input/tag-entry.ts`, `src/core/field-strings.ts`
Verification: `src/components/tags-input/tags-input.test.tsx`, `src/components/tags-input/tag-entry.test.ts`, `e2e/tags-input.spec.ts`

### UIC-TAGS-INPUT-3.3 - Duplicates

A tag equal to one the field holds (compared exactly, after trimming) shall be refused with the provider string `duplicateValue` (“Apple” is already added., validity `customError`), unless `allowsDuplicates` is set. Equal tags then show as separate tags, each removable on its own.

Implementation: `src/components/tags-input/tag-entry.ts`, `src/components/tags-input/tags-input-parts.tsx`, `src/core/field-strings.ts`
Verification: `src/components/tags-input/tags-input.test.tsx`, `src/components/tags-input/tag-entry.test.ts`

### UIC-TAGS-INPUT-3.4 - Tag validation

`validateTag(tag)` shall check each tag before it is added: a returned message refuses the tag and is the refusal's message (validity `customError`); `null`, `undefined` or an empty message accepts it. It runs during render and must be pure. Checks of the whole list stay with the field's `validate`.

Implementation: `src/components/tags-input/tag-entry.ts`
Verification: `src/components/tags-input/tags-input.test.tsx`, `src/components/tags-input/tag-entry.test.ts`, `e2e/tags-input.spec.ts`

## UIC-TAGS-INPUT-4 - Keyboard and focus

### UIC-TAGS-INPUT-4.1 - Moving between the input and the tags

Backspace in an empty input, and Left Arrow with the caret at the start of the input (Right Arrow in a right-to-left locale), shall move focus to the last tag. In the tags the arrow keys, Home and End move as in a tag group (UIC-TAG-GROUP-2.1), except that the arrow key toward the input on the last tag moves focus back to the input instead of wrapping to the first tag.

Implementation: `src/components/tags-input/tags-input-parts.tsx`
Verification: `src/components/tags-input/tags-input.test.tsx`, `e2e/tags-input.spec.ts`

### UIC-TAGS-INPUT-4.2 - Removing tags

On an editable field each tag shall offer the tag group's remove button, and Delete or Backspace on a focused tag removes it (UIC-TAG-GROUP-2.2); after a removal focus returns to the input, so Backspace twice from an empty input removes the last tag. A read-only field's tags stay focusable and offer no removal; a disabled field's tags are disabled and leave the tab order.

Implementation: `src/components/tags-input/tags-input-parts.tsx`
Verification: `src/components/tags-input/tags-input.test.tsx`, `e2e/tags-input.spec.ts`

### UIC-TAGS-INPUT-4.3 - Pointer

A press on the frame outside the tags and the input shall move focus to the input.

Implementation: `src/components/tags-input/tags-input-parts.tsx`
Verification: `src/components/tags-input/tags-input.test.tsx`, `e2e/tags-input.spec.ts`

### UIC-TAGS-INPUT-4.4 - Field behaviour

`TagsInput` shall show each validation status of its list (a required field with no tag is invalid, UIC-FIELD-3.1), refuse every change while read-only or disabled, show dirty state with a restore button, undo and redo with the field's chords from the input, and offer the field menu, whose Clear empties the list.

Implementation: `src/components/tags-input/tags-input.tsx`, `src/components/field/field.tsx`
Verification: `src/components/tags-input/tags-input.test.tsx`, `e2e/tags-input.spec.ts`

## Hooks

| Hook                   | Kind  | Values | Description                                                         |
| ---------------------- | ----- | ------ | ------------------------------------------------------------------- |
| `ui-tags-input`        | root  |        | The field's root (also `ui-field`).                                 |
| `ui-tags-input__group` | slot  |        | The frame around the tags and the input (role `presentation`).      |
| `ui-tags-input__tags`  | slot  |        | The tags (also `ui-tag-group`); absent while there is none.         |
| `ui-tags-input__input` | slot  |        | The text `<input>`.                                                 |
| `data-invalid`         | state | `true` | On the group and the input: invalid (React Aria).                   |
| `data-disabled`        | state | `true` | On the group and the input: disabled (React Aria).                  |
| `data-readonly`        | state | `true` | On the group: read-only (React Aria).                               |
| `data-hovered`         | state | `true` | On the group and the input: under the pointer (React Aria).         |
| `data-focus-within`    | state | `true` | On the group: focus is inside it (React Aria).                      |
| `data-focused`         | state | `true` | On the input: focused (React Aria).                                 |
| `data-focus-visible`   | state | `true` | On the group and the input: focused from the keyboard (React Aria). |
