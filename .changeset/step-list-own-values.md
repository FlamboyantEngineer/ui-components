---
'@flamboyantengineer/ui-components': patch
---

`StepListEditor` reads a step's own column values only, so columns named `constructor`, `__proto__` or `toString` read a missing value as empty instead of crashing.
