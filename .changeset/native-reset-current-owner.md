---
'@flamboyantengineer/ui-components': patch
---

Controls that reset themselves on a native form reset (SearchField, Checkbox, Switch, SegmentedChoice, Combobox, ColorField, DateTimeField, SignaturePad, FileUpload) now look up their form at each reset, and FileUpload's listed files go into the form data of the form its input belongs to now, so a control moved to another form follows its new owner only.
