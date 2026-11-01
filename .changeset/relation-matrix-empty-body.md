---
'@flamboyantengineer/ui-components': patch
---

`RelationMatrix` without rows leaves out its empty body row group, so the grid holds only its header row and passes the accessibility check for required children.
