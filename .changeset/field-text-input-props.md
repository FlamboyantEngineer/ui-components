---
'@flamboyantengineer/ui-components': minor
---

Every field control now takes `autoFocus` through `Field`, and the text controls share `FieldTextInputProps`: `NumberField`, `PinInput`, `TagsInput`, `CodeEditor` and `RelativeDateField` take documented parts of it instead of their own declarations, and every text control takes the new `enterKeyHint` (`FieldEnterKeyHint`). `PinInput`'s `autoComplete` is now a string, and `SelectField` drops its own `autoFocus` declaration for the field's.
