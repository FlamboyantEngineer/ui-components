---
'@flamboyantengineer/ui-components': minor
---

`SearchField` draws the same structure in both label layouts: the `ui-search-field__group` box is now there in the `control-only` layout too, and the root no longer is the box. A label layout change keeps the input element, with its text, selection, focus and `inputRef`. Stylesheets that framed the root should frame the group.
