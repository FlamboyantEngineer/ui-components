---
'@flamboyantengineer/ui-components': minor
---

Field controls take `form`, the id of a native form: every input they submit or validate with (hidden values, range endpoints, slider thumbs, radio and checkbox groups) names it, so a field outside the form takes part in its data, reset and native validity, and a missing id leaves it in no form. `Combobox`, `SegmentedChoice`, `Switch` and `FileUpload` take `form` too.
