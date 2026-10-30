---
'@flamboyantengineer/ui-components': patch
---

A field's `validateAsync` that throws before returning its promise now settles like a rejected check: the field stops showing it is validating, reports no issue, and its form no longer waits for it.
