---
'@flamboyantengineer/ui-components': patch
---

FolderManager keeps its root and draft rows apart from the caller's folder keys: a folder keyed like either row renders, selects and reports its own key, numeric and text keys of the same digits stay distinct, and a drop inside the root row is reported as a move to the end of the top level.
