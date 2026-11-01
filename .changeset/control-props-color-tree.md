---
'@flamboyantengineer/ui-components': minor
---

`ColorField` takes `autoComplete`, `inputMode`, `spellCheck` and `enterKeyHint` for its typed input, with `placeholder` picked from the shared text-entry props. The `ColorField` and tree `SelectField` triggers now take their control props from `toAriaControlProps`. `SelectField`'s `placeholder` now uses the shared `FieldTextInputProps` type.
