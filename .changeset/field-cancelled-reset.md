---
'@flamboyantengineer/ui-components': patch
---

Fields respect a cancelled native form reset: a reset any listener cancels with `preventDefault` (such as while confirming whether to discard edits) leaves every field's value, `onChange` and state unchanged, including controls built on React Aria, which reset themselves before a React `onReset` handler runs. An uncancelled reset still puts each field's initial value back.
