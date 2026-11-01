---
'@flamboyantengineer/ui-components': patch
---

Wizard keeps a failed check with the step and workflow that produced it: a host moving the step through `currentKey`, removing the step or replacing the steps no longer shows the old failure's message or error status on another step.
