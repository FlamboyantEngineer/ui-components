---
'@flamboyantengineer/ui-components': patch
---

`ConditionBuilder` and `StepListEditor` give nodes and steps they add or duplicate ids that no node or step in the current value holds. A tree or list saved on an earlier page and restored no longer shares an id with the next node or step added, which used to make edits hit the wrong one.
