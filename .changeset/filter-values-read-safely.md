---
'@flamboyantengineer/ui-components': patch
---

`FilterBar` and `ConditionBuilder` editors show a condition value of the wrong shape as an empty value instead of crashing. That covers `null` for a choice or person list, a value saved in an older shape, or a value kept after a field's type changed. Such a condition, or one whose operator the field no longer offers, stays incomplete and filters nothing until it is edited.
