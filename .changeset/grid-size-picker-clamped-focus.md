---
'@flamboyantengineer/ui-components': patch
---

`GridSizePicker` keeps focus when `maxRows` or `maxColumns` shrinks below the focused cell, or a preview shrinks the grid past it: focus moves to the cell at the clamped preview instead of falling to the page. The clamped size also stays when the bounds grow again.
