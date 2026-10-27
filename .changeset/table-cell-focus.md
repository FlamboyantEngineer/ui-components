---
'@flamboyantengineer/ui-components': patch
---

`Table` keeps focus on a control inside a cell, such as a row action in a nested row, when it takes focus by keyboard, pointer or `focus()`. The grid no longer moves focus back to the row it focused last or to the first row, and the control keeps focus while it turns pending or unavailable and while rows are appended.
