---
'@flamboyantengineer/ui-components': minor
---

Dropdown popovers (`ComboBox`, `SelectField`, `RelativeDateField`, `CompletionList` and `TreeSelectField`) publish the width of the element they open from as `--ui-trigger-width`, so stylesheets size lists without naming React Aria's `--trigger-width`.
