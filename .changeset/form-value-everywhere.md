---
'@flamboyantengineer/ui-components': patch
---

ColorField, SelectField (list and tree), Combobox, SegmentedChoice, SignaturePad and RichTextEditor submit their form values through `FieldFormValue`, so every field control submits the same way.
