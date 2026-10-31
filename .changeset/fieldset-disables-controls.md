---
'@flamboyantengineer/ui-components': patch
---

A disabled `Fieldset` or `Form` now disables the library controls outside the field base too: `Checkbox`, `Switch`, `SegmentedChoice`, `Combobox`, `SearchField` and `InlineEdit` publish `data-disabled`, and `GridSizePicker` and `ColorSwatchPicker` items refuse picks. The field package exports `useScopedDisabled` for this.
