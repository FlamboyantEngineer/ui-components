---
'@flamboyantengineer/ui-components': patch
---

Menus and non-modal popovers close only on a scroll the reader makes after they open. A scroll still settling from keyboard moves, such as a ChatList row menu opened right after moving through the rows, no longer closes them as they open.
