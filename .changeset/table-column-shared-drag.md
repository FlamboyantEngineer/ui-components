---
'@flamboyantengineer/ui-components': minor
---

Table column reordering now uses the shared item drag: a data column header wraps its label, sort glyph and filter in a new `ui-table__column-content` slot that takes dropped columns, and a dragging header publishes `data-dragging`. Column drags carry a drag type of their own table and the column's name as text. `useItemDrag` also returns its source and target props apart.
