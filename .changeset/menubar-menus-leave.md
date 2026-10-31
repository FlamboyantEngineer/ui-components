---
'@flamboyantengineer/ui-components': patch
---

`Menubar` keeps working when the open top-level menu is removed: it forgets the removed menu as open or as a move's destination, moves focus the menu held to the bar's tab stop, and opens the remaining and later menus as before.
