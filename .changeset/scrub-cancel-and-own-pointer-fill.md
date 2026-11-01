---
'@flamboyantengineer/ui-components': patch
---

Discard gestures that do not finish: a cancelled `NumberField` scrub puts its start value back without a commit, a value the host sets mid-scrub abandons the scrub, and a `Table` fill or range drag extends only from the pointer that started it.
