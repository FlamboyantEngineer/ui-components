# Text Field

`TextField` is a [field](FIELD.md) for a plain string, on one line or several. It is built on React Aria's `TextField` with an `Input` or a `TextArea`, and takes the field's props (`FieldInputProps<string>`) and text input props (`FieldTextInputProps`), so it has a label and layout, validation, dirty state and restore, undo and redo, and the field menu. It commits when focus leaves the field and on Enter, reverts an edit on Escape, and checks length and format with the field's string rules. Adornments and a reveal button for masked text sit inside the input's frame, a text area can grow with its text, and a counter shows the text's length. A query that filters or finds is a [Search Field](SEARCH-FIELD.md), and a number is a [Number Field](NUMBER-FIELD.md).

## UIC-TEXT-FIELD-1 - Contract

### UIC-TEXT-FIELD-1.1 - Field control

`TextField` shall render a `Field` around a text field element, built with `useFieldControl`, and take the field's props: the label, layout, description, help, decoration and menu, the value, default, committed and empty values with `onChange` and `onCommit`, `validate`, `isRequired`, `isReadOnly`, `isDisabled` and `isPending`. Its root element is the field's root, which carries `ui-text-field` beside `ui-field`. Typing changes the value; a field given no value, committed value or default starts empty, and Clear empties it.

Implementation: `src/components/text-field/text-field.tsx`, `src/components/field/field-control.ts`
Verification: `src/components/text-field/text-field.test.tsx`

### UIC-TEXT-FIELD-1.2 - One line or several

`TextField` shall edit one line in an `<input>` (`ui-text-field__input`) inside the text field element (`ui-text-field__box`). With `multiline` it shall edit several lines in a `<textarea>` instead and publish `data-multiline` on its root. `type` (`TextFieldType`: `text` by default, `email`, `password`, `search`, `tel` or `url`) sets a single line's input type. The text input props (UIC-FIELD-8.3: `placeholder`, `autoComplete`, `inputMode`, `spellCheck`, `autoFocus`), the form `name` and the focus and keyboard handlers (`onFocus`, `onBlur`, `onFocusChange`, `onKeyDown`, `onKeyUp`) reach the control.

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

`TextField` shall commit its value when focus leaves the field (UIC-FIELD-1.11) and when Enter is pressed on a single line; Enter in a multiline field inserts a line break, and leaving still commits. Tab from an edited control reaches the restore button without committing. An Enter that confirms an input method composition does not commit. `onCommit` runs only for a value that differs from the committed value, so a repeated Enter or the blur after an Enter commits nothing again.

Implementation: `src/components/text-field/text-field.tsx`, `src/components/text-field/use-text-field-input.ts`
Verification: `src/components/text-field/text-field.test.tsx`, `e2e/text-field.spec.ts`

### UIC-TEXT-FIELD-2.2 - Escape reverts

Escape pressed while the field is dirty shall put the committed value back, prevent the key's default and stop it there, so an enclosing dialog that closes on Escape stays open. With nothing to revert, Escape goes on to the enclosing surface.

Implementation: `src/components/text-field/text-field.tsx`, `src/components/text-field/use-text-field-input.ts`
Verification: `src/components/text-field/text-field.test.tsx`, `e2e/text-field.spec.ts`

### UIC-TEXT-FIELD-2.3 - Length and format

`minLength`, `maxLength`, `pattern` and `trim` shall check the value with `validateString` ([FIELD.md](FIELD.md#uic-field-7---string-rules)) and the provider's messages, before the caller's `validate`. They are not native constraints: a text longer than `maxLength` can be typed or pasted, and the field reports it. After them, an `email` field checks that its trimmed value is one email address (the HTML standard's valid email address) and a `url` field that it is an absolute URL, with the validity `typeMismatch` and the provider's `emailMismatch` or `urlMismatch` message; an empty value is not checked. The field, its form's verdict and a native submit therefore agree, in both validation behaviors.

Implementation: `src/components/text-field/text-field.tsx`
Verification: `src/components/text-field/text-field.test.tsx`, `src/components/text-field/text-field-type.test.tsx`

### UIC-TEXT-FIELD-2.4 - Field behaviour

`TextField` shall show each validation status (invalid, warning and pending), show dirty state with a restore button, undo and redo with the field's chords, and offer the field menu, whose Clear empties the text and Set to default puts the default back.

Implementation: `src/components/text-field/text-field.tsx`, `src/components/field/field.tsx`
Verification: `src/components/text-field/text-field.test.tsx`, `e2e/text-field.spec.ts`

## UIC-TEXT-FIELD-3 - Frame and helpers

### UIC-TEXT-FIELD-3.1 - Adornments

`startAdornment` and `endAdornment` shall render the caller's content (an icon, a unit, a button) before and after the text, in `ui-text-field__start` and `ui-text-field__end`, inside a group (`ui-text-field__group`, role `presentation`) around the input, which publishes `data-framed` and which the reference sheet then frames as one box. Adornments are not part of the value or the control's name. The group is always there, so adding or removing an adornment or the reveal button keeps the same input element, with its focus, selection, composition and the caller's ref; without adornments or a reveal button it has no `data-framed` and the reference sheet lets the input be its own frame (`display: contents`). Content that renders nothing (`null`, `undefined`, a boolean or an empty string) counts as absent; `0` counts as content.

Implementation: `src/components/text-field/text-field.tsx`, `src/components/text-field/text-field-parts.tsx`, `labs/reference/text-field.css`
Verification: `src/components/text-field/text-field.test.tsx`, `e2e/text-field.spec.ts`

### UIC-TEXT-FIELD-3.2 - Revealing masked text

With `allowsReveal` and `type="password"`, the field shall draw a toggle button (`ui-text-field__reveal`, an `Button` in the group) after the text, named by the provider string `revealValue` from the label (`Show <label>`). While pressed (`aria-pressed="true"`, the `eye-slash` glyph) the input shows its text (`type="text"`); otherwise it masks it (the `eye` glyph). A pointer press keeps focus in the input; the button is reached by Tab and works from the keyboard. A disabled field disables it.

Implementation: `src/components/text-field/text-field.tsx`, `src/components/text-field/text-field-parts.tsx`, `src/core/strings.ts`, `src/core/glyphs.tsx`
Verification: `src/components/text-field/text-field.test.tsx`, `e2e/text-field.spec.ts`

### UIC-TEXT-FIELD-3.3 - Growing text area

A multiline field with `minRows` or `maxRows` shall publish `data-autosize` on its root and set its text area's height (a measured size) to its text's, between `minRows` (one by default) and `maxRows` (no limit by default) rows of its line height, as the text changes and again when its width changes or fonts finish loading; past `maxRows` the text area scrolls. `minRows` is also the text area's `rows`. Without either the text area keeps the stylesheet's height: removing both limits gives back the inline height it had before it grew, so the stylesheet (or the caller's own height) sizes it again. With adornments, the frame around the text area grows with it (`labs/reference/text-field.css`), so the text area never overflows onto the label or neighbouring content.

Implementation: `src/components/text-field/text-field.tsx`, `src/components/text-field/text-field-parts.tsx`, `src/utils/use-auto-grow.ts`, `labs/reference/text-field.css`
Verification: `src/components/text-field/text-field.test.tsx`, `e2e/text-field.spec.ts`

### UIC-TEXT-FIELD-3.4 - Character count

With `showCount`, the field shall show the text's length after its description, in `ui-text-field__count` inside the field's description, which describes the control: the provider string `characterCount` (`12/100` against `maxLength`, `12` without one). The count and the length rules count with `getLength` (code points by default, UIC-FIELD-7.4), so a grapheme counter counts a combined emoji once in both; with `trim` both count the text without its leading and trailing whitespace.

Implementation: `src/components/text-field/text-field.tsx`, `src/components/text-field/text-field-parts.tsx`, `src/core/strings.ts`
Verification: `src/components/text-field/text-field.test.tsx`, `e2e/text-field.spec.ts`

## UIC-TEXT-FIELD-4 - Transformed and displayed text

### UIC-TEXT-FIELD-4.1 - Input transform

`transformInput(text)` shall rewrite the control's text after each typed, pasted or dropped edit before it becomes the value, so a field can refuse characters (an identifier, hexadecimal digits) or rewrite them (upper case). The caret stays after the same accepted characters: it lands at the length of the transformed text before the caret. An edit the transform reduces to the current value changes nothing, not even `onChange`. An input method composition goes through untouched and is transformed once it ends. Values set outside an edit (`value`, `defaultValue`, restore, undo, the field menu) are not transformed.

Implementation: `src/components/text-field/text-field.tsx`, `src/components/text-field/use-text-field-input.ts`, `src/components/text-field/use-input-transform.ts`
Verification: `src/components/text-field/use-input-transform.test.tsx`, `src/components/text-field/text-field-type.test.tsx`, `e2e/text-field.spec.ts`

### UIC-TEXT-FIELD-4.2 - Display value

While the control does not have focus, `displayValue` shall be the text it shows, such as a computed result or a formatted quantity, and the root publishes `data-display-value`; focusing the control shows the value for editing. The display value never changes the value, the committed value, dirty state, undo or `onCommit`, and a form submits the value: with `displayValue` and `name`, the value submits through a hidden input under the name and the visible input has none. While an `email` or `url` field shows its display value the input's type is `text`, so the browser checks the value (through the field) and never the display text.

Implementation: `src/components/text-field/text-field.tsx`, `src/components/text-field/use-text-field-input.ts`
Verification: `src/components/text-field/use-input-transform.test.tsx`, `e2e/text-field.spec.ts`

## UIC-TEXT-FIELD-5 - Completions

### UIC-TEXT-FIELD-5.1 - Completion list

With `completions`, a vocabulary or a source ([UIC-COMPLETION-LIST-2.2](COMPLETION-LIST.md#uic-completion-list-22---lookups)), the control shall keep its text box role and focus while a [Completion List](COMPLETION-LIST.md) (also `ui-text-field__completions`) opens in a non-modal popover under the text field element (`ui-text-field__box`), not at the caret, as typing, moving the caret or Ctrl+Space finds completions for the text before the caret. The control autocompletes from the list and names its active option (UIC-COMPLETION-LIST-2.4). A read-only or disabled field offers none, and losing focus closes the list.

Implementation: `src/components/text-field/text-field.tsx`, `src/components/text-field/use-text-field-input.ts`, `src/components/completion-list/text-completions.ts`
Verification: `src/components/text-field/use-text-field-input.test.tsx`, `e2e/text-field.spec.ts`

### UIC-TEXT-FIELD-5.2 - Choosing and inserting

While the list is open, its keys (UIC-COMPLETION-LIST-2.3) shall come before the field's: Enter inserts the active completion without committing, Escape closes the list without reverting, and the caller's `onKeyDown` does not receive them. Inserting replaces the text the completion completes with its `insertText` or label through the field's value, as an edit (so `transformInput` and undo apply where the browser edits natively), and puts the caret after it. A trigger source from `createTriggerCompletions` gives `@` mentions and `#` references.

Implementation: `src/components/text-field/use-text-field-input.ts`, `src/components/completion-list/text-completions.ts`
Verification: `src/components/text-field/use-text-field-input.test.tsx`, `e2e/text-field.spec.ts`

### UIC-TEXT-FIELD-5.3 - Drawn completions

`renderCompletion(completion, { isActive })` shall draw each option's content instead of its label and description, such as a person's avatar and name.

Implementation: `src/components/text-field/text-field.tsx`
Verification: `src/components/text-field/use-text-field-input.test.tsx`, `e2e/text-field.spec.ts`

## UIC-TEXT-FIELD-6 - The control itself

### UIC-TEXT-FIELD-6.1 - Control refs

`inputRef` shall receive the single-line input and `textAreaRef` the multiline text area while that element is on the page, joined to the field's own refs: object and callback refs both work, a ref receives `null` (or runs its cleanup) when its element leaves, including when `multiline` swaps one element for the other, and a re-render with the same ref does not re-attach it. A caller can focus the control and select its text through them.

Implementation: `src/components/text-field/text-field.tsx`, `src/components/text-field/text-field-parts.tsx`
Verification: `src/components/text-field/text-field-parts.test.tsx`, `e2e/text-field.spec.ts`

### UIC-TEXT-FIELD-6.2 - Control events and suggestion ARIA

`controlProps` shall put on the input or text area, not on the field's root, the caller's `onBeforeInput`, `onInput`, `onSelect` and composition handlers and the ARIA of a suggestion list the caller owns (`role="combobox"`, `aria-controls`, `aria-expanded`, `aria-autocomplete`, `aria-activedescendant`, `aria-haspopup` for a suggestion surface that is not a list box, such as a dialog, and `aria-busy` while suggestions load). The field's own handlers run first, so the input transform, caret handling, Enter, Escape and composition keep working (an `input` event carries the browser's edit, which the transform then rewrites), and with `completions` the field's own completion attributes win. The control keeps its id, label and description. The caller's key and focus handlers are the field's `onKeyDown`, `onKeyUp`, `onFocus` and `onBlur`, which already reach the control.

Implementation: `src/components/text-field/text-field-parts.tsx`
Verification: `src/components/text-field/text-field-parts.test.tsx`, `e2e/text-field.spec.ts`

## Hooks

| Hook                         | Kind  | Values | Description                                                           |
| ---------------------------- | ----- | ------ | --------------------------------------------------------------------- |
| `ui-text-field`              | root  |        | The field's root (also `ui-field`).                                   |
| `ui-text-field__box`         | slot  |        | The React Aria text field element around the control.                 |
| `ui-text-field__group`       | slot  |        | The frame around adornments, the input and reveal.                    |
| `ui-text-field__start`       | slot  |        | The start adornment.                                                  |
| `ui-text-field__input`       | slot  |        | The `<input>` or `<textarea>`.                                        |
| `ui-text-field__end`         | slot  |        | The end adornment.                                                    |
| `ui-text-field__reveal`      | slot  |        | The reveal button (also `ui-button`).                                 |
| `ui-text-field__count`       | slot  |        | The character count, inside the field's description.                  |
| `ui-text-field__completions` | slot  |        | The completion list's popover (also `ui-completion-list`).            |
| `data-framed`                | state | `true` | On the group: it holds adornments or a reveal button.                 |
| `data-multiline`             | state | `true` | On the root: the field edits several lines.                           |
| `data-autosize`              | state | `true` | On the root: the text area grows with its text.                       |
| `data-display-value`         | state | `true` | On the root: the control shows the display value, not the value.      |
| `data-invalid`               | state | `true` | On the box, the group and the control: invalid (React Aria).          |
| `data-required`              | state | `true` | On the box: a value is required (React Aria).                         |
| `data-readonly`              | state | `true` | On the box: read-only (React Aria).                                   |
| `data-disabled`              | state | `true` | On the box, the group and the control: disabled (React Aria).         |
| `data-hovered`               | state | `true` | On the group and the control: under the pointer (React Aria).         |
| `data-focus-within`          | state | `true` | On the group: focus is inside it (React Aria).                        |
| `data-focused`               | state | `true` | On the control: focused (React Aria).                                 |
| `data-focus-visible`         | state | `true` | On the group and the control: focused from the keyboard (React Aria). |
