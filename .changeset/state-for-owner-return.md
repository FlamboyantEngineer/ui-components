---
'@flamboyantengineer/ui-components': patch
---

`SearchPane` follows the current result again when it returns to a result whose page was turned with Show earlier or Show more, instead of restoring that obsolete page without the current row. The comparison views that keep state for their inputs (`TextDiff`, `TreeCompare`, `RedlineCompare`, `MergeView`) likewise start over when their inputs change back.
