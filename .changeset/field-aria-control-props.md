---
'@flamboyantengineer/ui-components': minor
---

Every field control takes its id, naming, description and states from `toAriaControlProps`. `FileUpload` gains `commandId`, the id of its chooser button, and `FileField` gives it the control id, so the field's label now points at the command. `SelectField` and `RelativeDateField` now forward `aria-errormessage` and the read-only state to their select.
