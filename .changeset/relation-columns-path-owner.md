---
'@flamboyantengineer/ui-components': patch
---

An uncontrolled `RelationColumns` path now starts empty on every change of `item`, including a return to an earlier item the reader made no choice in between; before, the earlier item's path came back.
