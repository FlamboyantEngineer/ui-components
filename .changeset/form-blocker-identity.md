---
'@flamboyantengineer/ui-components': patch
---

FormValidity hands out a new blocker when a field is replaced by one with the same label and error, so its `focus()` reaches the mounted field; a field's asynchronous check no longer runs again, unreported, when only `validationDebounce` changes after it settled.
