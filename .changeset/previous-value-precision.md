---
'@flamboyantengineer/ui-components': patch
---

DateTimeField writes its previous value at the editor's granularity and hour cycle, so a change of seconds shows in it. `formatDateValue` takes an optional `hourCycle`.
