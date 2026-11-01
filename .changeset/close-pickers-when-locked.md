---
'@flamboyantengineer/ui-components': patch
---

Combobox, PeoplePicker and RelativeDateField close an open list for good when they turn disabled or read-only (by their own props or a disabled fieldset): the close is reported through `onOpenChange(false)` and unlocking leaves the list closed.
