---
'@flamboyantengineer/ui-components': minor
---

Add `renderColumnActions` to `Board`: it draws the caller's controls, such as a menu or an icon button, at the end of each column header in a new `ui-board__column-actions` slot, called with the column's own entry of `columns`. A column without actions renders no slot. The controls stay in the tab order (also in a collapsed column), and pressing them never collapses the column, activates a card or starts a column drag.
