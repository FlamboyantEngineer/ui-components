---
'@flamboyantengineer/ui-components': patch
---

Completions close the options kept open while a lookup was pending when that lookup rejects or throws, instead of leaving the previous answer on screen; the failure of a replaced lookup changes nothing.
