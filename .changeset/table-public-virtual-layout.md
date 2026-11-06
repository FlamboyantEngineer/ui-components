---
'@flamboyantengineer/ui-components': patch
---

A virtualized `Table` builds on React Aria's public table layout API only. Its group header row and its summary row, which stays in the document wherever the table scrolls, no longer reach into protected members of the layout, so React Aria updates within the supported range keep them working.
