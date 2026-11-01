---
'@flamboyantengineer/ui-components': minor
---

A collapsed `Board` column now keeps its cards, mounted and in order, drawn as narrow as the column. `renderCard` receives a second argument, `{ isColumnCollapsed }` (the new `BoardCardState` type), so a caller can draw a shorter card. Cards move into and out of a collapsed column by drag and drop and Alt+Arrow keys like any other column. A collapsed cell draws no add-card button and no empty state.
