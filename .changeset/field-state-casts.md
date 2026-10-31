---
'@flamboyantengineer/ui-components': patch
---

The field family passes its field state to its parts without type-erasing casts, so a change to the field state's shape is type checked at every control.
