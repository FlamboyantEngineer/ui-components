---
'@flamboyantengineer/ui-components': patch
---

`RelationMatrix` keeps its focused cell with its row and column items when `rows` or `columns` reorder, grow or are filtered, and Enter, Space and the movement keys act from the cell that holds focus. Before, a reorder made Enter report the item now at the old place. When the focused item goes, the cell now at its place takes focus.
