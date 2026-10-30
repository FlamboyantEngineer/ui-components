---
'@flamboyantengineer/ui-components': patch
---

A `Wizard` check that passes now finishes through the `onFinish` it started with, never one a later render passed for another record with the same step IDs. Key a wizard by its record (`key={record.id}`) so switching records aborts a check still running.
