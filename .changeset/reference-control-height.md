---
'@flamboyantengineer/ui-components': minor
---

The reference stylesheet resolves each control's size to one `--ref-control-height` property on its `data-size` root, replacing the per-family height aliases (`--ref-field-height`, `--ref-combobox-height`, `--ref-search-field-height`, `--ref-formula-bar-height` and `--zoom-slider-height`), so overriding a step of the control scale moves every control of that size.
