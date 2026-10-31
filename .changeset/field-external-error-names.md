---
'@flamboyantengineer/ui-components': patch
---

A field keeps each name's external errors apart: renaming a field shows the new name's errors instead of inheriting a cleared state, and names such as `constructor` read only the error map's own entries instead of crashing.
