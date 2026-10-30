---
'@flamboyantengineer/ui-components': patch
---

`Wizard` ties each Next or Finish to its step and workflow: unmounting, showing another step or replacing the steps while a check runs aborts the `AbortSignal` that `validate` now receives, and the check's late answer no longer moves, shows a failure or calls `onFinish`. An `onFinish` already started keeps running, but its outcome is ignored once the wizard has left it.
