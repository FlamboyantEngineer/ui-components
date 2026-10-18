---
'@flamboyantengineer/ui-components': minor
---

Declare the props of the field base, the text and choice fields and the field widgets in the library's own terms, so no public type exposes a building block.

- `FieldTextInputProps` (new): the text input props every text control shares (`placeholder`, `autoComplete`, `inputMode` as `FieldInputMode`, `spellCheck` as a boolean, `autoFocus`). `TextField` and `SearchField` take it.
- New types: `TextFieldType`, `SearchFieldValidate`, `NumberFieldCommitBehavior`, `RadioRenderState`, `FormMethod`, `FieldInputMode`.
- `Radio` declares `render` as `ElementRender<'div', RadioRenderState>`.
- `Checkbox` declares `slot="selection"` for the selection checkbox of a list row, tree row or card, and `validationBehavior`.

Breaking:

- `TextField`, `SearchField`, `NumberField`, `CheckboxGroup`, `RadioGroup`, `Radio`, `Slider`, `RangeSlider`, `Checkbox`, `Switch`, `Form`, `CodeEditor`, `FileUpload` and `EmojiPicker` no longer take the building block's undocumented props; each takes only the props its spec lists.
- `TextField` and `SearchField`: `spellCheck` is a boolean (was the string `'true'` or `'false'`). `TextField`'s `type` is one of `text`, `email`, `password`, `search`, `tel` or `url`.
- `SearchField`: `errorMessage` is content only (no function of the validation); `validate` returns a message, a list of messages, `true` or nothing.
- `RadioGroup`, `CheckboxGroup`: `form`, `onFocus` and `onBlur` are gone.
- `Slider`, `RangeSlider`: only `minValue`, `maxValue`, `step`, `orientation`, `formatOptions` and `aria-details` remain of the building block's props; DOM event props are gone.
- `Form`: only `action`, `method`, `onSubmit`, the labelling props and the validation props remain; `encType`, `target`, `onReset`, `onInvalid` and the other form attributes are gone.
- `CodeEditor`: `readOnly`, `disabled` and `aria-invalid` are now `isReadOnly`, `isDisabled` and `isInvalid`; `isRequired` sets `aria-required`. Spelling, autocorrection, autocapitalization and autocomplete are always off, and only `onFocus`, `onBlur`, `onKeyDown` and `onKeyUp` reach the text area.
- `EmojiPicker`, `EmojiPickerTrigger`: only the labelling props remain of the dialog's props.
- `FileUpload`: `onRemove` and `FileUploadItem.id` use the library `Key`; `allowsMultiple` and `acceptDirectory` are plain booleans.
