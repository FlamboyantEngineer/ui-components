---
'@flamboyantengineer/ui-components': minor
---

Add `TagsInput` and `PinInput` field controls.

- `TagsInput` (new): a field for a list of free-text values (`FieldInputProps<string[]>`) shown as the library's `TagGroup` before a text input. Enter, `delimiters` (a comma by default) and pasted lists add tags; `maxValues`, duplicate refusal (`allowsDuplicates` to accept them) and `validateTag` refuse a tag, which stays in the input while the field shows why; `addOnBlur`; controlled typed text with `inputValue` and `onInputChange`; `placeholder`; `name` submits each tag. Backspace and the arrow keys move between the input and the tags, and removing a tag returns focus to the input. Hooks: `ui-tags-input`, `__group`, `__tags`, `__input`.
- `PinInput` (new): a fixed-`length` code in single-character cells (`FieldInputProps<string>`) with `type` (`numeric`, `alphanumeric`, `alphabetic`), `mask`, `placeholder`, `autoComplete` on the first cell (`one-time-code`), `onComplete` and `name` (one hidden input with the joined value). Typing advances, Backspace erases and moves back, the arrows, Home and End move, and a paste fills from the focused cell; a partly filled code reports `tooShort`. Hooks: `ui-pin-input`, `__group`, `__cell`, `data-complete`, `data-filled`.
- Provider strings: `duplicateValue`, `tooManyValues` and `characterPosition`.
